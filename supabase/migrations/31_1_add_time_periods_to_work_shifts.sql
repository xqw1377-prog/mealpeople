/*
# 为work_shifts表添加time_periods字段

## 1. 修改内容
- 添加 `time_periods` (jsonb) 字段 - 支持多时间段配置

## 2. 说明
- time_periods字段用于存储多个时间段，格式为：[{"start": "06:00", "end": "09:00"}, {"start": "11:00", "end": "14:00"}]
- 该字段为可选字段，如果为空则使用start_time和end_time

*/

-- 添加time_periods字段
ALTER TABLE work_shifts 
ADD COLUMN IF NOT EXISTS time_periods JSONB;

-- 添加注释
COMMENT ON COLUMN work_shifts.time_periods IS '多时间段配置，JSON格式：[{"start": "06:00", "end": "09:00"}]';
