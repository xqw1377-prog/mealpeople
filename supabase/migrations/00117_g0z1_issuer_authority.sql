-- ============================================================
-- G0-Z1: ISSUER AUTHORITY HARDENING（裁定 2026-10-03 G0-Z）
--
-- 安全根从"自定义 GUC"改为"数据库主体 + 列级权限"：
--   1. 专用 NOLOGIN role membership_issuer_owner 拥有 issuer 函数
--      （SECURITY DEFINER 以它运行，普通客户端无任何途径成为它）
--   2. profiles.role / profiles.tenant_id 成为 protected columns：
--      REVOKE 列级 UPDATE/INSERT——authenticated 任何直写（含 SET role=role
--      同值写）直接 42501，不依赖 RLS/触发器
--   3. role/tenant_id 的合法写入只剩：issuer 函数（join_tenant_with_code /
--      admin_assign_member_role，均 owner=membership_issuer_owner）与
--      super_admin/service_role
--   4. GUC app.membership_issuer 降级为 issuer 内部上下文（触发器纵深防御
--      第二层），不再是授权根——即使 GUC 被意外污染，列级权限仍拒绝
--      authenticated 直写
-- ============================================================

-- 1) 专用数据库主体（NOLOGIN：无人能 CONNECT 成它）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'membership_issuer_owner') THEN
    CREATE ROLE membership_issuer_owner NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO membership_issuer_owner;

-- 1a) membership 审计账本（append-only；先建表后授权）
CREATE TABLE IF NOT EXISTS public.membership_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  actor uuid NOT NULL,
  target_user uuid NOT NULL,
  old_role text,
  new_role text NOT NULL,
  source text NOT NULL DEFAULT 'admin_assign',
  granted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.membership_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "本租户管理员可读审计" ON public.membership_audit
  FOR SELECT TO authenticated
  USING (public.can_access_tenant(auth.uid(), tenant_id));
REVOKE UPDATE, DELETE ON public.membership_audit FROM authenticated, PUBLIC;

-- 1b) 兑换限流表（G0-Z2 使用；先建表后授权）
CREATE TABLE IF NOT EXISTS public.invitation_redemption_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_redemption_attempts_user_time
  ON public.invitation_redemption_attempts (user_id, attempted_at);
ALTER TABLE public.invitation_redemption_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.invitation_redemption_attempts FROM authenticated, anon, PUBLIC;

-- 1c) issuer 函数运行所需最小权限（列级，不授全表）
GRANT SELECT ON public.profiles TO membership_issuer_owner;
GRANT UPDATE (role, tenant_id, name, updated_at) ON public.profiles TO membership_issuer_owner;
GRANT SELECT, UPDATE (used_count, status) ON public.invitation_codes TO membership_issuer_owner;
GRANT SELECT, INSERT ON public.invitation_code_uses TO membership_issuer_owner;
GRANT SELECT, INSERT ON public.invitation_redemption_attempts TO membership_issuer_owner;
GRANT DELETE ON public.invitation_redemption_attempts TO membership_issuer_owner;
GRANT SELECT, INSERT, UPDATE (store_id) ON public.employees TO membership_issuer_owner;
GRANT INSERT ON public.membership_audit TO membership_issuer_owner;

-- 2) issuer 函数改由专用主体拥有（后续 CREATE OR REPLACE 不改变 owner）
ALTER FUNCTION public.join_tenant_with_code(text, uuid, text) OWNER TO membership_issuer_owner;

-- 3) protected columns：authenticated 永失直写能力
REVOKE UPDATE (role, tenant_id) ON public.profiles FROM authenticated;
REVOKE INSERT (role, tenant_id) ON public.profiles FROM authenticated;
REVOKE UPDATE (role, tenant_id) ON public.profiles FROM PUBLIC;
REVOKE INSERT (role, tenant_id) ON public.profiles FROM PUBLIC;

-- 4) 管理员指派角色的受控路径（替代前端直写 updateUserRole）
--    白名单 employee/store_manager/agent/tenant_admin；不能改自己；
--    只能改本租户成员（super_admin 除外）；写入 append-only 审计。
CREATE OR REPLACE FUNCTION public.admin_assign_member_role(
  p_target_user uuid,
  p_new_role user_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
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
$$;

REVOKE ALL ON FUNCTION public.admin_assign_member_role(uuid, user_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_assign_member_role(uuid, user_role) TO authenticated;

COMMENT ON FUNCTION public.admin_assign_member_role(uuid, user_role) IS
  'G0-Z1: role 的唯一管理写入路径（白名单/本租户/不可自改/审计）；super_admin 角色不可经此授予';

-- 6) 触发器注释/语义更新：安全根=列级权限，GUC 仅为 issuer 内部上下文
COMMENT ON FUNCTION public.g0_enforce_profiles_privilege_guard() IS
  'G0-Z1: 纵深防御第二层。安全根是列级 REVOKE(role,tenant_id)+专用 NOLOGIN owner；GUC app.membership_issuer 仅为 issuer 函数内部上下文标记';
