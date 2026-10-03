/*
# 临时禁用work_shifts表的RLS（用于调试）

## 警告
这是一个临时的调试措施，会暂时禁用RLS安全策略。
仅用于诊断问题，确认问题后需要重新启用RLS。

## 操作
1. 禁用RLS
2. 测试创建工作班次
3. 如果成功，说明是RLS策略问题
4. 如果失败，说明是其他问题（如字段约束、数据类型等）

*/

-- 临时禁用RLS
ALTER TABLE work_shifts DISABLE ROW LEVEL SECURITY;

-- 添加注释说明这是临时措施
COMMENT ON TABLE work_shifts IS '班次配置表（RLS已临时禁用用于调试）';
