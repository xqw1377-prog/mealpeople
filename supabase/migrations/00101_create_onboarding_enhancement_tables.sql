/*
# 创建入职功能增强表

## 1. 新增表

### handbook_reading_progress（手册阅读进度表）
- id (uuid, 主键)
- tenant_id (uuid, 租户ID)
- employee_id (uuid, 员工ID)
- section_id (text, 章节ID)
- is_read (boolean, 是否已读)
- read_at (timestamptz, 阅读时间)
- created_at (timestamptz, 创建时间)
- updated_at (timestamptz, 更新时间)

### hr_messages（HR留言表）
- id (uuid, 主键)
- tenant_id (uuid, 租户ID)
- employee_id (uuid, 员工ID)
- message (text, 留言内容)
- images (text[], 图片URL数组)
- status (text, 状态：pending/replied/closed)
- reply (text, 回复内容)
- replied_by (uuid, 回复人ID)
- replied_at (timestamptz, 回复时间)
- created_at (timestamptz, 创建时间)
- updated_at (timestamptz, 更新时间)

### help_article_feedback（帮助文章反馈表）
- id (uuid, 主键)
- tenant_id (uuid, 租户ID)
- employee_id (uuid, 员工ID)
- article_id (text, 文章ID)
- is_helpful (boolean, 是否有帮助)
- feedback_text (text, 反馈文字)
- created_at (timestamptz, 创建时间)

### learning_achievements（学习成就表）
- id (uuid, 主键)
- tenant_id (uuid, 租户ID)
- employee_id (uuid, 员工ID)
- achievement_type (text, 成就类型)
- achievement_name (text, 成就名称)
- achievement_icon (text, 成就图标)
- earned_at (timestamptz, 获得时间)
- created_at (timestamptz, 创建时间)

## 2. 安全策略
- 启用RLS
- 员工只能查看和管理自己的数据
- HR可以查看所有数据
- 管理员拥有完全权限

## 3. 索引
- 为常用查询字段创建索引
- 优化查询性能
*/

-- 1. 创建手册阅读进度表
CREATE TABLE IF NOT EXISTS handbook_reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, section_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_handbook_reading_progress_employee 
  ON handbook_reading_progress(employee_id);
CREATE INDEX IF NOT EXISTS idx_handbook_reading_progress_tenant 
  ON handbook_reading_progress(tenant_id);

-- 启用RLS
ALTER TABLE handbook_reading_progress ENABLE ROW LEVEL SECURITY;

-- RLS策略：员工只能查看自己的阅读进度
CREATE POLICY "员工可以查看自己的阅读进度" ON handbook_reading_progress
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- RLS策略：员工可以插入自己的阅读进度
CREATE POLICY "员工可以插入自己的阅读进度" ON handbook_reading_progress
  FOR INSERT WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- RLS策略：员工可以更新自己的阅读进度
CREATE POLICY "员工可以更新自己的阅读进度" ON handbook_reading_progress
  FOR UPDATE USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- RLS策略：管理员可以查看所有阅读进度
CREATE POLICY "管理员可以查看所有阅读进度" ON handbook_reading_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('super_admin'::user_role, 'tenant_admin'::user_role)
    )
  );

-- 2. 创建HR留言表
CREATE TABLE IF NOT EXISTS hr_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  images TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'closed')),
  reply TEXT,
  replied_by UUID REFERENCES profiles(id),
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_hr_messages_employee 
  ON hr_messages(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_messages_tenant 
  ON hr_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_messages_status 
  ON hr_messages(status);

-- 启用RLS
ALTER TABLE hr_messages ENABLE ROW LEVEL SECURITY;

-- RLS策略：员工可以查看自己的留言
CREATE POLICY "员工可以查看自己的留言" ON hr_messages
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- RLS策略：员工可以创建留言
CREATE POLICY "员工可以创建留言" ON hr_messages
  FOR INSERT WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- RLS策略：管理员可以查看和回复所有留言
CREATE POLICY "管理员可以管理所有留言" ON hr_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('super_admin'::user_role, 'tenant_admin'::user_role)
    )
  );

-- 3. 创建帮助文章反馈表
CREATE TABLE IF NOT EXISTS help_article_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, article_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_help_article_feedback_employee 
  ON help_article_feedback(employee_id);
CREATE INDEX IF NOT EXISTS idx_help_article_feedback_article 
  ON help_article_feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_help_article_feedback_tenant 
  ON help_article_feedback(tenant_id);

-- 启用RLS
ALTER TABLE help_article_feedback ENABLE ROW LEVEL SECURITY;

-- RLS策略：员工可以查看自己的反馈
CREATE POLICY "员工可以查看自己的反馈" ON help_article_feedback
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- RLS策略：员工可以创建反馈
CREATE POLICY "员工可以创建反馈" ON help_article_feedback
  FOR INSERT WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- RLS策略：员工可以更新自己的反馈
CREATE POLICY "员工可以更新自己的反馈" ON help_article_feedback
  FOR UPDATE USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- RLS策略：管理员可以查看所有反馈
CREATE POLICY "管理员可以查看所有反馈" ON help_article_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('super_admin'::user_role, 'tenant_admin'::user_role)
    )
  );

-- 4. 创建学习成就表
CREATE TABLE IF NOT EXISTS learning_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_icon TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_learning_achievements_employee 
  ON learning_achievements(employee_id);
CREATE INDEX IF NOT EXISTS idx_learning_achievements_tenant 
  ON learning_achievements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_learning_achievements_type 
  ON learning_achievements(achievement_type);

-- 启用RLS
ALTER TABLE learning_achievements ENABLE ROW LEVEL SECURITY;

-- RLS策略：员工可以查看自己的成就
CREATE POLICY "员工可以查看自己的成就" ON learning_achievements
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- RLS策略：系统可以创建成就（通过服务端）
CREATE POLICY "系统可以创建成就" ON learning_achievements
  FOR INSERT WITH CHECK (true);

-- RLS策略：管理员可以查看所有成就
CREATE POLICY "管理员可以查看所有成就" ON learning_achievements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('super_admin'::user_role, 'tenant_admin'::user_role)
    )
  );

-- 5. 创建更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 为需要的表添加更新时间触发器
DROP TRIGGER IF EXISTS update_handbook_reading_progress_updated_at ON handbook_reading_progress;
CREATE TRIGGER update_handbook_reading_progress_updated_at
    BEFORE UPDATE ON handbook_reading_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hr_messages_updated_at ON hr_messages;
CREATE TRIGGER update_hr_messages_updated_at
    BEFORE UPDATE ON hr_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. 添加注释
COMMENT ON TABLE handbook_reading_progress IS '手册阅读进度表';
COMMENT ON TABLE hr_messages IS 'HR留言表';
COMMENT ON TABLE help_article_feedback IS '帮助文章反馈表';
COMMENT ON TABLE learning_achievements IS '学习成就表';
