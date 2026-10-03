/*
# 添加员工部门ID字段

## 说明
为employees表添加department_id字段，关联到departments表

## 变更内容
1. 添加department_id字段到employees表
2. 创建外键约束
3. 创建索引

## 字段说明
- department_id: 部门ID（关联departments表）
*/

-- 添加department_id字段
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE SET NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);

-- 添加注释
COMMENT ON COLUMN employees.department_id IS '部门ID（关联departments表）';