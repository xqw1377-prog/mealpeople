/*
# 为兼职班次表添加电话字段

## 变更说明
为part_time_shifts表添加phone字段，用于存储兼职员工的联系电话

## 变更内容
1. 添加phone字段（text类型，可选）
2. 添加索引以提高查询性能

## 影响范围
- part_time_shifts表结构变更
- 不影响现有数据
*/

-- 添加phone字段
ALTER TABLE part_time_shifts
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 添加注释
COMMENT ON COLUMN part_time_shifts.phone IS '兼职员工联系电话';

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_part_time_shifts_phone ON part_time_shifts(phone);
