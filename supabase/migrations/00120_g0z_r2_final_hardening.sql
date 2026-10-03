-- ============================================================
-- G0-Z-R2 FINAL HARDENING（裁定 2026-10-03；G0 最后一个安全批次）
--
-- R2-1 profiles 改 allowlist 权限模型
--   PostgreSQL 权限叠加语义：table-level UPDATE 之下，列级 REVOKE 无法
--   扣除敏感列。故撤销 table-level INSERT/UPDATE，只白名单授回非敏感列。
--   role/tenant_id 永不授予客户端；profile 创建由 handle_new_user
--   （SECURITY DEFINER）负责。
--
-- R2-2 邀请码 hash-only + 一次性明文 + 关闭直接 INSERT
--   新列 token_hash/token_hint；新 RPC create_invitation（CSPRNG 生成、
--   只存 sha256(token)、明文仅创建时返回一次）；redeem 按 hash 查询；
--   authenticated 直接 INSERT 邀请码 = DENY（every valid invite must be
--   server-generated）；管理员对 invitation_codes 仅可 UPDATE(status)
--   （撤销），used_count 等不可改。
--
-- R2-3 存量低熵邀请码全量退休
--   char_length < 16 的码 status='revoked' 且明文脱敏（RETIRED_ 前缀）。
--
-- R2-4 签名不可篡改
--   contract_signatures 无 UPDATE 策略 = UPDATE/upsert 覆盖 DENY（显式断言）；
--   DELETE 收紧为仅 DRAFT 合同（FINALIZED 签名 immutable，作废走业务事件）。
--
-- 附：admin_assign_member_role owner 修正为 membership_issuer_owner
--    （00117 创建时 owner 为 postgres，不符合专用主体原则）。
-- ============================================================

-- ================= R2-1 =================
REVOKE INSERT, UPDATE ON public.profiles FROM authenticated;
REVOKE INSERT, UPDATE ON public.profiles FROM PUBLIC;
-- 白名单：普通用户确实允许自助修改的非敏感列（role/tenant_id 永不授回）
GRANT UPDATE (name, avatar_url, phone, email, wechat_nickname, wechat_avatar)
  ON public.profiles TO authenticated;
-- profile 创建唯一路径=handle_new_user（DEFINER）；删除客户端自插策略
DROP POLICY IF EXISTS "用户可以创建自己的profile" ON profiles;
DROP POLICY IF EXISTS "系统可以创建profile" ON profiles;

-- ================= R2-2 =================
ALTER TABLE public.invitation_codes
  ADD COLUMN IF NOT EXISTS token_hash text,
  ADD COLUMN IF NOT EXISTS token_hint text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitation_codes_token_hash
  ON public.invitation_codes (token_hash);
ALTER TABLE public.invitation_codes ALTER COLUMN code DROP NOT NULL;

-- 直接 INSERT 全撤（含管理员——创建只能走 create_invitation RPC）
REVOKE INSERT ON public.invitation_codes FROM authenticated, PUBLIC;
-- UPDATE 白名单：管理员仅可撤销（status）；used_count/token 等不可改
REVOKE UPDATE ON public.invitation_codes FROM authenticated, PUBLIC;
GRANT UPDATE (status) ON public.invitation_codes TO authenticated;

-- ================= R2-3 =================
UPDATE public.invitation_codes
   SET status = 'revoked',
       code = 'RETIRED_' || code
 WHERE char_length(code) < 16;

