/*
# 添加员工部门字段

## 说明
为employees表添加department字段，用于区分员工所属部门（前厅/后厨）

## 变更内容
1. 创建department枚举类型
2. 添加department字段到employees表
3. 设置默认值为'front_hall'

## 字段说明
- department: 部门类型
  - front_hall: 前厅
  - kitchen: 后厨
*/

-- 创建部门枚举类型
CREATE TYPE department_type AS ENUM ('front_hall', 'kitchen');

-- 添加department字段
ALTER TABLE employees 
ADD COLUMN department department_type DEFAULT 'front_hall'::department_type NOT NULL;

-- 添加注释
COMMENT ON COLUMN employees.department IS '员工部门：front_hall=前厅, kitchen=后厨';
