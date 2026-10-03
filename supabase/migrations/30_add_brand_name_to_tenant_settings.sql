/*
# 为租户配置表添加品牌名称字段

## 1. 表结构变更
- 为 `tenant_settings` 表添加 `brand_name` 字段
  - `brand_name` (TEXT): 品牌名称

## 2. 字段说明
- `brand_name`: 品牌名称，在租户申请审核通过时自动填充

*/

-- 添加品牌名称字段
ALTER TABLE tenant_settings 
ADD COLUMN IF NOT EXISTS brand_name TEXT;

-- 添加注释
COMMENT ON COLUMN tenant_settings.brand_name IS '品牌名称，从租户申请中自动填充';
