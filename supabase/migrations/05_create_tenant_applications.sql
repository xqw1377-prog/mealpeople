/*
# 创建租户申请表

## 1. 新建表
- `tenant_applications` - 租户申请表
  - `id` (uuid, 主键) - 申请ID
  - `applicant_id` (uuid, 外键) - 申请人ID
  - `applicant_phone` (text) - 申请人电话
  - `tenant_name` (text) - 租户名称
  - `industry` (text) - 行业类型
  - `company_address` (text) - 公司地址
  - `business_license` (text) - 营业执照号
  - `contact_person` (text) - 联系人
  - `contact_phone` (text) - 联系电话
  - `description` (text) - 租户描述
  - `status` (text) - 申请状态：pending(待审核)/approved(已批准)/rejected(已拒绝)
  - `rejection_reason` (text) - 拒绝原因
  - `created_at` (timestamptz) - 创建时间
  - `updated_at` (timestamptz) - 更新时间
  - `reviewed_by` (uuid, 外键) - 审核人ID
  - `reviewed_at` (timestamptz) - 审核时间

## 2. 安全策略
- 启用 RLS
- 认证用户可以创建申请
- 用户可以查看自己的申请
- 超级管理员可以查看所有申请
- 超级管理员可以更新申请状态
*/

-- 创建租户申请表
CREATE TABLE IF NOT EXISTS tenant_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  applicant_phone TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  company_address TEXT NOT NULL,
  business_license TEXT,
  contact_person TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX idx_tenant_applications_applicant ON tenant_applications(applicant_id);
CREATE INDEX idx_tenant_applications_status ON tenant_applications(status);
CREATE INDEX idx_tenant_applications_created ON tenant_applications(created_at DESC);

-- 启用 RLS
ALTER TABLE tenant_applications ENABLE ROW LEVEL SECURITY;

-- 认证用户可以创建申请
CREATE POLICY "认证用户可以创建租户申请" ON tenant_applications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 用户可以查看自己的申请
CREATE POLICY "用户可以查看自己的申请" ON tenant_applications
  FOR SELECT TO authenticated
  USING (applicant_id = auth.uid());

-- 超级管理员可以查看所有申请
CREATE POLICY "超级管理员可以查看所有申请" ON tenant_applications
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

-- 超级管理员可以更新申请状态
CREATE POLICY "超级管理员可以更新申请" ON tenant_applications
  FOR UPDATE TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_tenant_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_applications_updated_at
  BEFORE UPDATE ON tenant_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_applications_updated_at();
