/*
# 管理中心优化 - 数据库迁移

## 1. 扩展租户配置表
- 添加品牌信息字段
- 添加行业信息字段
- 添加联系信息字段

## 2. 扩展用户表
- 添加status字段用于用户状态管理

## 3. 创建邀请码表
- 用于员工加入租户的邀请码管理
- 支持设置有效期和使用次数限制

## 4. 安全策略
- 邀请码表的RLS策略
- 租户配置表的RLS策略
*/

-- 1. 扩展租户配置表
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS brand_name text;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS contact_person text;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS description text;

-- 2. 扩展用户表
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- 3. 创建邀请码表
CREATE TABLE IF NOT EXISTS invitation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  code text NOT NULL UNIQUE,
  role user_role DEFAULT 'employee'::user_role NOT NULL,
  max_uses integer DEFAULT 1,
  used_count integer DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  CONSTRAINT valid_max_uses CHECK (max_uses > 0),
  CONSTRAINT valid_used_count CHECK (used_count >= 0 AND used_count <= max_uses)
);

-- 3. 创建邀请码使用记录表
CREATE TABLE IF NOT EXISTS invitation_code_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_code_id uuid NOT NULL REFERENCES invitation_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  used_at timestamptz DEFAULT now()
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_invitation_codes_tenant ON invitation_codes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_status ON invitation_codes(status);
CREATE INDEX IF NOT EXISTS idx_invitation_code_uses_code ON invitation_code_uses(invitation_code_id);
CREATE INDEX IF NOT EXISTS idx_invitation_code_uses_user ON invitation_code_uses(user_id);

-- 5. 启用RLS
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_code_uses ENABLE ROW LEVEL SECURITY;

-- 6. 创建RLS策略 - 邀请码表

-- 租户管理员可以查看和管理本租户的邀请码
CREATE POLICY "租户管理员可以查看本租户邀请码" ON invitation_codes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = invitation_codes.tenant_id
      AND profiles.role IN ('tenant_admin'::user_role, 'super_admin'::user_role)
    )
  );

CREATE POLICY "租户管理员可以创建本租户邀请码" ON invitation_codes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = invitation_codes.tenant_id
      AND profiles.role IN ('tenant_admin'::user_role, 'super_admin'::user_role)
    )
  );

CREATE POLICY "租户管理员可以更新本租户邀请码" ON invitation_codes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = invitation_codes.tenant_id
      AND profiles.role IN ('tenant_admin'::user_role, 'super_admin'::user_role)
    )
  );

CREATE POLICY "租户管理员可以删除本租户邀请码" ON invitation_codes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = invitation_codes.tenant_id
      AND profiles.role IN ('tenant_admin'::user_role, 'super_admin'::user_role)
    )
  );

-- 任何人都可以验证邀请码（用于加入流程）
CREATE POLICY "任何人都可以查看有效邀请码" ON invitation_codes
  FOR SELECT
  USING (status = 'active' AND expires_at > now());

-- 7. 创建RLS策略 - 邀请码使用记录表

-- 租户管理员可以查看本租户的邀请码使用记录
CREATE POLICY "租户管理员可以查看邀请码使用记录" ON invitation_code_uses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invitation_codes ic
      JOIN profiles p ON p.id = auth.uid()
      WHERE ic.id = invitation_code_uses.invitation_code_id
      AND p.tenant_id = ic.tenant_id
      AND p.role IN ('tenant_admin'::user_role, 'super_admin'::user_role)
    )
  );

