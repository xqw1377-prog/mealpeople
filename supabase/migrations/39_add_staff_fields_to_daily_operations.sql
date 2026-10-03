/*
# 为daily_operations表添加人员相关字段

## 修改说明
为daily_operations表添加排休人数和实际上岗人数字段，用于营业调整和营业复盘

## 修改内容
1. 添加planned_staff_count（计划上岗人数）
2. 添加planned_rest_count（计划排休人数）
3. 添加adjusted_staff_count（调整后上岗人数）
4. 添加adjusted_rest_count（调整后排休人数）
5. 添加actual_staff_count（实际上岗人数）
6. 添加actual_rest_count（实际排休人数）

## 数据流程
- 排班规划：planned_staff_count, planned_rest_count
- 营业调整：adjusted_staff_count, adjusted_rest_count
- 营业复盘：actual_staff_count, actual_rest_count

## 影响范围
- daily_operations表添加6个字段
- 支持小数人数（DECIMAL类型）
*/

-- 添加排班规划阶段的人员字段
ALTER TABLE daily_operations 
ADD COLUMN IF NOT EXISTS planned_staff_count DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS planned_rest_count DECIMAL(10,2);

-- 添加营业调整阶段的人员字段
ALTER TABLE daily_operations 
ADD COLUMN IF NOT EXISTS adjusted_staff_count DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS adjusted_rest_count DECIMAL(10,2);

-- 添加营业复盘阶段的人员字段
ALTER TABLE daily_operations 
ADD COLUMN IF NOT EXISTS actual_staff_count DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS actual_rest_count DECIMAL(10,2);

-- 添加字段注释
COMMENT ON COLUMN daily_operations.planned_staff_count IS '计划上岗人数（排班规划阶段）';
COMMENT ON COLUMN daily_operations.planned_rest_count IS '计划排休人数（排班规划阶段）';
COMMENT ON COLUMN daily_operations.adjusted_staff_count IS '调整后上岗人数（营业调整阶段）';
COMMENT ON COLUMN daily_operations.adjusted_rest_count IS '调整后排休人数（营业调整阶段）';
COMMENT ON COLUMN daily_operations.actual_staff_count IS '实际上岗人数（营业复盘阶段）';
COMMENT ON COLUMN daily_operations.actual_rest_count IS '实际排休人数（营业复盘阶段）';
