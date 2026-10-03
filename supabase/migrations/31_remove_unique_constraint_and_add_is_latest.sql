/*
# 移除排班结果表的唯一约束并添加is_latest字段

## 1. 变更说明

### 移除UNIQUE约束
- 移除 schedule_results 表的 UNIQUE(tenant_id, store_id, operation_date) 约束
- 允许同一天有多条排班记录，用于记录调整历史

### 添加is_latest字段
- `is_latest` (boolean): 标记是否为最新记录，默认true
- 每次插入新记录时，将同一天的旧记录的is_latest设置为false

## 2. 查询逻辑
- 查询最新记录：WHERE is_latest = true
- 查询历史记录：WHERE is_latest = false ORDER BY created_at DESC
- 查询所有记录：ORDER BY created_at DESC

## 3. 注意事项
- 现有数据的is_latest字段将被设置为true
- 插入新记录时需要手动更新旧记录的is_latest字段
*/

-- 删除唯一约束
ALTER TABLE schedule_results 
DROP CONSTRAINT IF EXISTS schedule_results_tenant_id_store_id_operation_date_key;

-- 添加is_latest字段
ALTER TABLE schedule_results 
ADD COLUMN IF NOT EXISTS is_latest boolean DEFAULT true;

-- 为现有数据设置is_latest为true
UPDATE schedule_results 
SET is_latest = true 
WHERE is_latest IS NULL;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_schedule_results_is_latest 
ON schedule_results(tenant_id, store_id, operation_date, is_latest);