-- 用户可以创建自己的使用记录
CREATE POLICY "用户可以创建使用记录" ON invitation_code_uses
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 8. 创建函数：生成邀请码
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(code_chars, floor(random() * length(code_chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$;

-- 9. 创建函数：验证邀请码
CREATE OR REPLACE FUNCTION validate_invitation_code(p_code text)
RETURNS TABLE (
  is_valid boolean,
  tenant_id uuid,
  tenant_name text,
  store_id uuid,
  store_name text,
  role user_role,
  message text
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_invitation invitation_codes%ROWTYPE;
  v_tenant tenants%ROWTYPE;
  v_store stores%ROWTYPE;
BEGIN
  -- 查找邀请码
  SELECT * INTO v_invitation
  FROM invitation_codes
  WHERE code = p_code;

  -- 邀请码不存在
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::uuid, NULL::text, NULL::user_role, '邀请码不存在'::text;
    RETURN;
  END IF;

  -- 邀请码已停用
  IF v_invitation.status != 'active' THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::uuid, NULL::text, NULL::user_role, '邀请码已停用'::text;
    RETURN;
  END IF;

  -- 邀请码已过期
  IF v_invitation.expires_at < now() THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::uuid, NULL::text, NULL::user_role, '邀请码已过期'::text;
    RETURN;
  END IF;

  -- 邀请码已达到使用次数上限
  IF v_invitation.used_count >= v_invitation.max_uses THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::uuid, NULL::text, NULL::user_role, '邀请码已达到使用次数上限'::text;
    RETURN;
  END IF;

  -- 获取租户信息
  SELECT * INTO v_tenant
  FROM tenants
  WHERE id = v_invitation.tenant_id;

  -- 获取店铺信息（如果有）
  IF v_invitation.store_id IS NOT NULL THEN
    SELECT * INTO v_store
    FROM stores
    WHERE id = v_invitation.store_id;
  END IF;

  -- 邀请码有效
  RETURN QUERY SELECT 
    true,
    v_invitation.tenant_id,
    v_tenant.name,
    v_invitation.store_id,
    COALESCE(v_store.name, '未指定店铺'::text),
    v_invitation.role,
    '邀请码有效'::text;
END;
$$;

-- 10. 创建函数：使用邀请码加入租户
CREATE OR REPLACE FUNCTION join_tenant_with_code(
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
AS $$
DECLARE
  v_invitation invitation_codes%ROWTYPE;
  v_existing_profile profiles%ROWTYPE;
BEGIN
  -- 验证邀请码
  SELECT * INTO v_invitation
  FROM invitation_codes
  WHERE code = p_code
  AND status = 'active'
  AND expires_at > now()
  AND used_count < max_uses;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '邀请码无效或已过期'::text, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  -- 检查用户是否已经属于该租户
  SELECT * INTO v_existing_profile
  FROM profiles
  WHERE id = p_user_id;

  IF FOUND AND v_existing_profile.tenant_id = v_invitation.tenant_id THEN
    RETURN QUERY SELECT false, '您已经是该租户的成员'::text, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  -- 更新用户的租户和角色
  UPDATE profiles
  SET 
    tenant_id = v_invitation.tenant_id,
    role = v_invitation.role,
    name = COALESCE(name, p_user_name),
    updated_at = now()
  WHERE id = p_user_id;

  -- 增加邀请码使用次数
  UPDATE invitation_codes
  SET used_count = used_count + 1
  WHERE id = v_invitation.id;

  -- 记录使用记录
  INSERT INTO invitation_code_uses (invitation_code_id, user_id)
  VALUES (v_invitation.id, p_user_id);

  -- 如果指定了店铺，创建员工记录
  IF v_invitation.store_id IS NOT NULL THEN
    INSERT INTO employees (
      tenant_id,
      store_id,
      user_id,
      name,
      employee_type,
      status
    ) VALUES (
      v_invitation.tenant_id,
      v_invitation.store_id,
      p_user_id,
      p_user_name,
      'full_time',
      'active'
    )
    ON CONFLICT (tenant_id, user_id) DO UPDATE
    SET store_id = v_invitation.store_id;
  END IF;

  RETURN QUERY SELECT 
    true,
    '成功加入租户'::text,
    v_invitation.tenant_id,
    v_invitation.store_id,
    v_invitation.role;
END;
$$;

-- 11. 添加注释
COMMENT ON TABLE invitation_codes IS '邀请码表，用于员工加入租户';
COMMENT ON TABLE invitation_code_uses IS '邀请码使用记录表';
COMMENT ON COLUMN invitation_codes.code IS '邀请码，格式：6位大写字母和数字';
COMMENT ON COLUMN invitation_codes.role IS '加入后的角色';
COMMENT ON COLUMN invitation_codes.max_uses IS '最大使用次数';
COMMENT ON COLUMN invitation_codes.used_count IS '已使用次数';
COMMENT ON COLUMN invitation_codes.expires_at IS '过期时间';
COMMENT ON FUNCTION generate_invitation_code() IS '生成6位随机邀请码';
COMMENT ON FUNCTION validate_invitation_code(text) IS '验证邀请码是否有效';
COMMENT ON FUNCTION join_tenant_with_code(text, uuid, text) IS '使用邀请码加入租户';
