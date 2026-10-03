-- ============================================================
-- G0-A-R: MEMBERSHIP AUTHORITY（裁定 2026-10-03 G0=HOLD 补充批次）
--
-- 冻结不变量：
--   I1 用户不能直接修改自己的 tenant_id（含 NULL -> tenant 首次加入）
--   I2 用户不能直接修改自己的 role
--   I3 加入 tenant 必须经服务端可信 issuer（redeem_invite）
--   I4 issuer 必须验证合法邀请码（active/未过期/未用尽/角色白名单）
--   I5 tenant membership 是权限事实，不是 profile 自助资料
--
-- 击穿路径（本迁移封堵）：
--   旧 G0-A 触发器允许"本人 NULL->tenant 且 role 保持 employee"，
--   攻击者可自选目标租户成为合法 employee，绕过 can_access_tenant()
--   及 G0-C 全部租户隔离。
-- ============================================================

-- 1) I1: 彻底删除首次登录自助设置租户的策略
DROP POLICY IF EXISTS "用户可以在首次登录时设置租户" ON profiles;

-- 2) I1/I2: 重写特权守卫——tenant_id 变更仅 super_admin 或 issuer 路径
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
  v_issuer boolean;
BEGIN
  v_jwt_role := auth.role();
  -- 系统上下文放行：service_role（边缘函数）或无 JWT 的后台操作
  IF v_jwt_role = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- issuer 路径：仅 redeem_invite()（SECURITY DEFINER）在事务内设置该标记。
  -- 普通客户端无任何途径执行 SET（PostgREST 不暴露），标记只存在于
  -- 该函数自身事务内，随事务结束失效。
  v_issuer := current_setting('app.membership_issuer', true) = 'on';

  v_actor_is_super := public.is_super_admin(auth.uid());
  v_actor_role := public.get_user_role(auth.uid())::text;
  v_actor_tenant := public.get_user_tenant_id(auth.uid());

  IF TG_OP = 'INSERT' THEN
    IF NEW.role <> 'employee'
       AND NOT (v_actor_is_super
                OR v_issuer
                OR (v_actor_role = 'tenant_admin'
                    AND NEW.tenant_id IS NOT NULL
                    AND NEW.tenant_id = v_actor_tenant)) THEN
      RAISE EXCEPTION 'G0-A-R: 不允许以当前身份创建 role=% 的 profile', NEW.role
        USING ERRCODE = '42501';
    END IF;

    IF NEW.tenant_id IS NOT NULL
       AND NOT v_actor_is_super
       AND NOT v_issuer
       AND NOT (v_actor_role = 'tenant_admin' AND NEW.tenant_id = v_actor_tenant) THEN
      RAISE EXCEPTION 'G0-A-R: 不允许以当前身份为 profile 指定租户（请使用邀请码）'
        USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
  END IF;

  -- ---------- UPDATE ----------
  -- I2: role 变更 = super_admin / issuer / tenant_admin 对本租户他人且白名单内
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT v_actor_is_super AND NOT v_issuer THEN
      IF NOT (
        v_actor_role = 'tenant_admin'
        AND auth.uid() <> NEW.id
        AND OLD.tenant_id IS NOT DISTINCT FROM v_actor_tenant
        AND NEW.role IN ('employee', 'store_manager', 'agent', 'tenant_admin')
      ) THEN
        RAISE EXCEPTION 'G0-A-R: 当前身份不允许变更 role (% -> %)', OLD.role, NEW.role
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  -- I1: tenant_id 变更 = super_admin / issuer（本人自助路径已废除）
  IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
    IF NOT v_actor_is_super AND NOT v_issuer THEN
      RAISE EXCEPTION 'G0-A-R: 当前身份不允许变更 tenant_id（加入企业请使用邀请码）'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.g0_enforce_profiles_privilege_guard() IS
  'G0-A-R: I1/I2 不变量——客户端永不签发 membership（tenant_id/role）；issuer=redeem_invite 经事务级 GUC app.membership_issuer 放行';

-- 3) I3/I4: 重写服务端邀请码兑换（唯一自助加入企业的路径）
--    前端既有 RPC（packageD/join-tenant -> db/modules/tenant.ts:613 已调用），
--    保留签名与返回结构，前端零改动。G0-A-R 修复点：
--    a) 身份一律取自 JWT：p_user_id 仅作兼容参数，与 JWT 不一致直接拒绝
--       （旧版可替任意 user_id 兑换，等于替他人签发/篡改 membership）
--    b) 防邀请跳槽：已是任意租户成员即拒绝（旧版只挡"同租户"）
--    c) 兑换角色白名单：employee/store_manager/agent；管理员角色须后台指派
--    d) FOR UPDATE 行锁防并发超用；满额自动停用
--    e) 经 app.membership_issuer 标记通过上方触发器（其他一切客户端写入被 I1/I2 拒绝）
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
  v_inv invitation_codes%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_allowed_roles constant text[] := ARRAY['employee','store_manager','agent'];
