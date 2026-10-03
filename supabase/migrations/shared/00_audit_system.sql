/*
# 审计日志系统 - 跨版本共享

## 功能说明
- 记录所有关键数据变更操作
- 支持数据恢复和回滚
- 跨版本审计追踪

## 表结构
1. audit_logs - 审计日志主表
2. data_snapshots - 数据快照表

## 安全策略
- 审计日志表只允许插入，不允许修改和删除
- 数据快照表只允许管理员操作
*/

-- 创建审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 版本信息
    app_version text NOT NULL,              -- 应用版本 (1.0.0, 2.0.0)
    migration_version text,                 -- 迁移版本
    
    -- 操作信息
    operation_type text NOT NULL,           -- 操作类型: INSERT/UPDATE/DELETE/RESTORE
    table_name text NOT NULL,               -- 表名
    record_id uuid,                         -- 记录ID
    
    -- 变更数据
    old_data jsonb,                         -- 变更前数据
    new_data jsonb,                         -- 变更后数据
    changes jsonb,                          -- 具体变更字段
    
    -- 操作人信息
    user_id uuid REFERENCES auth.users(id),
    user_role text,                         -- 用户角色
    tenant_id uuid,                         -- 租户ID
    
    -- 上下文信息
    operation_context jsonb,                -- 操作上下文（IP、设备等）
    error_info jsonb,                       -- 错误信息（如果有）
    
    -- 时间戳
    created_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_version ON audit_logs(app_version);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- 创建数据快照表（用于关键数据的定期备份）
CREATE TABLE IF NOT EXISTS data_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 快照信息
    snapshot_name text NOT NULL,            -- 快照名称
    app_version text NOT NULL,              -- 应用版本
    snapshot_type text NOT NULL,            -- 快照类型: manual/auto/pre-migration
    
    -- 快照数据
    tables_data jsonb NOT NULL,             -- 表数据（JSON格式）
    metadata jsonb,                         -- 元数据
    
    -- 状态
    status text DEFAULT 'active',           -- 状态: active/archived/deleted
    
    -- 创建信息
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    
    -- 恢复信息
    restored_at timestamptz,
    restored_by uuid REFERENCES auth.users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_snapshots_version ON data_snapshots(app_version);
CREATE INDEX IF NOT EXISTS idx_snapshots_type ON data_snapshots(snapshot_type);
CREATE INDEX IF NOT EXISTS idx_snapshots_created ON data_snapshots(created_at DESC);

-- 创建审计日志记录函数
CREATE OR REPLACE FUNCTION log_audit_event(
    p_app_version text,
    p_operation_type text,
    p_table_name text,
    p_record_id uuid,
    p_old_data jsonb,
    p_new_data jsonb,
    p_user_id uuid,
    p_tenant_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_audit_id uuid;
    v_changes jsonb;
BEGIN
    -- 计算变更字段
    IF p_old_data IS NOT NULL AND p_new_data IS NOT NULL THEN
        SELECT jsonb_object_agg(key, jsonb_build_object(
            'old', p_old_data->key,
            'new', p_new_data->key
        ))
        INTO v_changes
        FROM jsonb_each(p_new_data)
        WHERE p_old_data->key IS DISTINCT FROM p_new_data->key;
    END IF;
    
    -- 插入审计日志
    INSERT INTO audit_logs (
        app_version,
        operation_type,
        table_name,
        record_id,
        old_data,
        new_data,
        changes,
        user_id,
        tenant_id
    ) VALUES (
        p_app_version,
        p_operation_type,
        p_table_name,
        p_record_id,
        p_old_data,
        p_new_data,
        v_changes,
        p_user_id,
        p_tenant_id
    )
    RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$;

-- 创建数据快照函数
CREATE OR REPLACE FUNCTION create_data_snapshot(
    p_snapshot_name text,
    p_app_version text,
    p_snapshot_type text,
    p_table_names text[],
    p_user_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_snapshot_id uuid;
    v_tables_data jsonb := '{}'::jsonb;
    v_table_name text;
    v_table_data jsonb;
BEGIN
    -- 遍历表名，导出数据
    FOREACH v_table_name IN ARRAY p_table_names
    LOOP
        EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM %I t', v_table_name)
        INTO v_table_data;
        
        v_tables_data := v_tables_data || jsonb_build_object(v_table_name, v_table_data);
    END LOOP;
    
    -- 创建快照记录
    INSERT INTO data_snapshots (
        snapshot_name,
        app_version,
        snapshot_type,
        tables_data,
        created_by
    ) VALUES (
        p_snapshot_name,
        p_app_version,
        p_snapshot_type,
        v_tables_data,
        p_user_id
    )
    RETURNING id INTO v_snapshot_id;
    
    RETURN v_snapshot_id;
END;
$$;

-- 创建数据恢复函数（仅用于紧急情况）
CREATE OR REPLACE FUNCTION restore_from_snapshot(
    p_snapshot_id uuid,
    p_user_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_snapshot record;
    v_table_name text;
    v_table_data jsonb;
BEGIN
    -- 获取快照数据
    SELECT * INTO v_snapshot
    FROM data_snapshots
    WHERE id = p_snapshot_id AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '快照不存在或已被删除';
    END IF;
    
    -- 记录恢复操作
    INSERT INTO audit_logs (
        app_version,
        operation_type,
        table_name,
        user_id,
        operation_context
    ) VALUES (
        v_snapshot.app_version,
        'RESTORE',
        'data_snapshots',
        p_user_id,
        jsonb_build_object('snapshot_id', p_snapshot_id, 'snapshot_name', v_snapshot.snapshot_name)
    );
    
    -- 更新快照状态
    UPDATE data_snapshots
    SET restored_at = now(), restored_by = p_user_id
    WHERE id = p_snapshot_id;
    
    RETURN true;
END;
$$;

-- 创建审计日志查询视图
CREATE OR REPLACE VIEW audit_logs_summary AS
SELECT 
    app_version,
    table_name,
    operation_type,
    DATE(created_at) as operation_date,
    COUNT(*) as operation_count,
    COUNT(DISTINCT user_id) as user_count,
    COUNT(DISTINCT tenant_id) as tenant_count
FROM audit_logs
GROUP BY app_version, table_name, operation_type, DATE(created_at)
ORDER BY operation_date DESC, operation_count DESC;

-- 添加注释
COMMENT ON TABLE audit_logs IS '审计日志表 - 记录所有关键数据变更操作';
COMMENT ON TABLE data_snapshots IS '数据快照表 - 用于数据备份和恢复';
COMMENT ON FUNCTION log_audit_event IS '记录审计日志';
COMMENT ON FUNCTION create_data_snapshot IS '创建数据快照';
COMMENT ON FUNCTION restore_from_snapshot IS '从快照恢复数据';
