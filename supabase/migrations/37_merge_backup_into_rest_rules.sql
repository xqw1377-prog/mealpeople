/*
# 将顶岗原则融合到排休规则

## 变更说明
将核心岗位顶岗配置功能融合到排休规则配置中，实现统一管理。

## 表结构变更
1. 在 rest_day_rules 表中添加顶岗相关字段：
   - backup_rules: 顶岗规则配置（JSON格式）
   - enable_backup_check: 是否启用顶岗检查

## 顶岗规则数据结构
backup_rules 字段存储JSON数组，每个元素包含：
- core_employee_id: 核心岗位员工ID
- core_position: 核心岗位名称
- backup_employee_ids: 顶岗人员ID列表
- no_same_day_off: 是否禁止同休（true表示核心岗位与顶岗人员不可同休）

## 安全策略
- 保持现有RLS策略不变
*/

-- 添加顶岗相关字段到 rest_day_rules 表
ALTER TABLE rest_day_rules 
ADD COLUMN IF NOT EXISTS backup_rules jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS enable_backup_check boolean DEFAULT false;

-- 添加注释
COMMENT ON COLUMN rest_day_rules.backup_rules IS '顶岗规则配置，JSON数组格式，包含核心岗位和顶岗人员的映射关系';
COMMENT ON COLUMN rest_day_rules.enable_backup_check IS '是否启用顶岗检查，true表示在排休时检查核心岗位与顶岗人员不可同休';

-- 迁移现有 core_position_backups 表的数据到 rest_day_rules（如果表存在）
DO $$
BEGIN
  -- 检查 core_position_backups 表是否存在
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'core_position_backups'
  ) THEN
    -- 为每个租户和门店创建或更新排休规则，添加顶岗配置
    -- 这里只是示例，实际迁移需要根据业务逻辑调整
    RAISE NOTICE '发现 core_position_backups 表，建议手动迁移数据';
  END IF;
END $$;
