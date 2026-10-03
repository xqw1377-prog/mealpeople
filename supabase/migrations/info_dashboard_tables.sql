/*
# 信息交互仪表盘数据表

## 1. 功能说明
信息交互仪表盘用于发布和管理公司、门店的重要信息，包括：
- 公告通知
- 会议通知
- 文件资料
- 紧急通知

## 2. 表结构说明
- announcements: 消息公告主表
- announcement_reads: 阅读记录表
- meeting_confirmations: 会议确认表
- file_categories: 文件分类表

## 3. 双线设计
- 员工线：查看消息、标记已读、确认会议、下载文件
- 管理线：发布消息、管理消息、查看统计、管理文件

*/

-- ============================================
-- 消息公告表
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- 基本信息
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('announcement', 'meeting', 'file', 'urgent')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
    
    -- 发布信息
    publisher_id UUID NOT NULL,
    publisher_name TEXT NOT NULL,
    publish_time TIMESTAMPTZ DEFAULT NOW(),
    
    -- 发布范围
    target_type TEXT NOT NULL CHECK (target_type IN ('all', 'department', 'store', 'specific')),
    target_ids JSONB, -- 目标部门/门店/员工ID列表 ["id1", "id2"]
    
    -- 附件信息
    attachments JSONB, -- [{name: "文件名", url: "下载链接", size: 1024, type: "pdf"}]
    
    -- 会议信息（仅会议类型）
    meeting_time TIMESTAMPTZ,
    meeting_location TEXT,
    meeting_participants JSONB, -- 参会人员ID列表 ["id1", "id2"]
    
    -- 状态
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    is_pinned BOOLEAN DEFAULT FALSE, -- 是否置顶
    
    -- 统计信息
    view_count INTEGER DEFAULT 0, -- 查看次数
    read_count INTEGER DEFAULT 0, -- 已读人数
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 阅读记录表
-- ============================================
CREATE TABLE IF NOT EXISTS announcement_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    read_time TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 唯一约束：每个员工对每条消息只能有一条阅读记录
    UNIQUE(announcement_id, employee_id)
);

-- ============================================
-- 会议确认表
-- ============================================
CREATE TABLE IF NOT EXISTS meeting_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
    confirm_time TIMESTAMPTZ,
    decline_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 唯一约束：每个员工对每个会议只能有一条确认记录
    UNIQUE(announcement_id, employee_id)
);

-- ============================================
-- 文件分类表
-- ============================================
CREATE TABLE IF NOT EXISTS file_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES file_categories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    icon TEXT, -- 图标名称
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 消息评论表（可选功能）
-- ============================================
CREATE TABLE IF NOT EXISTS announcement_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES announcement_comments(id) ON DELETE CASCADE, -- 回复评论
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 消息收藏表（可选功能）
-- ============================================
CREATE TABLE IF NOT EXISTS announcement_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 唯一约束：每个员工对每条消息只能收藏一次
    UNIQUE(announcement_id, employee_id)
);

-- ============================================
-- 创建索引
-- ============================================

-- 消息公告表索引
CREATE INDEX idx_announcements_tenant ON announcements(tenant_id);
CREATE INDEX idx_announcements_category ON announcements(category);
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_publish_time ON announcements(publish_time DESC);
CREATE INDEX idx_announcements_publisher ON announcements(publisher_id);
CREATE INDEX idx_announcements_pinned ON announcements(is_pinned) WHERE is_pinned = TRUE;

-- 阅读记录表索引
CREATE INDEX idx_announcement_reads_announcement ON announcement_reads(announcement_id);
CREATE INDEX idx_announcement_reads_employee ON announcement_reads(employee_id);
CREATE INDEX idx_announcement_reads_time ON announcement_reads(read_time DESC);

-- 会议确认表索引
CREATE INDEX idx_meeting_confirmations_announcement ON meeting_confirmations(announcement_id);
CREATE INDEX idx_meeting_confirmations_employee ON meeting_confirmations(employee_id);
CREATE INDEX idx_meeting_confirmations_status ON meeting_confirmations(status);

-- 文件分类表索引
CREATE INDEX idx_file_categories_tenant ON file_categories(tenant_id);
CREATE INDEX idx_file_categories_parent ON file_categories(parent_id);
CREATE INDEX idx_file_categories_sort ON file_categories(sort_order);

