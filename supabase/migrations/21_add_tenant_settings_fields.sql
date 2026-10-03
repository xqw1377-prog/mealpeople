/*
# 添加租户设置字段并初始化现有租户数据

## 1. 问题描述
新账户在排班规划页面缺少必要的租户设置，导致无法正常使用排班功能。

## 2. 解决方案
- 为 tenant_settings 表添加缺失的字段
- 为所有现有租户自动创建默认配置

## 3. 新增字段

### tenant_settings 表
- `default_monthly_work_days` (DECIMAL) - 默认每月工作天数，默认26天
- `default_part_time_hourly_rate` (DECIMAL) - 默认兼职时薪，默认20元/小时
- `cost_warning_threshold` (DECIMAL) - 成本预警阈值，默认0.35（35%）
- `efficiency_warning_threshold` (DECIMAL) - 效率预警阈值，默认0.8

## 4. 数据初始化
为所有没有 tenant_settings 记录的租户自动创建默认配置。

## 5. 安全性
- 保持现有的 RLS 策略不变
- 不影响现有数据

*/

-- 1. 添加新字段到 tenant_settings 表
ALTER TABLE tenant_settings 
ADD COLUMN IF NOT EXISTS default_monthly_work_days DECIMAL(4,2) DEFAULT 26.00 NOT NULL;

ALTER TABLE tenant_settings 
ADD COLUMN IF NOT EXISTS default_part_time_hourly_rate DECIMAL(6,2) DEFAULT 20.00 NOT NULL;

ALTER TABLE tenant_settings 
ADD COLUMN IF NOT EXISTS cost_warning_threshold DECIMAL(4,2) DEFAULT 0.35 NOT NULL;

ALTER TABLE tenant_settings 
ADD COLUMN IF NOT EXISTS efficiency_warning_threshold DECIMAL(4,2) DEFAULT 0.80 NOT NULL;

-- 2. 添加字段注释
COMMENT ON COLUMN tenant_settings.default_monthly_work_days IS '默认每月工作天数，用于计算日薪';
COMMENT ON COLUMN tenant_settings.default_part_time_hourly_rate IS '默认兼职时薪（元/小时）';
COMMENT ON COLUMN tenant_settings.cost_warning_threshold IS '成本预警阈值（如0.35表示35%）';
COMMENT ON COLUMN tenant_settings.efficiency_warning_threshold IS '效率预警阈值（如0.8表示80%）';

-- 3. 为所有没有 tenant_settings 的租户创建默认配置
INSERT INTO tenant_settings (
    tenant_id,
    default_daily_work_hours,
    default_monthly_work_days,
    default_part_time_hourly_rate,
    cost_warning_threshold,
    efficiency_warning_threshold
)
SELECT 
    t.id,
    8.00,
    26.00,
    20.00,
    0.35,
    0.80
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_settings ts WHERE ts.tenant_id = t.id
);

-- 4. 验证数据
DO $$
DECLARE
    tenant_count INTEGER;
    settings_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO tenant_count FROM tenants;
    SELECT COUNT(*) INTO settings_count FROM tenant_settings;
    
    RAISE NOTICE '租户总数: %', tenant_count;
    RAISE NOTICE '租户设置总数: %', settings_count;
    
    IF tenant_count = settings_count THEN
        RAISE NOTICE '✅ 所有租户都有配置';
    ELSE
        RAISE WARNING '⚠️ 有 % 个租户缺少配置', tenant_count - settings_count;
    END IF;
END $$;
