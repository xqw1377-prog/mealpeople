/*
# 添加排休天数字段到排班结果表

## 1. 修改内容
- 在 schedule_results 表中添加 rest_days 字段
- rest_days 表示排休总天数（例如：4小时=0.5天，8小时=1天）
- 默认值为 0

## 2. 字段说明
- rest_days (numeric): 排休总天数，支持小数（如0.5天）
- 计算规则：排休小时数 / 8 = 排休天数

## 3. 数据迁移
- 为现有记录设置默认值 0
*/

-- 添加 rest_days 字段
ALTER TABLE schedule_results 
ADD COLUMN IF NOT EXISTS rest_days numeric DEFAULT 0 CHECK (rest_days >= 0);

-- 为现有记录设置默认值
UPDATE schedule_results 
SET rest_days = 0 
WHERE rest_days IS NULL;

-- 添加注释
COMMENT ON COLUMN schedule_results.rest_days IS '排休总天数（例如：4小时=0.5天，8小时=1天）';
