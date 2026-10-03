-- ============================================================
-- G0-CLOSURE-R1（B-LINE / SOURCE PRECLOSURE FAILURE）
-- 裁定 2026-10-03：静态预审发现确定性失败，最小修复四项，不扩 scope。
--
-- R1-1 create_invitation owner → membership_issuer_owner
--      （00120 首次创建该函数但未 ALTER OWNER，H3 必红）
-- R1-2 退休 legacy 特权 DEFINER 路径 + 补齐 H4 search_path
--      - DROP convert_guest_to_tenant_admin(uuid,uuid)（无 caller 校验的
--        任意租户 tenant_admin 发行人；生产快照中不存在，迁移链可达，
--        防御性 DROP 幂等）
--      - 9 个 legacy DEFINER 函数固定 search_path（仅 ALTER，不重构）：
--        audit_trigger_func / get_user_tenant_ids / is_admin / is_guest_user /
--        is_tenant_admin_or_manager / is_user_admin / restore_from_snapshot /
--        update_tenant_employee_count / update_tenant_store_count
--      其余 DEFINER 函数已由 00111（4 个辅助函数）与 00118/00120
--      （join_tenant_with_code / generate_invitation_code）覆盖。
-- R1-3 移除 first-user super_admin bootstrap（handle_new_user 重写）
--      注册只发行非特权身份；super_admin 只能来自受控 provisioning。
--      违反 CONTROLLED_PROVISIONING 冻结原则的原 count=0 分支删除。
--      （wechat-quick-login Edge Function 的同款 bootstrap 由本批次
--       代码侧一并修复——同一失败项的第二个实例）
-- R1-4 create_invitation 校验 p_store_id 归属
--      p_store_id 非空时必须属于 caller 本租户；禁止 tenant A + store B
--      的混合邀请码（外键不保证 tenant/store 同源）。
-- ============================================================

-- ---------- R1-2a: 退休后门发行人 ----------
DROP FUNCTION IF EXISTS public.convert_guest_to_tenant_admin(uuid, uuid);

-- ---------- R1-2b: legacy DEFINER 函数固定 search_path（H4） ----------
ALTER FUNCTION public.audit_trigger_func() SET search_path = public;
ALTER FUNCTION public.get_user_tenant_ids(uuid) SET search_path = public;
ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
ALTER FUNCTION public.is_guest_user(uuid) SET search_path = public;
ALTER FUNCTION public.is_tenant_admin_or_manager(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.is_user_admin(uuid) SET search_path = public;
ALTER FUNCTION public.restore_from_snapshot(uuid) SET search_path = public;
ALTER FUNCTION public.update_tenant_employee_count() SET search_path = public;
ALTER FUNCTION public.update_tenant_store_count() SET search_path = public;

-- ---------- R1-3: 注册恒为非特权身份 ----------
-- 触发器 on_auth_user_created / on_auth_user_created_or_confirmed 引用不变；
-- 仅移除 count=0 -> super_admin 分支。新环境的 super_admin 由平台受控创建。
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- G0-CLOSURE-R1: 注册只发行非特权身份（CONTROLLED_PROVISIONING）。
  -- super_admin 不存在自助/自动获得路径，须经平台 provisioning。
  INSERT INTO profiles (id, phone, email, role)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.email,
    'employee'::user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    email = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = now();

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'G0-CLOSURE-R1: 注册恒为 employee；first-user super_admin bootstrap 已移除（super_admin 仅经平台受控 provisioning）';

-- ---------- R1-1 + R1-4: create_invitation 加同租户校验并归属专用主体 ----------
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
$$;

-- R1-1: owner 归属专用 NOLOGIN 主体（OR REPLACE 不改变既有 owner，显式 ALTER 兜底）
ALTER FUNCTION public.create_invitation(integer, timestamptz, uuid)
  OWNER TO membership_issuer_owner;

REVOKE ALL ON FUNCTION public.create_invitation(integer, timestamptz, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_invitation(integer, timestamptz, uuid) TO authenticated;

COMMENT ON FUNCTION public.create_invitation(integer, timestamptz, uuid) IS
  'G0-CLOSURE-R1: owner=membership_issuer_owner；新增 store 同租户校验（R1-4）；hash-only、一次性明文、固定 employee 不变';
