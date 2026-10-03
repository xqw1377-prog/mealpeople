/*
# 为排休记录表添加餐段和小时数字段

## 1. 表结构变更
- 为 `day_off_records` 表添加以下字段：
  - `meal_period` (TEXT): 餐段类型（all_day/breakfast/lunch/dinner）
  - `rest_hours` (NUMERIC): 排休小时数

## 2. 字段说明
- `meal_period`: 记录排休的餐段，默认为 'all_day'（全天）
  - all_day: 全天排休
  - breakfast: 早餐排休
  - lunch: 午餐排休
  - dinner: 晚餐排休
- `rest_hours`: 记录排休的小时数，用于精确计算工时

## 3. 数据迁移
- 为现有记录设置默认值：meal_period = 'all_day', rest_hours = 8

*/

-- 添加餐段字段
ALTER TABLE day_off_records 
ADD COLUMN IF NOT EXISTS meal_period TEXT DEFAULT 'all_day';

-- 添加排休小时数字段
ALTER TABLE day_off_records 
ADD COLUMN IF NOT EXISTS rest_hours NUMERIC(5,2) DEFAULT 8;

-- 为现有记录更新默认值
UPDATE day_off_records 
SET meal_period = 'all_day', rest_hours = 8 
WHERE meal_period IS NULL OR rest_hours IS NULL;

-- 添加注释
COMMENT ON COLUMN day_off_records.meal_period IS '排休餐段：all_day(全天)/breakfast(早餐)/lunch(午餐)/dinner(晚餐)';
COMMENT ON COLUMN day_off_records.rest_hours IS '排休小时数';
