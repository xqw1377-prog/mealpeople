/*
# 为排班结果表添加调整历史字段

## 1. 新增字段说明

### schedule_results 表新增字段
- `adjustment_type` (text): 调整类型，可选值：'首次规划'、'重新规划'
- `adjustment_reason` (text): 调整原因（可选）
- `previous_result_id` (uuid): 上一次排班结果ID，用于追溯历史
- `adjustment_details` (jsonb): 调整详情，记录变更内容
- `adjusted_by` (uuid): 调整人ID

## 2. 数据结构

adjustment_details 的 JSON 结构：
```json
{
  "revenue": {
    "old": 50000,
    "new": 55000
  },
  "staffCount": {
    "old": 20,
    "new": 22
  },
  "restStaff": {
    "old": 2,
    "new": 2.5
  },
  "tempWorkers": {
    "old": 0,
    "new": 1
  }
}
```

## 3. 注意事项
- 首次规划时，adjustment_type = '首次规划'，adjustment_details 为 null
- 重新规划时，adjustment_type = '重新规划'，记录完整的变更信息
- previous_result_id 指向同一天的上一次排班结果
*/

-- 添加调整历史相关字段
ALTER TABLE schedule_results 
ADD COLUMN IF NOT EXISTS adjustment_type text DEFAULT '首次规划',
ADD COLUMN IF NOT EXISTS adjustment_reason text,
ADD COLUMN IF NOT EXISTS previous_result_id uuid,
ADD COLUMN IF NOT EXISTS adjustment_details jsonb,
ADD COLUMN IF NOT EXISTS adjusted_by uuid;

-- 添加外键约束
ALTER TABLE schedule_results
ADD CONSTRAINT fk_previous_result 
FOREIGN KEY (previous_result_id) 
REFERENCES schedule_results(id) 
ON DELETE SET NULL;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_schedule_results_previous_result 
ON schedule_results(previous_result_id);

CREATE INDEX IF NOT EXISTS idx_schedule_results_adjustment_type 
ON schedule_results(adjustment_type);

-- 更新现有数据，将所有现有记录标记为首次规划
UPDATE schedule_results 
SET adjustment_type = '首次规划' 
WHERE adjustment_type IS NULL;
