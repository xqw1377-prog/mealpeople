/*
# 创建通知系统表

## 1. 新增表

### notifications 表
用于存储系统通知消息，支持多种通知类型（任务、培训、排班、系统）。

**字段说明**：
- `id` (uuid, 主键): 通知ID
- `tenant_id` (uuid, 必填): 租户ID，关联 tenants 表
- `user_id` (uuid, 必填): 接收通知的用户ID，关联 profiles 表
- `type` (text, 必填): 通知类型（task/training/schedule/system）
- `title` (text, 必填): 通知标题
- `content` (text, 必填): 通知内容
- `related_id` (uuid, 可选): 关联的业务对象ID（任务ID、培训ID等）
- `related_type` (text, 可选): 关联的业务对象类型
- `is_read` (boolean, 默认false): 是否已读
- `read_at` (timestamptz, 可选): 阅读时间
- `created_at` (timestamptz, 默认now()): 创建时间

## 2. 安全策略 (RLS)

### 策略说明
- 用户可以查看自己的通知
- 用户可以标记自己的通知为已读
- 管理员可以创建通知
- 系统可以自动创建通知

### 策略列表
1. **用户查看自己的通知**: 用户只能查看发送给自己的通知
2. **用户标记已读**: 用户可以更新自己通知的已读状态
3. **管理员创建通知**: 管理员可以创建通知
*/

-- 创建通知类型枚举
CREATE TYPE notification_type AS ENUM ('task', 'training', 'schedule', 'system');

-- 创建通知表
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  related_id uuid,
  related_type text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 启用 RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 策略1: 用户可以查看自己的通知
CREATE POLICY "用户可以查看自己的通知" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- 策略2: 用户可以标记自己的通知为已读
CREATE POLICY "用户可以标记已读" ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 策略3: 管理员可以创建通知
CREATE POLICY "管理员可以创建通知" ON notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'tenant_admin', 'store_manager')
    )
  );

-- 策略4: 管理员可以查看租户内的所有通知
CREATE POLICY "管理员可以查看租户通知" ON notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'tenant_admin', 'store_manager')
      AND (role = 'super_admin' OR profiles.tenant_id = notifications.tenant_id)
    )
  );
