/*
# 3.0版本开始标记

## 说明
这是3.0版本的开始标记。
如果需要回滚到2.0版本，只需要回滚到这个迁移之前的状态。

## 版本信息
- 版本号：3.0.0
- 开始时间：2025-11-06
- 基于版本：2.0.0

## 2.0版本功能清单
1. 登录系统
   - 手机验证码登录
   - 微信ID登录
   - 登录输入框优化

2. 多租户管理系统
   - 租户独立管理
   - 数据完全隔离
   - 租户切换功能

3. 品牌配置
   - 餐段配置（时间冲突检测）
   - 班次配置（时间冲突检测、跨天班次支持）
   - 表单验证增强

4. 权限管理系统
   - 功能模块树（30+模块）
   - 员工权限配置
   - 岗位权限模板
   - 展开/收起功能
   - 批量操作（全选/清空）

5. 员工管理
   - 员工信息管理
   - Excel导入
   - 兼职管理

6. 排班管理
   - 排班规划
   - 月度排班
   - 排班优化

7. 成本管控
   - 成本分析
   - 营收预测
   - 运营复盘

8. 数据分析
   - 综合数据分析
   - 营收明细
   - 数据导出

## 回滚说明
如果需要回滚到2.0版本：

### 方法1：使用Supabase CLI
```bash
# 回滚到32号迁移（2.0最后一个迁移）
supabase migration down --to 32
```

### 方法2：手动回滚
```sql
-- 1. 查看3.0版本添加的表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%v3%';

-- 2. 删除3.0版本的表（根据实际情况）
-- DROP TABLE IF EXISTS v3_table_name;

-- 3. 恢复2.0版本的表结构（如果有修改）
-- ALTER TABLE existing_table DROP COLUMN IF EXISTS v3_new_column;

-- 4. 记录回滚操作
INSERT INTO system_versions (version, description)
VALUES ('3.0.0-rollback', '从3.0版本回滚到2.0版本');
```

## 3.0版本开发规范
1. 所有新表名建议使用v3前缀（可选）
2. 所有迁移文件必须包含详细注释
3. 所有迁移文件必须包含回滚SQL
4. 修改现有表时必须保持向后兼容
5. 删除字段前必须确认无数据依赖

## 注意事项
1. 本迁移不会修改任何现有数据
2. 本迁移只是创建版本标记
3. 2.0版本的所有功能保持不变
4. 3.0版本的开发从下一个迁移文件开始
*/

-- 创建系统版本记录表（如果不存在）
CREATE TABLE IF NOT EXISTS system_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  description text,
  migration_number integer,
  applied_at timestamptz DEFAULT now(),
  applied_by text DEFAULT current_user,
  rollback_sql text,
  notes jsonb
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_system_versions_version ON system_versions(version);
CREATE INDEX IF NOT EXISTS idx_system_versions_applied_at ON system_versions(applied_at DESC);

-- 记录2.0版本完成
INSERT INTO system_versions (version, description, migration_number, notes)
VALUES (
  '2.0.0',
  '2.0版本稳定版本 - 所有基础功能完成',
  32,
  jsonb_build_object(
    'features', jsonb_build_array(
      '登录系统（手机验证码 + 微信ID）',
      '多租户管理系统',
      '品牌配置（餐段、班次配置，时间冲突检测）',
      '权限管理系统（展开/收起、批量操作）',
      '员工管理',
      '排班管理',
      '成本管控',
      '数据分析'
    ),
    'fixes', jsonb_build_array(
      '修复登录输入框显示问题',
      '修复品牌配置表单弹窗层级',
      '创建功能模块表和权限系统',
      '添加时间冲突检测',
      '添加权限树展开/收起功能'
    ),
    'database_tables', jsonb_build_array(
      'tenants',
      'employees',
      'function_modules',
      'employee_permissions',
      'position_templates',
      'meal_periods',
      'work_shifts'
    )
  )
);

-- 记录3.0版本开始
INSERT INTO system_versions (version, description, migration_number, notes)
VALUES (
  '3.0.0-start',
  '3.0版本开发开始，基于2.0.0稳定版本',
  33,
  jsonb_build_object(
    'base_version', '2.0.0',
    'start_date', '2025-11-06',
    'status', 'development',
    'rollback_point', 32
  )
);

-- 创建版本快照视图（方便查询）
CREATE OR REPLACE VIEW v_version_history AS
SELECT 
  version,
  description,
  migration_number,
  applied_at,
  applied_by,
  notes->>'status' as status
FROM system_versions
ORDER BY applied_at DESC;

-- 授权查看版本历史
GRANT SELECT ON v_version_history TO authenticated;

-- 添加注释
COMMENT ON TABLE system_versions IS '系统版本记录表，用于跟踪版本变更和支持回滚';
COMMENT ON COLUMN system_versions.version IS '版本号，如：2.0.0, 3.0.0-start';
COMMENT ON COLUMN system_versions.description IS '版本描述';
COMMENT ON COLUMN system_versions.migration_number IS '对应的迁移文件编号';
COMMENT ON COLUMN system_versions.rollback_sql IS '回滚SQL（可选）';
COMMENT ON COLUMN system_versions.notes IS 'JSON格式的额外信息';
