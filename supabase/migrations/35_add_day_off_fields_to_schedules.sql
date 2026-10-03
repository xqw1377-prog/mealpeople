/*
# 为schedules表添加排休相关字段

## 1. 背景
- 快速排休功能需要保存排休记录
- 排休也是一种工作安排（休息安排）
- 统一在schedules表中管理排班和排休，便于查询和统计

## 2. 表结构变更
为 `schedules` 表添加以下字段：
- `is_day_off` (BOOLEAN): 是否为排休记录，默认false
- `meal_period` (TEXT): 排休餐段（all_day/breakfast/lunch/dinner），仅排休时使用
- `rest_hours` (NUMERIC): 排休小时数，仅排休时使用

## 3. 字段说明
- `is_day_off`: 
  - true: 这是一条排休记录
  - false: 这是一条正常排班记录
- `meal_period`: 排休餐段
  - all_day: 全天排休（默认）
  - breakfast: 早餐排休
  - lunch: 午餐排休
  - dinner: 晚餐排休
- `rest_hours`: 排休小时数
  - 全天排休通常为8小时
  - 餐段排休根据实际情况设置（如午餐4小时）

## 4. 使用场景
### 正常排班记录
```sql
INSERT INTO schedules (tenant_id, store_id, employee_id, schedule_date, shift_type, start_time, end_time, is_day_off)
VALUES ('xxx', 'xxx', 'xxx', '2025-11-06', '早班', '08:00', '16:00', false);
```

### 全天排休记录
```sql
INSERT INTO schedules (tenant_id, store_id, employee_id, schedule_date, is_day_off, meal_period, rest_hours)
VALUES ('xxx', 'xxx', 'xxx', '2025-11-06', true, 'all_day', 8);
```

### 餐段排休记录
```sql
INSERT INTO schedules (tenant_id, store_id, employee_id, schedule_date, is_day_off, meal_period, rest_hours)
VALUES ('xxx', 'xxx', 'xxx', '2025-11-06', true, 'lunch', 4);
```

## 5. 查询示例
### 查询某天的排班（不包括排休）
```sql
SELECT * FROM schedules 
WHERE schedule_date = '2025-11-06' 
AND is_day_off = false;
```

### 查询某天的排休
```sql
SELECT * FROM schedules 
WHERE schedule_date = '2025-11-06' 
AND is_day_off = true;
```

### 查询某天的所有安排（排班+排休）
```sql
SELECT * FROM schedules 
WHERE schedule_date = '2025-11-06';
```

*/

-- 添加是否排休字段
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS is_day_off BOOLEAN DEFAULT false;

-- 添加排休餐段字段
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS meal_period TEXT DEFAULT 'all_day';

-- 添加排休小时数字段
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS rest_hours NUMERIC(5,2) DEFAULT 0;

-- 为现有记录设置默认值（都是排班记录，不是排休）
UPDATE schedules 
SET is_day_off = false, rest_hours = 0
WHERE is_day_off IS NULL;

-- 添加注释
COMMENT ON COLUMN schedules.is_day_off IS '是否为排休记录：true=排休，false=排班';
COMMENT ON COLUMN schedules.meal_period IS '排休餐段：all_day(全天)/breakfast(早餐)/lunch(午餐)/dinner(晚餐)';
COMMENT ON COLUMN schedules.rest_hours IS '排休小时数';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_schedules_day_off ON schedules(tenant_id, store_id, schedule_date, is_day_off);
