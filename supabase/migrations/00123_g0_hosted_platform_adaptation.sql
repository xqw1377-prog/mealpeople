-- ============================================================
-- G0-HOSTED-ADAPTATION（B 通道：supabase.com hosted 平台适配）
-- 裁定背景：用户「同意A」2026-10-04 + 全自动执行授权 2026-10-05
--
-- 平台事实（均有执行留痕）：
--   A1. auth schema 归 supabase_admin 所有，postgres/dashboard 通道的
--       GRANT USAGE ON SCHEMA auth 被平台静默吞掉（返回 Success 但 ACL 不变，
--       _dash_probe 探针实验证实其余语句真实落库）
--   A2. issuer 专用主体 membership_issuer_owner（NOLOGIN+BYPASSRLS，00122 已
--       真实生效）因无 auth schema USAGE，其 SECURITY DEFINER 函数内的
--       auth.uid() 调用全部 42501 失败 → ALLOW 主路径（签发/兑换/指派）不可用
--
-- 最小适配（语义等价，不扩权限边界）：
--   auth.uid() 内部实现 = current_setting('request.jwt.claims')::jsonb->>'sub'
--   新增 public.g0_jwt_sub() 直读同一 GUC（同源同值），三个 issuer 函数的
--   DECLARE 行 auth.uid() → public.g0_jwt_sub()，函数体其余部分逐字保留。
--   ownership 不变（CREATE OR REPLACE 不改变 owner），NOLOGIN/BYPASSRLS/
--   最小列级 GRANT/search_path 固定 全部保持。
--
-- 其余部署适配（本文件仅记录，已在部署过程中按语句执行并留痕）：
--   D1. GRANT membership_issuer_owner TO postgres（OWNER 转移前置，00117/00121 需要）
--   D2. GRANT CREATE, USAGE ON SCHEMA public TO membership_issuer_owner（同上）
--   D3. BYPASSRLS 适配未启用——00122 在 Management API 通道真实生效（rolbypassrls=true 已验证）
--
-- 附带清理：_dash_probe 探针表（A1 实验产物）
-- ============================================================

-- ---------- 0) 探针清理 ----------
DROP TABLE IF EXISTS public._dash_probe;

-- ---------- 1) JWT sub 读取助手（与 auth.uid() 同源等价） ----------
CREATE OR REPLACE FUNCTION public.g0_jwt_sub()
RETURNS uuid
LANGUAGE sql
STABLE
AS $function$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', ''),
    NULL::uuid
  )
$function$;

COMMENT ON FUNCTION public.g0_jwt_sub() IS
  'G0-HOSTED-ADAPTATION: 与 auth.uid() 同源等价（request.jwt.claims GUC -> sub），供无 auth schema USAGE 的 issuer 主体使用';

-- ---------- 2) 三个 issuer 函数：仅 DECLARE 行替换，其余逐字保留 ----------
CREATE OR REPLACE FUNCTION public.admin_assign_member_role(p_target_user uuid, p_new_role user_role)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_actor uuid := public.g0_jwt_sub();
  v_actor_profile profiles%ROWTYPE;
  v_target_profile profiles%ROWTYPE;
  v_old_role user_role;
  v_allowed constant text[] := ARRAY['employee','store_manager','agent','tenant_admin'];
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'G0-Z1: 未登录' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_actor_profile FROM profiles WHERE id = v_actor;
  SELECT * INTO v_target_profile FROM profiles WHERE id = p_target_user;
  IF v_target_profile.id IS NULL THEN
    RAISE EXCEPTION 'G0-Z1: 目标用户不存在' USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.is_super_admin(v_actor) THEN
    IF v_actor_profile.role <> 'tenant_admin' THEN
      RAISE EXCEPTION 'G0-Z1: 无指派权限' USING ERRCODE = '42501';
    END IF;
    IF v_actor = p_target_user THEN
      RAISE EXCEPTION 'G0-Z1: 不能修改自己的角色' USING ERRCODE = '42501';
    END IF;
    IF v_target_profile.tenant_id IS NULL
       OR v_target_profile.tenant_id <> v_actor_profile.tenant_id THEN
      RAISE EXCEPTION 'G0-Z1: 只能指派本租户成员' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF NOT (p_new_role::text = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'G0-Z1: 目标角色不在可指派白名单（super_admin 须经平台操作）' USING ERRCODE = '42501';
  END IF;
  IF p_new_role = 'tenant_admin' AND NOT (public.is_super_admin(v_actor) OR v_actor_profile.role = 'tenant_admin') THEN
    RAISE EXCEPTION 'G0-Z1: 无指派 tenant_admin 权限' USING ERRCODE = '42501';
  END IF;

  v_old_role := v_target_profile.role;

  PERFORM set_config('app.membership_issuer', 'on', true);
  UPDATE profiles SET role = p_new_role, updated_at = now() WHERE id = p_target_user;
  PERFORM set_config('app.membership_issuer', 'off', true);

  INSERT INTO membership_audit (tenant_id, actor, target_user, old_role, new_role, source)
  VALUES (v_target_profile.tenant_id, v_actor, p_target_user, v_old_role, p_new_role, 'admin_assign');

  RETURN jsonb_build_object('target_user', p_target_user, 'role', p_new_role);
END;
$function$

CREATE OR REPLACE FUNCTION public.create_invitation(p_max_uses integer, p_expires_at timestamp with time zone, p_store_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_actor uuid := public.g0_jwt_sub();
  v_profile profiles%ROWTYPE;
  v_store_tenant uuid;
  v_token text;
  v_hash text;
  v_hint text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'G0-R1: 未登录' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_actor;
  IF v_profile.role <> 'tenant_admin' OR v_profile.tenant_id IS NULL THEN
    RAISE EXCEPTION 'G0-R1: 仅租户管理员可签发邀请码' USING ERRCODE = '42501';
  END IF;
  IF p_max_uses IS NULL OR p_max_uses < 1 OR p_max_uses > 100 THEN
    RAISE EXCEPTION 'G0-R1: 无效的使用次数' USING ERRCODE = '23514';
  END IF;
  IF p_expires_at IS NULL OR p_expires_at <= now() OR p_expires_at > now() + interval '90 days' THEN
    RAISE EXCEPTION 'G0-R1: 无效的有效期（最长 90 天）' USING ERRCODE = '23514';
  END IF;

  -- G0-R1-4: 店铺必须属于本租户（禁止 tenant A + store B 混合邀请）
  IF p_store_id IS NOT NULL THEN
    SELECT tenant_id INTO v_store_tenant FROM stores WHERE id = p_store_id;
    IF v_store_tenant IS NULL OR v_store_tenant <> v_profile.tenant_id THEN
      RAISE EXCEPTION 'G0-R1: 店铺不属于当前企业' USING ERRCODE = '42501';
    END IF;
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

  RETURN jsonb_build_object(
    'code', v_token,
    'hint', v_hint,
    'role', 'employee',
    'max_uses', p_max_uses,
    'expires_at', p_expires_at
  );
END;
$function$

CREATE OR REPLACE FUNCTION public.join_tenant_with_code(p_code text, p_user_id uuid, p_user_name text)
 RETURNS TABLE(success boolean, message text, tenant_id uuid, store_id uuid, role user_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := public.g0_jwt_sub();
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
$function$
