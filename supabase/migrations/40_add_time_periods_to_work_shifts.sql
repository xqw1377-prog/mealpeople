/*
# 工作班次添加多时间段支持

## 1. 背景
- 当前班次只支持单个连续时间段（start_time, end_time）
- 实际业务需求：一个班次可能有多个不连续的时间段
- 例如：早班 = 6:00～9:00 + 16:00～21:00

## 2. 修改内容
- 添加 `time_periods` 字段（JSONB类型）
- 存储格式：[{"start": "06:00", "end": "09:00"}, {"start": "16:00", "end": "21:00"}]
- 保持 `start_time` 和 `end_time` 字段向后兼容
- 当 `time_periods` 为空时，使用 `start_time` 和 `end_time`
- 当 `time_periods` 不为空时，优先使用 `time_periods`

## 3. 兼容性
- 旧数据：time_periods 为 NULL，继续使用 start_time 和 end_time
- 新数据：可以选择使用单时间段或多时间段
- 前端需要判断 time_periods 是否存在来决定显示方式

*/

-- 添加多时间段字段
ALTER TABLE work_shifts 
ADD COLUMN IF NOT EXISTS time_periods JSONB DEFAULT NULL;

-- 添加注释
COMMENT ON COLUMN work_shifts.time_periods IS '多时间段配置，JSON数组格式：[{"start": "06:00", "end": "09:00"}, {"start": "16:00", "end": "21:00"}]。为空时使用start_time和end_time';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_work_shifts_time_periods ON work_shifts USING GIN (time_periods);