BEGIN
  IF v_user IS NULL THEN
    RETURN QUERY SELECT false, '请先登录'::text, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  -- 身份以 JWT 为准；兼容参数与 JWT 冲突时拒绝（防替他人操作）
  IF p_user_id IS NOT NULL AND p_user_id <> v_user THEN
    RETURN QUERY SELECT false, '身份校验失败'::text, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_user;
  IF v_profile.id IS NULL THEN
    RETURN QUERY SELECT false, '用户档案不存在'::text, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  -- 防邀请跳槽：已有租户者不可再自助加入
  IF v_profile.tenant_id IS NOT NULL THEN
    RETURN QUERY SELECT false, '你已属于一个企业，不能通过邀请码再加入'::text, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  -- I4: 校验邀请码（行锁防并发超用）
  SELECT * INTO v_inv FROM invitation_codes
   WHERE code = p_code
     AND status = 'active'
   FOR UPDATE;

  IF v_inv.id IS NULL THEN
    RETURN QUERY SELECT false, '邀请码无效'::text, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;
  IF v_inv.expires_at <= now() THEN
    RETURN QUERY SELECT false, '邀请码已过期'::text, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;
  IF v_inv.used_count >= v_inv.max_uses THEN
    RETURN QUERY SELECT false, '邀请码使用次数已用尽'::text, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;
  IF NOT (v_inv.role::text = ANY(v_allowed_roles)) THEN
    RETURN QUERY SELECT false, '该邀请码角色不可自助兑换'::text, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  -- I3: 服务端签发 membership（事务级 issuer 标记，仅本函数可设）
  PERFORM set_config('app.membership_issuer', 'on', true);
  UPDATE profiles
     SET tenant_id = v_inv.tenant_id,
         role = v_inv.role,
         name = COALESCE(name, p_user_name),
         updated_at = now()
   WHERE id = v_user;
  PERFORM set_config('app.membership_issuer', 'off', true);

  -- 邀请码指定了店铺时创建员工记录（保留原有行为）
  IF v_inv.store_id IS NOT NULL THEN
    INSERT INTO employees (tenant_id, store_id, user_id, name, employee_type, status)
    VALUES (v_inv.tenant_id, v_inv.store_id, v_user, COALESCE(p_user_name, v_profile.name), 'full_time', 'active')
    ON CONFLICT (tenant_id, user_id) DO UPDATE
      SET store_id = v_inv.store_id;
  END IF;

  -- 消费记录 + 计数（满额自动停用）
  INSERT INTO invitation_code_uses (invitation_code_id, user_id)
  VALUES (v_inv.id, v_user);

  UPDATE invitation_codes
     SET used_count = used_count + 1,
         status = CASE WHEN used_count + 1 >= max_uses THEN 'used' ELSE status END
   WHERE id = v_inv.id;

  RETURN QUERY SELECT true, '成功加入租户'::text, v_inv.tenant_id, v_inv.store_id, v_inv.role;
END;
$$;

-- 仅登录用户可调用；anon/public 拒绝
REVOKE ALL ON FUNCTION public.join_tenant_with_code(text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_tenant_with_code(text, uuid, text) TO authenticated;

COMMENT ON FUNCTION public.join_tenant_with_code(text, uuid, text) IS
  'G0-A-R: 唯一自助加入企业的路径；身份取 JWT（p_user_id 仅兼容且须一致）；防跳槽；角色白名单 employee/store_manager/agent；行锁防超用；满额自动停用';

-- 4) 邀请码本体 RLS：管理员签发必须限本租户；普通成员不可读（客户端校验已废止，读取全部走 issuer）
DROP POLICY IF EXISTS "管理员可以创建邀请码" ON invitation_codes;
CREATE POLICY "管理员可管理本租户邀请码" ON invitation_codes
  FOR ALL TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (public.get_user_role(auth.uid()) = 'tenant_admin'
        AND public.can_access_tenant(auth.uid(), invitation_codes.tenant_id))
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (public.get_user_role(auth.uid()) = 'tenant_admin'
        AND public.can_access_tenant(auth.uid(), invitation_codes.tenant_id))
  );

-- 5) G0-E-R: 签名可见性从"任意认证用户"收紧为"合同相关方"
--    上传路径为 {tenant_id}/{contract_id}/{timestamp}_{type}.png（signature-upload.ts:33）
--    授权：合同员工的本人 OR 同租户管理角色；跨租户/无关用户 DENY
DROP POLICY IF EXISTS "Authenticated users can view signatures" ON storage.objects;
CREATE POLICY "合同相关方可查看签名" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'contract_signatures'
    AND (
      owner = auth.uid()
      OR (
        (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND EXISTS (
          SELECT 1
            FROM public.employment_contracts ec
            JOIN public.employees e ON e.id = ec.employee_id
           WHERE ec.id = (storage.foldername(name))[2]::uuid
             AND public.can_access_tenant(auth.uid(), ec.tenant_id)
             AND (
               e.user_id = auth.uid()
               OR EXISTS (
                 SELECT 1 FROM public.profiles p
                  WHERE p.id = auth.uid()
                    AND p.role IN ('store_manager','tenant_admin','super_admin')
               )
             )
        )
      )
    )
  );
