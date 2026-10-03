/*
# 招聘管理系统数据库设计

## 1. 概述
招聘管理系统是员工全生命周期管理的起点，负责管理招聘需求、职位发布、候选人管理、面试安排等功能。

## 2. 表结构设计

### 2.1 recruitment_positions（招聘职位表）
存储招聘职位信息
- `id` (uuid): 主键
- `position_name` (text): 职位名称
- `department` (text): 所属部门
- `position_level` (text): 职级
- `employment_type` (text): 用工类型（full_time/part_time/intern/contract）
- `headcount` (integer): 招聘人数
- `salary_range_min` (numeric): 薪资范围最低
- `salary_range_max` (numeric): 薪资范围最高
- `job_description` (text): 职位描述
- `job_requirements` (text): 任职要求
- `work_location` (text): 工作地点
- `status` (text): 状态（draft/published/closed）
- `priority` (text): 优先级（high/medium/low）
- `publish_date` (date): 发布日期
- `deadline` (date): 截止日期
- `created_by` (uuid): 创建人ID
- `created_at` (timestamptz): 创建时间
- `updated_at` (timestamptz): 更新时间

### 2.2 candidates（候选人表）
存储候选人信息
- `id` (uuid): 主键
- `name` (text): 姓名
- `gender` (text): 性别
- `phone` (text): 手机号
- `email` (text): 邮箱
- `birth_date` (date): 出生日期
- `education` (text): 学历
- `major` (text): 专业
- `work_experience` (text): 工作经验
- `resume_url` (text): 简历URL
- `source` (text): 来源渠道
- `status` (text): 状态（new/screening/interview/offer/hired/rejected）
- `applied_position_id` (uuid): 应聘职位ID
- `current_stage` (text): 当前阶段
- `tags` (text[]): 标签
- `notes` (text): 备注
- `created_at` (timestamptz): 创建时间
- `updated_at` (timestamptz): 更新时间

### 2.3 interviews（面试记录表）
存储面试安排和记录
- `id` (uuid): 主键
- `candidate_id` (uuid): 候选人ID
- `position_id` (uuid): 职位ID
- `interview_type` (text): 面试类型（phone/video/onsite/group）
- `interview_round` (integer): 面试轮次
- `interview_date` (timestamptz): 面试时间
- `interviewer_ids` (uuid[]): 面试官ID列表
- `location` (text): 面试地点
- `status` (text): 状态（scheduled/completed/cancelled/no_show）
- `score` (numeric): 面试评分
- `feedback` (text): 面试反馈
- `result` (text): 面试结果（pass/fail/pending）
- `created_at` (timestamptz): 创建时间
- `updated_at` (timestamptz): 更新时间

### 2.4 recruitment_stats（招聘统计表）
存储招聘统计数据
- `id` (uuid): 主键
- `date` (date): 统计日期
- `total_positions` (integer): 总职位数
- `active_positions` (integer): 活跃职位数
- `total_candidates` (integer): 总候选人数
- `new_candidates` (integer): 新增候选人数
- `interviews_scheduled` (integer): 已安排面试数
- `interviews_completed` (integer): 已完成面试数
- `offers_sent` (integer): 已发Offer数
- `candidates_hired` (integer): 已入职人数
- `created_at` (timestamptz): 创建时间

## 3. 安全策略
- 管理员可以管理所有招聘数据
- 面试官可以查看和评价自己参与的面试
- 候选人信息严格保密

## 4. 索引优化
- position_name索引：快速查询职位
- candidate_name索引：快速查询候选人
- status索引：按状态筛选
- interview_date索引：按时间查询面试

*/

-- ============================================
-- 1. 创建枚举类型
-- ============================================

