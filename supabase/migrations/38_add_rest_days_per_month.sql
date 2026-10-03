/*
# 添加月公休天数字段

## 修改说明
为employees表添加rest_days_per_month字段，用于计算日薪

## 修改内容
1. 添加rest_days_per_month字段（月公休天数）
2. 默认值为4天（符合劳动法规定）

## 计算公式
日薪 = 月薪总额 / (月总天数 - 月公休天数)
例如：月薪6000元，月公休4天
日薪 = 6000 / (30 - 4) = 6000 / 26 = 230.77元

## 影响范围
- employees表添加rest_days_per_month字段
*/

-- 添加月公休天数字段
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS rest_days_per_month INTEGER DEFAULT 4;

-- 添加字段注释
COMMENT ON COLUMN employees.rest_days_per_month IS '月公休天数，默认4天，用于计算日薪';

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_employees_rest_days ON employees(rest_days_per_month);
