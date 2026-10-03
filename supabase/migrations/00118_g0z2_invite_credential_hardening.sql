-- ============================================================
-- G0-Z2: INVITE CREDENTIAL HARDENING（邀请码=Membership Bearer Credential）
--
-- INV-1 高熵：服务端生成 32 位 crypto 随机码；INSERT 策略强制新码 >= 16 位
--         （存量 6 位旧码仍可兑换，其低熵风险由 INV-4 限流缓解）
-- INV-2 token hash：登记为 PARTIAL——产品要求管理员可读码发给员工，
--         明文为运营必需；已用 128bit 熵补偿撞码面（详见整改文档）
-- INV-3 统一错误：invalid/expired/exhausted/revoked 对外一律同一文案（防 oracle）
-- INV-4 限流：invitation_redemption_attempts 每用户 10 分钟窗口 10 次失败
-- INV-5 角色收窄：bearer invite 只授予 employee；store_manager/agent/
--         tenant_admin 须经 admin_assign_member_role 显式指派
--
-- 审计：invitation_code_uses 补 tenant_id/role_granted；全部 append-only；
--       管理员不可篡改 used_count / 历史兑换记录。
-- ============================================================

-- ---------- 限流表（建表与授权在 00117，此处不重复） ----------

-- ---------- 审计账本补列 + append-only ----------
ALTER TABLE public.invitation_code_uses
  ADD COLUMN IF NOT EXISTS tenant_id uuid,
  ADD COLUMN IF NOT EXISTS role_granted text,
  ADD COLUMN IF NOT EXISTS redeemed_at timestamptz DEFAULT now();

REVOKE UPDATE, DELETE ON public.invitation_code_uses FROM authenticated, PUBLIC;
-- used_count 只能由 issuer 递增；管理员不可手改
REVOKE UPDATE (used_count) ON public.invitation_codes FROM authenticated, PUBLIC;

-- ---------- INV-1：服务端高熵码生成（重写 19/21 号旧函数） ----------
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_value text;
  exists_count int;
  attempt int := 0;
BEGIN
  LOOP
    -- 32 位十六进制 = 128bit 熵（crypto 强随机），杜绝可猜短码
    code_value := upper(substring(encode(gen_random_bytes(16), 'hex') from 1 for 32));
    SELECT COUNT(*) INTO exists_count FROM invitation_codes WHERE code = code_value;
    IF exists_count = 0 THEN
      RETURN code_value;
    END IF;
    attempt := attempt + 1;
    IF attempt >= 10 THEN
      RAISE EXCEPTION '无法生成唯一邀请码，请稍后重试';
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.generate_invitation_code() IS 'G0-Z2 INV-1: 128bit 熵邀请码';

-- ---------- 新码长度门槛（写在 INSERT 策略，仅约束新签发） ----------
DROP POLICY IF EXISTS "管理员可管理本租户邀请码" ON invitation_codes;
CREATE POLICY "管理员可管理本租户邀请码" ON invitation_codes
  FOR ALL TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (public.get_user_role(auth.uid()) = 'tenant_admin'
        AND public.can_access_tenant(auth.uid(), invitation_codes.tenant_id))
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (
      public.get_user_role(auth.uid()) = 'tenant_admin'
      AND public.can_access_tenant(auth.uid(), invitation_codes.tenant_id)
      AND char_length(invitation_codes.code) >= 16   -- 新签发必须高熵
    )
  );

-- ---------- INV-3/4/5：兑换函数重写（owner 仍为 membership_issuer_owner） ----------
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
  v_denied constant text := '邀请码无效或不可用';  -- INV-3: 统一外部文案
  v_inv invitation_codes%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_attempts int;
  v_allowed_roles constant text[] := ARRAY['employee'];  -- INV-5: bearer 只发 employee
BEGIN
  IF v_user IS NULL THEN
    RETURN QUERY SELECT false, '请先登录'::text, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  -- 身份以 JWT 为准
  IF p_user_id IS NOT NULL AND p_user_id <> v_user THEN
    RETURN QUERY SELECT false, v_denied, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  -- INV-4: 限流（10 分钟窗口 10 次失败）
  DELETE FROM invitation_redemption_attempts
   WHERE user_id = v_user AND attempted_at < now() - interval '10 minutes';
  SELECT count(*) INTO v_attempts FROM invitation_redemption_attempts WHERE user_id = v_user;
  IF v_attempts >= 10 THEN
    RETURN QUERY SELECT false, '尝试过于频繁，请稍后再试'::text, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_user;
  IF v_profile.id IS NULL OR v_profile.tenant_id IS NOT NULL THEN
    -- 防跳槽/档案缺失：同文案，不泄漏内部状态
    INSERT INTO invitation_redemption_attempts (user_id) VALUES (v_user);
    RETURN QUERY SELECT false, v_denied, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  SELECT * INTO v_inv FROM invitation_codes
   WHERE code = p_code AND status = 'active'
   FOR UPDATE;

  IF v_inv.id IS NULL
     OR v_inv.expires_at <= now()
     OR v_inv.used_count >= v_inv.max_uses
     OR NOT (v_inv.role::text = ANY(v_allowed_roles)) THEN
    INSERT INTO invitation_redemption_attempts (user_id) VALUES (v_user);
    RETURN QUERY SELECT false, v_denied, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  -- 服务端签发 membership
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

  -- 审计（含当时授予角色；append-only）
  INSERT INTO invitation_code_uses (invitation_code_id, user_id, tenant_id, role_granted, redeemed_at)
  VALUES (v_inv.id, v_user, v_inv.tenant_id, v_inv.role::text, now());

  UPDATE invitation_codes
     SET used_count = used_count + 1,
         status = CASE WHEN used_count + 1 >= max_uses THEN 'used' ELSE status END
   WHERE id = v_inv.id;

  -- 成功兑换清除该用户失败计数
  DELETE FROM invitation_redemption_attempts WHERE user_id = v_user;

  RETURN QUERY SELECT true, '成功加入租户'::text, v_inv.tenant_id, v_inv.store_id, v_inv.role;
END;
$$;

COMMENT ON FUNCTION public.join_tenant_with_code(text, uuid, text) IS
  'G0-Z2: bearer invite 仅授予 employee（INV-5）；统一错误文案（INV-3）；10min/10次失败限流（INV-4）；审计 append-only';
