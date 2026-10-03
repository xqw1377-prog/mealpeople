/*
# 为员工表添加薪酬和工时字段

## 需求说明
员工管理功能需要记录员工的月薪和每日工作小时数，用于计算人力成本。

## 变更内容

### 1. 员工表（employees）
- 添加 monthly_salary（月薪）字段，用于计算人力成本
- 添加 daily_work_hours（每日工作小时数）字段，默认8小时，仅正式工使用

## 字段说明
- monthly_salary: DECIMAL(10,2) - 月薪（元），可为空，正式工必填
- daily_work_hours: DECIMAL(4,2) - 每日工作小时数，默认8.00小时
*/

-- ============================================
-- 1. 添加薪酬和工时字段
-- ============================================

-- 添加月薪字段
ALTER TABLE employees ADD COLUMN IF NOT EXISTS monthly_salary DECIMAL(10,2);

-- 添加每日工作小时数字段，默认8小时
ALTER TABLE employees ADD COLUMN IF NOT EXISTS daily_work_hours DECIMAL(4,2) DEFAULT 8.00;

-- 添加字段注释
COMMENT ON COLUMN employees.monthly_salary IS '月薪（元），用于计算人力成本，正式工必填';
COMMENT ON COLUMN employees.daily_work_hours IS '每日工作小时数，默认8小时，仅正式工使用';

-- ============================================
-- 2. 创建索引以优化查询性能
-- ============================================

-- 为薪酬字段创建索引，方便按薪酬范围查询
CREATE INDEX IF NOT EXISTS idx_employees_monthly_salary ON employees(monthly_salary) WHERE monthly_salary IS NOT NULL;

-- 为员工类型和薪酬组合创建索引
CREATE INDEX IF NOT EXISTS idx_employees_type_salary ON employees(employee_type, monthly_salary);