-- 职位状态
DO $$ BEGIN
  CREATE TYPE position_status AS ENUM ('draft', 'published', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 优先级
DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 候选人状态
DO $$ BEGIN
  CREATE TYPE candidate_status AS ENUM ('new', 'screening', 'interview', 'offer', 'hired', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 面试类型
DO $$ BEGIN
  CREATE TYPE interview_type AS ENUM ('phone', 'video', 'onsite', 'group');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 面试状态
DO $$ BEGIN
  CREATE TYPE interview_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 面试结果
DO $$ BEGIN
  CREATE TYPE interview_result AS ENUM ('pass', 'fail', 'pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. 创建表
-- ============================================

-- 2.1 招聘职位表
CREATE TABLE IF NOT EXISTS recruitment_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_name text NOT NULL,
  department text,
  position_level text,
  employment_type employment_type DEFAULT 'full_time',
  headcount integer DEFAULT 1,
  salary_range_min numeric,
  salary_range_max numeric,
  job_description text,
  job_requirements text,
  work_location text,
  status position_status DEFAULT 'draft',
  priority priority_level DEFAULT 'medium',
  publish_date date,
  deadline date,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.2 候选人表
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  gender gender_type,
  phone text,
  email text,
  birth_date date,
  education text,
  major text,
  work_experience text,
  resume_url text,
  source text,
  status candidate_status DEFAULT 'new',
  applied_position_id uuid REFERENCES recruitment_positions(id) ON DELETE SET NULL,
  current_stage text,
  tags text[],
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.3 面试记录表
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  position_id uuid REFERENCES recruitment_positions(id) ON DELETE SET NULL,
  interview_type interview_type DEFAULT 'onsite',
  interview_round integer DEFAULT 1,
  interview_date timestamptz,
  interviewer_ids uuid[],
  location text,
  status interview_status DEFAULT 'scheduled',
  score numeric,
  feedback text,
  result interview_result DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.4 招聘统计表
CREATE TABLE IF NOT EXISTS recruitment_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  total_positions integer DEFAULT 0,
  active_positions integer DEFAULT 0,
  total_candidates integer DEFAULT 0,
  new_candidates integer DEFAULT 0,
  interviews_scheduled integer DEFAULT 0,
  interviews_completed integer DEFAULT 0,
  offers_sent integer DEFAULT 0,
  candidates_hired integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 3. 创建索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_recruitment_positions_name ON recruitment_positions(position_name);
CREATE INDEX IF NOT EXISTS idx_recruitment_positions_status ON recruitment_positions(status);
CREATE INDEX IF NOT EXISTS idx_recruitment_positions_department ON recruitment_positions(department);
CREATE INDEX IF NOT EXISTS idx_candidates_name ON candidates(name);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_phone ON candidates(phone);
CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(applied_position_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_date ON interviews(interview_date);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_recruitment_stats_date ON recruitment_stats(date);

-- ============================================
-- 4. 创建触发器
-- ============================================

-- 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_recruitment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_recruitment_positions_updated_at ON recruitment_positions;
CREATE TRIGGER trigger_update_recruitment_positions_updated_at
  BEFORE UPDATE ON recruitment_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_recruitment_updated_at();

DROP TRIGGER IF EXISTS trigger_update_candidates_updated_at ON candidates;
CREATE TRIGGER trigger_update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_recruitment_updated_at();

DROP TRIGGER IF EXISTS trigger_update_interviews_updated_at ON interviews;
CREATE TRIGGER trigger_update_interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_recruitment_updated_at();

-- ============================================
-- 5. 行级安全策略（RLS）
-- ============================================

ALTER TABLE recruitment_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_stats ENABLE ROW LEVEL SECURITY;

-- 管理员可以管理所有招聘职位
DROP POLICY IF EXISTS "管理员可以查看所有招聘职位" ON recruitment_positions;
CREATE POLICY "管理员可以查看所有招聘职位"
  ON recruitment_positions FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "管理员可以创建招聘职位" ON recruitment_positions;
CREATE POLICY "管理员可以创建招聘职位"
  ON recruitment_positions FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "管理员可以更新招聘职位" ON recruitment_positions;
CREATE POLICY "管理员可以更新招聘职位"
  ON recruitment_positions FOR UPDATE
  USING (is_admin(auth.uid()));

-- 管理员可以管理所有候选人
DROP POLICY IF EXISTS "管理员可以查看所有候选人" ON candidates;
CREATE POLICY "管理员可以查看所有候选人"
  ON candidates FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "管理员可以创建候选人" ON candidates;
CREATE POLICY "管理员可以创建候选人"
  ON candidates FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "管理员可以更新候选人" ON candidates;
CREATE POLICY "管理员可以更新候选人"
  ON candidates FOR UPDATE
  USING (is_admin(auth.uid()));

-- 管理员可以管理所有面试
DROP POLICY IF EXISTS "管理员可以查看所有面试" ON interviews;
CREATE POLICY "管理员可以查看所有面试"
  ON interviews FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "管理员可以创建面试" ON interviews;
CREATE POLICY "管理员可以创建面试"
  ON interviews FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "管理员可以更新面试" ON interviews;
CREATE POLICY "管理员可以更新面试"
  ON interviews FOR UPDATE
  USING (is_admin(auth.uid()));

-- 管理员可以查看招聘统计
DROP POLICY IF EXISTS "管理员可以查看招聘统计" ON recruitment_stats;
CREATE POLICY "管理员可以查看招聘统计"
  ON recruitment_stats FOR SELECT
  USING (is_admin(auth.uid()));

-- ============================================
-- 6. 插入示例数据
-- ============================================

-- 插入示例招聘职位
INSERT INTO recruitment_positions (position_name, department, position_level, employment_type, headcount, salary_range_min, salary_range_max, job_description, job_requirements, work_location, status, priority, publish_date) VALUES
  ('服务员', '前厅部', 'P1', 'full_time', 3, 4000, 6000, '负责餐厅日常服务工作，为顾客提供优质服务', '1. 有餐饮服务经验优先\n2. 形象气质佳\n3. 沟通能力强\n4. 能适应倒班', '北京市朝阳区', 'published', 'high', CURRENT_DATE),
  ('厨师', '后厨部', 'P2', 'full_time', 2, 6000, 10000, '负责菜品制作，保证出品质量和速度', '1. 3年以上厨师经验\n2. 熟悉川菜制作\n3. 有健康证\n4. 能吃苦耐劳', '北京市朝阳区', 'published', 'high', CURRENT_DATE),
  ('前厅主管', '前厅部', 'M1', 'full_time', 1, 7000, 12000, '负责前厅团队管理，提升服务质量', '1. 5年以上餐饮管理经验\n2. 有团队管理能力\n3. 熟悉餐饮服务流程\n4. 有责任心', '北京市朝阳区', 'published', 'medium', CURRENT_DATE),
  ('实习生', '前厅部', 'P1', 'intern', 2, 3000, 4000, '协助日常服务工作，学习餐饮服务技能', '1. 在校大学生\n2. 能实习3个月以上\n3. 积极主动\n4. 学习能力强', '北京市朝阳区', 'published', 'low', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- 插入示例候选人
INSERT INTO candidates (name, gender, phone, email, education, work_experience, source, status, applied_position_id, current_stage) 
SELECT 
  '张小明', 
  'male', 
  '13800001111', 
  'zhangxiaoming@example.com', 
  '本科', 
  '2年餐饮服务经验', 
  '招聘网站', 
  'interview', 
  rp.id,
  '一面'
FROM recruitment_positions rp WHERE rp.position_name = '服务员' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO candidates (name, gender, phone, email, education, work_experience, source, status, applied_position_id, current_stage) 
SELECT 
  '李小红', 
  'female', 
  '13800002222', 
  'lixiaohong@example.com', 
  '大专', 
  '5年川菜厨师经验', 
  '朋友推荐', 
  'interview', 
  rp.id,
  '二面'
FROM recruitment_positions rp WHERE rp.position_name = '厨师' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO candidates (name, gender, phone, email, education, work_experience, source, status, applied_position_id, current_stage) 
SELECT 
  '王小强', 
  'male', 
  '13800003333', 
  'wangxiaoqiang@example.com', 
  '本科', 
  '8年餐饮管理经验', 
  '猎头推荐', 
  'offer', 
  rp.id,
  '终面通过'
FROM recruitment_positions rp WHERE rp.position_name = '前厅主管' LIMIT 1
ON CONFLICT DO NOTHING;

-- 插入示例面试记录
INSERT INTO interviews (candidate_id, position_id, interview_type, interview_round, interview_date, location, status, result)
SELECT 
  c.id,
  c.applied_position_id,
  'onsite',
  1,
  now() + interval '2 days',
  '公司会议室A',
  'scheduled',
  'pending'
FROM candidates c WHERE c.name = '张小明' LIMIT 1
ON CONFLICT DO NOTHING;

-- 插入今日招聘统计
INSERT INTO recruitment_stats (date, total_positions, active_positions, total_candidates, new_candidates, interviews_scheduled, interviews_completed, offers_sent, candidates_hired)
VALUES (CURRENT_DATE, 4, 4, 3, 3, 1, 0, 1, 0)
ON CONFLICT (date) DO UPDATE SET
  total_positions = EXCLUDED.total_positions,
  active_positions = EXCLUDED.active_positions,
  total_candidates = EXCLUDED.total_candidates,
  new_candidates = EXCLUDED.new_candidates,
  interviews_scheduled = EXCLUDED.interviews_scheduled,
  interviews_completed = EXCLUDED.interviews_completed,
  offers_sent = EXCLUDED.offers_sent,
  candidates_hired = EXCLUDED.candidates_hired;