-- 评论表索引
CREATE INDEX idx_announcement_comments_announcement ON announcement_comments(announcement_id);
CREATE INDEX idx_announcement_comments_employee ON announcement_comments(employee_id);
CREATE INDEX idx_announcement_comments_parent ON announcement_comments(parent_id);

-- 收藏表索引
CREATE INDEX idx_announcement_favorites_announcement ON announcement_favorites(announcement_id);
CREATE INDEX idx_announcement_favorites_employee ON announcement_favorites(employee_id);

-- ============================================
-- 创建触发器：自动更新 updated_at
-- ============================================

-- 更新 announcements 表的 updated_at
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_announcements_updated_at();

-- 更新 meeting_confirmations 表的 updated_at
CREATE OR REPLACE FUNCTION update_meeting_confirmations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_meeting_confirmations_updated_at
    BEFORE UPDATE ON meeting_confirmations
    FOR EACH ROW
    EXECUTE FUNCTION update_meeting_confirmations_updated_at();

-- ============================================
-- 创建触发器：自动更新阅读统计
-- ============================================

-- 当新增阅读记录时，更新消息的已读人数
CREATE OR REPLACE FUNCTION update_announcement_read_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE announcements
    SET read_count = read_count + 1
    WHERE id = NEW.announcement_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_announcement_read_count
    AFTER INSERT ON announcement_reads
    FOR EACH ROW
    EXECUTE FUNCTION update_announcement_read_count();

-- 当删除阅读记录时，更新消息的已读人数
CREATE OR REPLACE FUNCTION decrease_announcement_read_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE announcements
    SET read_count = GREATEST(read_count - 1, 0)
    WHERE id = OLD.announcement_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrease_announcement_read_count
    AFTER DELETE ON announcement_reads
    FOR EACH ROW
    EXECUTE FUNCTION decrease_announcement_read_count();

-- ============================================
-- 创建视图：未读消息统计
-- ============================================

CREATE OR REPLACE VIEW unread_announcements_stats AS
SELECT 
    a.tenant_id,
    a.category,
    a.priority,
    COUNT(*) as total_count
FROM announcements a
WHERE a.status = 'published'
GROUP BY a.tenant_id, a.category, a.priority;

-- ============================================
-- 创建函数：获取员工未读消息数量
-- ============================================

CREATE OR REPLACE FUNCTION get_unread_count(
    p_employee_id UUID,
    p_tenant_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM announcements a
    WHERE a.tenant_id = p_tenant_id
        AND a.status = 'published'
        AND NOT EXISTS (
            SELECT 1 
            FROM announcement_reads ar 
            WHERE ar.announcement_id = a.id 
                AND ar.employee_id = p_employee_id
        );
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 创建函数：获取员工可见的消息列表
-- ============================================

CREATE OR REPLACE FUNCTION get_employee_announcements(
    p_employee_id UUID,
    p_tenant_id UUID,
    p_department_id UUID DEFAULT NULL,
    p_store_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    category TEXT,
    priority TEXT,
    publisher_name TEXT,
    publish_time TIMESTAMPTZ,
    is_read BOOLEAN,
    is_pinned BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.content,
        a.category,
        a.priority,
        a.publisher_name,
        a.publish_time,
        EXISTS(
            SELECT 1 
            FROM announcement_reads ar 
            WHERE ar.announcement_id = a.id 
                AND ar.employee_id = p_employee_id
        ) as is_read,
        a.is_pinned
    FROM announcements a
    WHERE a.tenant_id = p_tenant_id
        AND a.status = 'published'
        AND (
            a.target_type = 'all'
            OR (a.target_type = 'specific' AND a.target_ids ? p_employee_id::TEXT)
            OR (a.target_type = 'department' AND p_department_id IS NOT NULL AND a.target_ids ? p_department_id::TEXT)
            OR (a.target_type = 'store' AND p_store_id IS NOT NULL AND a.target_ids ? p_store_id::TEXT)
        )
    ORDER BY a.is_pinned DESC, a.publish_time DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 示例数据（可选）
-- ============================================

-- 插入示例文件分类
-- INSERT INTO file_categories (tenant_id, name, description, sort_order, icon) VALUES
-- ('租户ID', '公司制度', '公司各项规章制度文件', 1, 'i-mdi-file-document'),
-- ('租户ID', '培训资料', '员工培训相关资料', 2, 'i-mdi-school'),
-- ('租户ID', '操作手册', '各岗位操作手册', 3, 'i-mdi-book-open'),
-- ('租户ID', '表格模板', '常用表格模板', 4, 'i-mdi-table');
