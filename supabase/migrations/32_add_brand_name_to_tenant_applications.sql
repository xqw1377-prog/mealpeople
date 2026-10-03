/*
# 添加品牌名称字段到租户申请表

## 问题描述
超级管理员批准租户申请时失败，因为代码中尝试访问 `application.brand_name` 字段，
但 tenant_applications 表中没有这个字段。

## 问题原因
- TypeScript 类型定义中有 brand_name 字段
- 但数据库表结构中缺少这个字段
- 导致批准申请时尝试读取不存在的字段

## 解决方案
在 tenant_applications 表中添加 brand_name 字段。

## 变更内容
1. 添加 brand_name 字段（text类型，可为空）
2. 如果为空，使用 tenant_name 作为默认值

## 影响范围
- tenant_applications 表
- 批准租户申请功能
*/

-- 添加 brand_name 字段
ALTER TABLE tenant_applications 
ADD COLUMN IF NOT EXISTS brand_name TEXT;

-- 为现有记录设置默认值（使用 tenant_name）
UPDATE tenant_applications 
SET brand_name = tenant_name 
WHERE brand_name IS NULL;
