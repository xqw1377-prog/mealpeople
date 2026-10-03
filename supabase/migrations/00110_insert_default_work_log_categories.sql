/*
# 插入默认工作记录类别

## 默认类别列表
1. 客户接待 - 蓝色 - i-mdi-account-group
2. 清洁卫生 - 绿色 - i-mdi-broom
3. 设备维护 - 橙色 - i-mdi-tools
4. 库存管理 - 紫色 - i-mdi-package-variant
5. 安全检查 - 红色 - i-mdi-shield-check
6. 培训学习 - 青色 - i-mdi-school
7. 会议记录 - 粉色 - i-mdi-calendar-text
8. 其他工作 - 灰色 - i-mdi-file-document

## 注意事项
- 为每个租户插入默认类别
- 使用ON CONFLICT避免重复插入
*/

-- 为所有现有租户插入默认类别
INSERT INTO work_log_categories (tenant_id, name, icon, color, sort_order, is_active)
SELECT 
  t.id as tenant_id,
  category.name,
  category.icon,
  category.color,
  category.sort_order,
  true as is_active
FROM tenants t
CROSS JOIN (
  VALUES 
    ('客户接待', 'i-mdi-account-group', 'blue', 1),
    ('清洁卫生', 'i-mdi-broom', 'green', 2),
    ('设备维护', 'i-mdi-tools', 'orange', 3),
    ('库存管理', 'i-mdi-package-variant', 'purple', 4),
    ('安全检查', 'i-mdi-shield-check', 'red', 5),
    ('培训学习', 'i-mdi-school', 'cyan', 6),
    ('会议记录', 'i-mdi-calendar-text', 'pink', 7),
    ('其他工作', 'i-mdi-file-document', 'gray', 8)
) AS category(name, icon, color, sort_order)
ON CONFLICT DO NOTHING;

-- 创建触发器：为新租户自动创建默认类别
CREATE OR REPLACE FUNCTION create_default_work_log_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO work_log_categories (tenant_id, name, icon, color, sort_order, is_active)
  VALUES 
    (NEW.id, '客户接待', 'i-mdi-account-group', 'blue', 1, true),
    (NEW.id, '清洁卫生', 'i-mdi-broom', 'green', 2, true),
    (NEW.id, '设备维护', 'i-mdi-tools', 'orange', 3, true),
    (NEW.id, '库存管理', 'i-mdi-package-variant', 'purple', 4, true),
    (NEW.id, '安全检查', 'i-mdi-shield-check', 'red', 5, true),
    (NEW.id, '培训学习', 'i-mdi-school', 'cyan', 6, true),
    (NEW.id, '会议记录', 'i-mdi-calendar-text', 'pink', 7, true),
    (NEW.id, '其他工作', 'i-mdi-file-document', 'gray', 8, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_default_work_log_categories ON tenants;
CREATE TRIGGER trigger_create_default_work_log_categories
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION create_default_work_log_categories();