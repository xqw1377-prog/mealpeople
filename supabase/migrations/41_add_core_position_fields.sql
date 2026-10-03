/*
# 添加核心岗位相关字段

## 说明
为 employees 表添加核心岗位管理相关字段，支持核心岗位标识和顶岗配置。
修复 TypeScript 类型定义与数据库表结构不一致的问题。

## 变更内容
1. 添加 is_core_position 字段 - 标识是否为核心岗位
2. 添加 position_fixed_backup 字段 - 标识岗位是否需要固定顶岗
3. 添加 can_backup_positions 字段 - 记录可以顶岗的岗位列表

## 字段说明
- is_core_position: BOOLEAN - 是否核心岗位，默认 false
- position_fixed_backup: BOOLEAN - 岗位是否需要固定顶岗，默认 false
- can_backup_positions: TEXT[] - 可以顶岗的岗位列表，默认空数组

## 使用场景
1. 核心岗位管理：标识店长、主厨等关键岗位
2. 排休规则：核心岗位可能有特殊的排休要求
3. 顶岗配置：记录员工可以顶岗的其他岗位
4. 排班优化：确保核心岗位始终有人值班
*/

-- ============================================
-- 1. 添加核心岗位相关字段
-- ============================================

-- 添加核心岗位标识字段
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS is_core_position BOOLEAN DEFAULT false NOT NULL;

-- 添加固定顶岗标识字段
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS position_fixed_backup BOOLEAN DEFAULT false NOT NULL;

-- 添加可顶岗岗位列表字段
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS can_backup_positions TEXT[] DEFAULT '{}';

-- ============================================
-- 2. 添加字段注释
-- ============================================

COMMENT ON COLUMN employees.is_core_position IS '是否核心岗位，核心岗位需要特殊排班处理';
COMMENT ON COLUMN employees.position_fixed_backup IS '岗位是否需要固定顶岗，需要时必须配置顶岗人员';
COMMENT ON COLUMN employees.can_backup_positions IS '可以顶岗的岗位列表，记录该员工可以顶岗的其他岗位名称';

-- ============================================
-- 3. 创建索引以优化查询
-- ============================================

-- 为核心岗位创建部分索引（只索引核心岗位）
CREATE INDEX IF NOT EXISTS idx_employees_is_core_position 
ON employees(is_core_position) 
WHERE is_core_position = true;

-- 为需要固定顶岗的岗位创建部分索引
CREATE INDEX IF NOT EXISTS idx_employees_position_fixed_backup 
ON employees(position_fixed_backup) 
WHERE position_fixed_backup = true;

-- 为可顶岗岗位列表创建 GIN 索引，支持数组查询
CREATE INDEX IF NOT EXISTS idx_employees_can_backup_positions 
ON employees USING GIN (can_backup_positions);

-- ============================================
-- 4. 为现有数据设置默认值（可选）
-- ============================================

-- 将常见的核心岗位标记为核心岗位
-- 注意：这是一个示例，实际应用中应该由管理员手动配置
UPDATE employees 
SET is_core_position = true 
WHERE position IN ('店长', '主厨', '经理', '厨师长', '副店长', '行政主厨')
AND is_core_position = false;

-- ============================================
-- 5. 添加数据验证约束（可选）
-- ============================================

-- 确保 can_backup_positions 数组中没有空字符串
ALTER TABLE employees 
ADD CONSTRAINT check_can_backup_positions_not_empty 
CHECK (
  can_backup_positions IS NULL OR 
  NOT ('' = ANY(can_backup_positions))
);
