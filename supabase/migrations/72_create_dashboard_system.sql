/*
# 管理工作台系统数据库设计

## 1. 概述
管理工作台是管理者的核心工作界面，提供全局数据概览、关键指标监控、待办事项管理等功能。

## 2. 表结构设计

### 2.1 dashboard_widgets（仪表盘组件表）
存储管理者自定义的仪表盘组件配置
- `id` (uuid): 主键
- `user_id` (uuid): 用户ID，关联profiles表
- `widget_type` (text): 组件类型（stats/chart/list/calendar）
- `widget_config` (jsonb): 组件配置（标题、数据源、样式等）
- `position` (integer): 显示位置
- `is_visible` (boolean): 是否可见
- `created_at` (timestamptz): 创建时间
- `updated_at` (timestamptz): 更新时间

### 2.2 dashboard_alerts（仪表盘警报表）
存储系统自动生成的警报和提醒
- `id` (uuid): 主键
- `alert_type` (text): 警报类型（attendance/performance/leave/overtime）
- `severity` (text): 严重程度（info/warning/error/critical）
- `title` (text): 警报标题
- `message` (text): 警报内容
- `related_id` (uuid): 关联对象ID（可选）
- `is_read` (boolean): 是否已读
- `is_resolved` (boolean): 是否已解决
- `created_at` (timestamptz): 创建时间
- `resolved_at` (timestamptz): 解决时间

### 2.3 dashboard_quick_actions（快捷操作表）
存储管理者常用的快捷操作
- `id` (uuid): 主键
- `user_id` (uuid): 用户ID
- `action_type` (text): 操作类型
- `action_name` (text): 操作名称
- `action_config` (jsonb): 操作配置
- `usage_count` (integer): 使用次数
- `last_used_at` (timestamptz): 最后使用时间
- `created_at` (timestamptz): 创建时间

## 3. 安全策略
- 仅管理员可以访问仪表盘数据
- 用户只能查看和修改自己的组件配置
- 警报数据根据用户角色和权限过滤

## 4. 索引优化
- user_id索引：快速查询用户的组件配置
- alert_type索引：快速筛选警报类型
- created_at索引：按时间排序

*/

-- ============================================
-- 1. 创建枚举类型
-- ============================================

-- 组件类型
CREATE TYPE widget_type AS ENUM (
  'stats',      -- 统计卡片
  'chart',      -- 图表
  'list',       -- 列表
  'calendar'    -- 日历
);

-- 警报类型
CREATE TYPE alert_type AS ENUM (
  'attendance',   -- 考勤相关
  'performance',  -- 绩效相关
  'leave',        -- 请假相关
  'overtime',     -- 加班相关
  'salary',       -- 薪酬相关
  'promotion',    -- 晋升相关
  'transfer',     -- 调岗相关
  'onboarding',   -- 入职相关
  'offboarding',  -- 离职相关
  'system'        -- 系统相关
);

-- 严重程度
CREATE TYPE alert_severity AS ENUM (
  'info',      -- 信息
  'warning',   -- 警告
  'error',     -- 错误
  'critical'   -- 严重
);

-- ============================================
-- 2. 创建表
-- ============================================

-- 2.1 仪表盘组件表
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  widget_type widget_type NOT NULL,
  widget_config jsonb NOT NULL DEFAULT '{}',
  position integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.2 仪表盘警报表
CREATE TABLE IF NOT EXISTS dashboard_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type alert_type NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  related_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  is_resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- 2.3 快捷操作表
CREATE TABLE IF NOT EXISTS dashboard_quick_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_name text NOT NULL,
  action_config jsonb NOT NULL DEFAULT '{}',
  usage_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 3. 创建索引
-- ============================================

CREATE INDEX idx_dashboard_widgets_user_id ON dashboard_widgets(user_id);
CREATE INDEX idx_dashboard_widgets_position ON dashboard_widgets(position);
CREATE INDEX idx_dashboard_alerts_type ON dashboard_alerts(alert_type);
CREATE INDEX idx_dashboard_alerts_severity ON dashboard_alerts(severity);
CREATE INDEX idx_dashboard_alerts_created_at ON dashboard_alerts(created_at DESC);
CREATE INDEX idx_dashboard_quick_actions_user_id ON dashboard_quick_actions(user_id);
CREATE INDEX idx_dashboard_quick_actions_usage ON dashboard_quick_actions(usage_count DESC);

-- ============================================
-- 4. 创建触发器
-- ============================================

-- 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_dashboard_widgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_widgets_updated_at();

-- ============================================
-- 5. 行级安全策略（RLS）
-- ============================================

ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_quick_actions ENABLE ROW LEVEL SECURITY;

-- 仪表盘组件策略
CREATE POLICY "用户可以查看自己的组件配置"
  ON dashboard_widgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的组件配置"
  ON dashboard_widgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的组件配置"
  ON dashboard_widgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的组件配置"
  ON dashboard_widgets FOR DELETE
  USING (auth.uid() = user_id);

-- 管理员可以查看所有警报
CREATE POLICY "管理员可以查看所有警报"
  ON dashboard_alerts FOR SELECT
  USING (is_admin(auth.uid()));

-- 管理员可以更新警报状态
CREATE POLICY "管理员可以更新警报"
  ON dashboard_alerts FOR UPDATE
  USING (is_admin(auth.uid()));

-- 快捷操作策略
CREATE POLICY "用户可以查看自己的快捷操作"
  ON dashboard_quick_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的快捷操作"
  ON dashboard_quick_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的快捷操作"
  ON dashboard_quick_actions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的快捷操作"
  ON dashboard_quick_actions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. 插入示例数据
-- ============================================

-- 插入示例警报数据
INSERT INTO dashboard_alerts (alert_type, severity, title, message) VALUES
  ('attendance'::alert_type, 'warning'::alert_severity, '考勤异常提醒', '今日有3名员工未按时打卡'),
  ('leave'::alert_type, 'info'::alert_severity, '请假审批待处理', '有5个请假申请等待审批'),
  ('performance'::alert_type, 'warning'::alert_severity, '绩效目标预警', '本月有2名员工绩效目标完成率低于50%'),
  ('overtime'::alert_type, 'info'::alert_severity, '加班申请待审批', '有3个加班申请等待审批'),
  ('onboarding'::alert_type, 'info'::alert_severity, '新员工入职提醒', '明天有2名新员工入职'),
  ('system'::alert_type, 'info'::alert_severity, '系统更新通知', '系统将于今晚22:00进行维护更新');
