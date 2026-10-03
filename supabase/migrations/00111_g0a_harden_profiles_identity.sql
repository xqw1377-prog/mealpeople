-- ============================================================
-- G0-A: Identity / profiles 加固（P0-SEC-01）
-- 治理裁定：2026-10-03（Journey V4 项目治理，LEGACY FUNCTION FREEZE 生效中）
--
-- 封死三条自助提权通道：
--   通道1: "系统可以创建profile" FOR INSERT WITH CHECK (true)
--          -> 任何认证用户可插入 role='super_admin' 的 profile
--   通道2: "用户可更新自己的信息" FOR UPDATE 仅有 USING(id=auth.uid())
--          -> WITH CHECK 缺省复用 USING，用户可把自己的 role/tenant_id 改成任意值
--   通道3: "用户可以在首次登录时设置租户" WITH CHECK (true)
--          -> 用户可把 NULL tenant 改成任意租户且 role 不受限
--
-- 行为影响（必须在发布说明中告知）：
--   * 注册/OTP 流程不受影响：handle_new_user() 为 SECURITY DEFINER
--     （见 schema.sql:1128-1131，SET search_path TO 'public'），不受 RLS 约束
--   * 普通用户仍可修改自己的非特权字段（name/phone 等）
--   * 普通用户首次加入租户仍允许（仅当 tenant_id 从 NULL -> 非NULL 且 role 保持 employee）
--   * tenant_admin 仍可管理本租户成员角色，但白名单收窄为
--     employee/store_manager/agent/tenant_admin，且不能改自己
--   * role='super_admin' 与跨租户移动只能由 super_admin / service_role 执行
-- ============================================================

-- 1) 通道1：删除全开插入策略（handle_new_user 是 SECURITY DEFINER，不需要它）
DROP POLICY IF EXISTS "系统可以创建profile" ON profiles;

-- 2) 通道3：收窄首次登录策略（WITH CHECK 限定只能改自己的行；role/tenant 由触发器裁决）
DROP POLICY IF EXISTS "用户可以在首次登录时设置租户" ON profiles;
CREATE POLICY "用户可以在首次登录时设置租户" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() AND tenant_id IS NULL)
  WITH CHECK (id = auth.uid());

-- 3) 顺带加固：为 4 个 SECURITY DEFINER 辅助函数固定 search_path
--   （01_create_multi_tenant_schema.sql 中定义时未设置，属 DEFINER 函数标准加固项）
ALTER FUNCTION public.is_super_admin(uuid) SET search_path = public;
ALTER FUNCTION public.get_user_tenant_id(uuid) SET search_path = public;
ALTER FUNCTION public.get_user_role(uuid) SET search_path = public;
ALTER FUNCTION public.can_access_tenant(uuid, uuid) SET search_path = public;

-- 4) 通道2 + 兜底：特权守卫触发器（BEFORE INSERT OR UPDATE，权威裁决层）
--    RLS 策略无法做"行内前后对比"（引用 OLD），role/tenant_id 的变更合法性
--    必须由触发器执行。函数为 SECURITY DEFINER + 固定 search_path，
--    判定所用的 is_super_admin/get_user_role/get_user_tenant_id 亦为 DEFINER，
--    不受调用者 RLS 影响，可安全用于裁决。
CREATE OR REPLACE FUNCTION public.g0_enforce_profiles_privilege_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jwt_role text;
  v_actor_is_super boolean;
  v_actor_role text;
  v_actor_tenant uuid;
BEGIN
  v_jwt_role := auth.role();

  -- 系统上下文放行：service_role（边缘函数）或无 JWT 的后台操作（GoTrue 触发器等）
  IF v_jwt_role = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  v_actor_is_super := public.is_super_admin(auth.uid());
  v_actor_role := public.get_user_role(auth.uid())::text;
  v_actor_tenant := public.get_user_tenant_id(auth.uid());

  IF TG_OP = 'INSERT' THEN
    -- 认证用户自建 profile：角色只能是 employee；tenant_admin 可以为本租户拉人；
    -- super_admin/service_role 不受限
    IF NEW.role <> 'employee'
       AND NOT (v_actor_is_super
                OR (v_actor_role = 'tenant_admin'
                    AND NEW.tenant_id IS NOT NULL
                    AND NEW.tenant_id = v_actor_tenant)) THEN
      RAISE EXCEPTION 'G0-A: 不允许以当前身份创建 role=% 的 profile', NEW.role
        USING ERRCODE = '42501';
    END IF;

    IF NEW.tenant_id IS NOT NULL
       AND NOT v_actor_is_super
       AND NOT (v_actor_role = 'tenant_admin' AND NEW.tenant_id = v_actor_tenant) THEN
      RAISE EXCEPTION 'G0-A: 不允许以当前身份为 profile 指定租户'
        USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
  END IF;

  -- ---------- UPDATE ----------

  -- role 变更：仅 super_admin；或 tenant_admin 对本租户他人、且目标角色在白名单内
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT v_actor_is_super THEN
      IF NOT (
        v_actor_role = 'tenant_admin'
        AND auth.uid() <> NEW.id
        AND OLD.tenant_id IS NOT DISTINCT FROM v_actor_tenant
        AND NEW.role IN ('employee', 'store_manager', 'agent', 'tenant_admin')
      ) THEN
        RAISE EXCEPTION 'G0-A: 当前身份不允许变更 role (% -> %)', OLD.role, NEW.role
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  -- tenant_id 变更：仅 super_admin；例外=本人首次从无租户加入且角色保持 employee
  IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
    IF NOT v_actor_is_super THEN
      IF NOT (
        auth.uid() = NEW.id
        AND OLD.tenant_id IS NULL
        AND OLD.role = 'employee'
        AND NEW.role = 'employee'
      ) THEN
        RAISE EXCEPTION 'G0-A: 当前身份不允许变更 tenant_id'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS g0_profiles_privilege_guard ON profiles;
CREATE TRIGGER g0_profiles_privilege_guard
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.g0_enforce_profiles_privilege_guard();

COMMENT ON FUNCTION public.g0_enforce_profiles_privilege_guard() IS
  'G0-A (P0-SEC-01): 禁止自助提权与跨租户移动；role 变更=super_admin 或 tenant_admin 白名单；tenant_id 变更=super_admin 或本人首次加入(employee)';
