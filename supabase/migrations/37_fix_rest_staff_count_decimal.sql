/*
# 修改排休人数字段为小数类型

## 修改说明
将schedule_results表的rest_staff_count字段从integer改为decimal(10,2)，支持小数人数（如0.5人表示半天排休）

## 修改内容
1. 修改rest_staff_count字段类型为DECIMAL(10,2)
2. 保留现有数据

## 影响范围
- schedule_results表的rest_staff_count字段

## 注意事项
- 现有整数数据会自动转换为小数格式（如2 -> 2.00）
- 支持最多2位小数
*/

-- 修改rest_staff_count字段类型为DECIMAL
ALTER TABLE schedule_results 
ALTER COLUMN rest_staff_count TYPE DECIMAL(10,2);