-- ================= R2-2: 服务端唯一签发入口 =================
CREATE OR REPLACE FUNCTION public.create_invitation(
  p_max_uses integer,
  p_expires_at timestamptz,
  p_store_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_profile profiles%ROWTYPE;
  v_token text;
  v_hash text;
  v_hint text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'G0-R2: 未登录' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_actor;
  IF v_profile.role <> 'tenant_admin' OR v_profile.tenant_id IS NULL THEN
    RAISE EXCEPTION 'G0-R2: 仅租户管理员可签发邀请码' USING ERRCODE = '42501';
  END IF;
  IF p_max_uses IS NULL OR p_max_uses < 1 OR p_max_uses > 100 THEN
    RAISE EXCEPTION 'G0-R2: 无效的使用次数' USING ERRCODE = '23514';
  END IF;
  IF p_expires_at IS NULL OR p_expires_at <= now() OR p_expires_at > now() + interval '90 days' THEN
    RAISE EXCEPTION 'G0-R2: 无效的有效期（最长 90 天）' USING ERRCODE = '23514';
  END IF;

  -- CSPRNG 128bit token；DB 只存 hash + last4 hint
  v_token := upper(encode(gen_random_bytes(16), 'hex'));
  v_hash  := encode(digest(v_token, 'sha256'), 'hex');
  v_hint  := right(v_token, 4);

  INSERT INTO invitation_codes
    (tenant_id, store_id, code, token_hash, token_hint, role,
     max_uses, used_count, expires_at, created_by, status)
  VALUES
    (v_profile.tenant_id, p_store_id, NULL, v_hash, v_hint, 'employee',
     p_max_uses, 0, p_expires_at, v_actor, 'active');

  -- 明文仅此一次返回（客户端负责立即展示/复制）
  RETURN jsonb_build_object(
    'code', v_token,
    'hint', v_hint,
    'role', 'employee',
    'max_uses', p_max_uses,
    'expires_at', p_expires_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_invitation(integer, timestamptz, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_invitation(integer, timestamptz, uuid) TO authenticated;

COMMENT ON FUNCTION public.create_invitation(integer, timestamptz, uuid) IS
  'G0-R2: 服务端唯一签发入口。CSPRNG token、hash-only 落库、明文一次性返回；bearer 一律 employee，管理角色须 admin_assign_member_role';

-- digest() 需要 pgcrypto：Supabase 默认可用，防御性创建扩展
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- owner 授予签发所需最小权限
GRANT INSERT, SELECT ON public.invitation_codes TO membership_issuer_owner;

-- ================= R2-2: redeem 改 hash 查询（owner 不变） =================
CREATE OR REPLACE FUNCTION public.join_tenant_with_code(
  p_code text,
  p_user_id uuid,
  p_user_name text
)
RETURNS TABLE (
  success boolean,
  message text,
  tenant_id uuid,
  store_id uuid,
  role user_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_denied constant text := '邀请码无效或不可用';
  v_inv invitation_codes%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_attempts int;
  v_hash text;
BEGIN
  IF v_user IS NULL THEN
    RETURN QUERY SELECT false, '请先登录'::text, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  IF p_user_id IS NOT NULL AND p_user_id <> v_user THEN
    RETURN QUERY SELECT false, v_denied, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  -- 限流（10 分钟窗口 10 次失败）
  DELETE FROM invitation_redemption_attempts
   WHERE user_id = v_user AND attempted_at < now() - interval '10 minutes';
  SELECT count(*) INTO v_attempts FROM invitation_redemption_attempts WHERE user_id = v_user;
  IF v_attempts >= 10 THEN
    RETURN QUERY SELECT false, '尝试过于频繁，请稍后再试'::text, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_user;
  IF v_profile.id IS NULL OR v_profile.tenant_id IS NOT NULL THEN
    INSERT INTO invitation_redemption_attempts (user_id) VALUES (v_user);
    RETURN QUERY SELECT false, v_denied, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  -- hash 查询：明文 token 不落任何查询路径
  v_hash := encode(digest(p_code, 'sha256'), 'hex');
  SELECT * INTO v_inv FROM invitation_codes
   WHERE token_hash = v_hash AND status = 'active'
   FOR UPDATE;

  IF v_inv.id IS NULL
     OR v_inv.expires_at <= now()
     OR v_inv.used_count >= v_inv.max_uses
     OR v_inv.role::text <> 'employee' THEN
    INSERT INTO invitation_redemption_attempts (user_id) VALUES (v_user);
    RETURN QUERY SELECT false, v_denied, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  PERFORM set_config('app.membership_issuer', 'on', true);
  UPDATE profiles
     SET tenant_id = v_inv.tenant_id,
         role = v_inv.role,
         name = COALESCE(name, p_user_name),
         updated_at = now()
   WHERE id = v_user;
  PERFORM set_config('app.membership_issuer', 'off', true);

  IF v_inv.store_id IS NOT NULL THEN
    INSERT INTO employees (tenant_id, store_id, user_id, name, employee_type, status)
    VALUES (v_inv.tenant_id, v_inv.store_id, v_user, COALESCE(p_user_name, v_profile.name), 'full_time', 'active')
    ON CONFLICT (tenant_id, user_id) DO UPDATE
      SET store_id = v_inv.store_id;
  END IF;

  INSERT INTO invitation_code_uses (invitation_code_id, user_id, tenant_id, role_granted, redeemed_at)
  VALUES (v_inv.id, v_user, v_inv.tenant_id, v_inv.role::text, now());

  UPDATE invitation_codes
     SET used_count = used_count + 1,
         status = CASE WHEN used_count + 1 >= max_uses THEN 'used' ELSE status END
   WHERE id = v_inv.id;

  DELETE FROM invitation_redemption_attempts WHERE user_id = v_user;

  RETURN QUERY SELECT true, '成功加入租户'::text, v_inv.tenant_id, v_inv.store_id, v_inv.role;
END;
$$;

-- ================= 附：admin_assign_member_role owner 修正 =================
ALTER FUNCTION public.admin_assign_member_role(uuid, user_role) OWNER TO membership_issuer_owner;

-- ================= R2-4：签名 DELETE 收紧为仅 DRAFT 合同 =================
DROP POLICY IF EXISTS "合同相关方可删除签名" ON storage.objects;
CREATE POLICY "草稿合同可删除签名" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'contract_signatures'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND EXISTS (
      SELECT 1 FROM public.employment_contracts ec
       WHERE ec.id = (storage.foldername(name))[2]::uuid
         AND ec.tenant_id = (storage.foldername(name))[1]::uuid
         AND ec.contract_status = 'draft'
         AND public.can_access_tenant(auth.uid(), ec.tenant_id)
         AND (
           owner = auth.uid()
           OR EXISTS (
             SELECT 1 FROM public.profiles p
              WHERE p.id = auth.uid()
                AND p.role IN ('store_manager','tenant_admin','super_admin')
           )
         )
    )
  );
-- UPDATE：contract_signatures 无任何 UPDATE 策略 = 覆盖/upsert 一律 DENY（不可篡改）
