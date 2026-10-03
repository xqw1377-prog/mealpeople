/*
# 添加游客角色 - 第一部分

## 说明
PostgreSQL要求在添加枚举值后必须提交事务，才能在后续操作中使用新值。
因此将迁移分为两部分：
- Part 1: 添加枚举值
- Part 2: 使用新枚举值创建数据

## 执行顺序
1. 先执行 27_add_guest_role_part1.sql
2. 等待事务提交
3. 再执行 27_add_guest_role_part2.sql

*/

-- ============================================================================
-- 添加 guest 角色到 user_role 枚举类型
-- ============================================================================

-- 检查枚举值是否已存在，如果不存在则添加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'guest' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'guest';
    END IF;
END $$;

-- ============================================================================
-- 添加 is_demo 字段到 tenants 表
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_tenants_is_demo ON tenants(is_demo) WHERE is_demo = true;
COMMENT ON COLUMN tenants.is_demo IS '是否为测试餐厅';
