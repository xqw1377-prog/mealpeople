/*
# 为员工表添加brand_id字段

## 1. 变更说明
为employees表添加brand_id字段，实现品牌-员工的关联关系。

## 2. 变更内容
- 添加brand_id字段（外键关联brands表）
- 创建索引提升查询性能
- 数据迁移：将现有员工关联到租户的默认品牌

## 3. 数据迁移策略
- 为每个员工找到其租户的第一个品牌
- 将员工的brand_id设置为该品牌ID
- 保留tenant_id字段以保持向后兼容
*/

-- 添加brand_id字段
ALTER TABLE employees ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_employees_brand ON employees(brand_id);

-- 数据迁移：将现有员工关联到租户的第一个品牌
UPDATE employees e
SET brand_id = (
  SELECT b.id
  FROM brands b
  WHERE b.tenant_id = e.tenant_id
  ORDER BY b.created_at ASC
  LIMIT 1
)
WHERE e.brand_id IS NULL;
