/*
# 为租户申请表添加品牌名称字段

## 1. 表结构变更
- 为 `tenant_applications` 表添加 `brand_name` 字段
  - `brand_name` (TEXT, NOT NULL): 品牌名称

## 2. 字段说明
- `brand_name`: 品牌名称，在申请时必填
- 审核通过后，该品牌名称将自动填充到租户配置中

## 3. 数据迁移
- 为现有记录设置默认值（使用租户名称作为品牌名称）

*/

-- 添加品牌名称字段（先允许为空）
ALTER TABLE tenant_applications 
ADD COLUMN IF NOT EXISTS brand_name TEXT;

-- 为现有记录设置默认值（使用租户名称）
UPDATE tenant_applications 
SET brand_name = tenant_name 
WHERE brand_name IS NULL;

-- 设置字段为必填
ALTER TABLE tenant_applications 
ALTER COLUMN brand_name SET NOT NULL;

-- 添加注释
COMMENT ON COLUMN tenant_applications.brand_name IS '品牌名称，审核通过后自动填充到租户配置';
