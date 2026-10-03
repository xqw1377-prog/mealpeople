/*
# 为门店表添加brand_id字段

## 1. 变更说明
为stores表添加brand_id字段，实现品牌-门店的关联关系。

## 2. 变更内容
- 添加brand_id字段（外键关联brands表）
- 创建索引提升查询性能
- 数据迁移：将现有门店关联到租户的默认品牌

## 3. 数据迁移策略
- 为每个门店找到其租户的第一个品牌
- 将门店的brand_id设置为该品牌ID
- 保留tenant_id字段以保持向后兼容

## 4. 注意事项
- brand_id暂时允许为NULL，以支持平滑迁移
- 后续可以将brand_id设置为NOT NULL
- 保持原有的RLS策略不变
*/

-- 添加brand_id字段
ALTER TABLE stores ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_stores_brand ON stores(brand_id);

-- 数据迁移：将现有门店关联到租户的第一个品牌
UPDATE stores s
SET brand_id = (
  SELECT b.id
  FROM brands b
  WHERE b.tenant_id = s.tenant_id
  ORDER BY b.created_at ASC
  LIMIT 1
)
WHERE s.brand_id IS NULL;
