# 餐时间工作旅程系统 - API文档

## 📖 目录

1. [API概述](#api概述)
2. [认证授权](#认证授权)
3. [租户管理API](#租户管理api)
4. [员工管理API](#员工管理api)
5. [排班管理API](#排班管理api)
6. [请假管理API](#请假管理api)
7. [加班管理API](#加班管理api)
8. [数据分析API](#数据分析api)
9. [错误处理](#错误处理)

---

## API概述

### 基础信息

- **Base URL**: `https://your-project.supabase.co`
- **API版本**: v1
- **数据格式**: JSON
- **字符编码**: UTF-8

### 通用响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误信息"
  }
}
```

---

## 认证授权

### 登录

**接口**: `POST /auth/v1/token`

**请求参数**:
```json
{
  "phone": "13800138000",
  "password": "123456"
}
```

**响应示例**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "..."
}
```

### 刷新Token

**接口**: `POST /auth/v1/token?grant_type=refresh_token`

**请求参数**:
```json
{
  "refresh_token": "..."
}
```

### 登出

**接口**: `POST /auth/v1/logout`

**请求头**:
```
Authorization: Bearer {access_token}
```

---

## 租户管理API

### 1. 获取租户列表

**接口**: `GET /rest/v1/tenants`

**请求头**:
```
Authorization: Bearer {access_token}
apikey: {anon_key}
```

**查询参数**:
- `select`: 选择字段（默认：*）
- `order`: 排序字段（默认：created_at.desc）
- `limit`: 返回数量（默认：10）
- `offset`: 偏移量（默认：0）

**响应示例**:
```json
[
  {
    "id": "uuid",
    "name": "海底捞火锅",
    "contact_phone": "13800138000",
    "contact_email": "contact@haidilao.com",
    "status": "active",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### 2. 创建租户

**接口**: `POST /rest/v1/tenants`

**请求头**:
```
Authorization: Bearer {access_token}
apikey: {anon_key}
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "海底捞火锅",
  "contact_phone": "13800138000",
  "contact_email": "contact@haidilao.com"
}
```

**响应示例**:
```json
{
  "id": "uuid",
  "name": "海底捞火锅",
  "contact_phone": "13800138000",
  "contact_email": "contact@haidilao.com",
  "status": "active",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### 3. 更新租户

**接口**: `PATCH /rest/v1/tenants?id=eq.{tenant_id}`

**请求体**:
```json
{
  "name": "海底捞火锅（更新）",
  "contact_phone": "13900139000"
}
```

### 4. 删除租户

**接口**: `DELETE /rest/v1/tenants?id=eq.{tenant_id}`

---

## 员工管理API

### 1. 获取员工列表

**接口**: `GET /rest/v1/employees`

**查询参数**:
- `tenant_id`: 租户ID（必填）
- `store_id`: 门店ID（可选）
- `status`: 员工状态（可选：active/inactive）
- `select`: 选择字段
- `order`: 排序字段
- `limit`: 返回数量
- `offset`: 偏移量

**响应示例**:
```json
[
  {
    "id": "uuid",
    "tenant_id": "uuid",
    "store_id": "uuid",
    "name": "张三",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "position": "服务员",
    "status": "active",
    "hire_date": "2025-01-01",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### 2. 创建员工

**接口**: `POST /rest/v1/employees`

**请求体**:
```json
{
  "tenant_id": "uuid",
  "store_id": "uuid",
  "name": "张三",
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "position": "服务员",
  "hire_date": "2025-01-01"
}
```

### 3. 更新员工

**接口**: `PATCH /rest/v1/employees?id=eq.{employee_id}`

**请求体**:
```json
{
  "position": "领班",
  "status": "active"
}
```

### 4. 删除员工

**接口**: `DELETE /rest/v1/employees?id=eq.{employee_id}`

### 5. 批量导入员工

**接口**: `POST /rest/v1/rpc/import_employees`

**请求体**:
```json
{
  "tenant_id": "uuid",
  "employees": [
    {
      "name": "张三",
      "phone": "13800138000",
      "store_name": "朝阳店",
      "employee_type": "正式"
    }
  ]
}
```

---

## 排班管理API

### 1. 获取排班列表

**接口**: `GET /rest/v1/schedules`

**查询参数**:
- `tenant_id`: 租户ID（必填）
- `store_id`: 门店ID（可选）
- `employee_id`: 员工ID（可选）
- `date`: 日期（可选，格式：YYYY-MM-DD）
- `start_date`: 开始日期（可选）
- `end_date`: 结束日期（可选）

**响应示例**:
```json
[
  {
    "id": "uuid",
    "tenant_id": "uuid",
    "store_id": "uuid",
    "employee_id": "uuid",
    "date": "2025-01-01",
    "shift_type": "早班",
    "start_time": "08:00",
    "end_time": "16:00",
    "notes": "正常排班",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### 2. 创建排班

**接口**: `POST /rest/v1/schedules`

**请求体**:
```json
{
  "tenant_id": "uuid",
  "store_id": "uuid",
  "employee_id": "uuid",
  "date": "2025-01-01",
  "shift_type": "早班",
  "start_time": "08:00",
  "end_time": "16:00"
}
```

### 3. 智能排班计算

**接口**: `POST /rest/v1/rpc/calculate_schedule`

**请求体**:
```json
{
  "tenant_id": "uuid",
  "store_id": "uuid",
  "target_revenue": 50000,
  "target_date": "2025-01-01"
}
```

**响应示例**:
```json
{
  "required_employees": 15,
  "estimated_cost": 12000,
  "cost_ratio": 24,
  "efficiency": 3333,
  "feasibility": "可行",
  "warnings": [],
  "suggestions": [
    "建议增加1名兼职员工以提高灵活性"
  ]
}
```

### 4. 换班申请

**接口**: `POST /rest/v1/shift_swap_requests`

**请求体**:
```json
{
  "tenant_id": "uuid",
  "requester_id": "uuid",
  "target_employee_id": "uuid",
  "original_schedule_id": "uuid",
  "target_schedule_id": "uuid",
  "reason": "个人原因"
}
```

---

## 请假管理API

### 1. 获取请假申请列表

**接口**: `GET /rest/v1/leave_requests`

**查询参数**:
- `tenant_id`: 租户ID（必填）
- `employee_id`: 员工ID（可选）
- `status`: 状态（可选：pending/approved/rejected/cancelled）
- `start_date`: 开始日期（可选）
- `end_date`: 结束日期（可选）

**响应示例**:
```json
[
  {
    "id": "uuid",
    "tenant_id": "uuid",
    "employee_id": "uuid",
    "leave_type_id": "uuid",
    "start_date": "2025-01-01",
    "end_date": "2025-01-03",
    "days": 3,
    "reason": "家庭原因",
    "status": "pending",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### 2. 创建请假申请

**接口**: `POST /rest/v1/leave_requests`

**请求体**:
```json
{
  "tenant_id": "uuid",
  "employee_id": "uuid",
  "leave_type_id": "uuid",
  "start_date": "2025-01-01",
  "end_date": "2025-01-03",
  "reason": "家庭原因"
}
```

### 3. 审批请假申请

**接口**: `PATCH /rest/v1/leave_requests?id=eq.{request_id}`

**请求体**:
```json
{
  "status": "approved",
  "reviewer_comment": "同意请假"
}
```

### 4. 检查请假冲突

**接口**: `POST /rest/v1/rpc/check_leave_conflict`

**请求体**:
```json
{
  "employee_id": "uuid",
  "start_date": "2025-01-01",
  "end_date": "2025-01-03"
}
```

**响应示例**:
```json
{
  "has_conflict": false,
  "message": "无冲突"
}
```

### 5. 获取假期余额

**接口**: `GET /rest/v1/leave_balances`

**查询参数**:
- `employee_id`: 员工ID（必填）
- `year`: 年份（可选，默认当前年份）

**响应示例**:
```json
[
  {
    "id": "uuid",
    "employee_id": "uuid",
    "leave_type_id": "uuid",
    "year": 2025,
    "total_days": 10,
    "used_days": 3,
    "remaining_days": 7
  }
]
```

---

## 加班管理API

### 1. 获取加班申请列表

**接口**: `GET /rest/v1/overtime_requests`

**查询参数**:
- `tenant_id`: 租户ID（必填）
- `employee_id`: 员工ID（可选）
- `status`: 状态（可选）
- `start_date`: 开始日期（可选）
- `end_date`: 结束日期（可选）

**响应示例**:
```json
[
  {
    "id": "uuid",
    "tenant_id": "uuid",
    "employee_id": "uuid",
    "overtime_type_id": "uuid",
    "overtime_date": "2025-01-01",
    "start_time": "18:00",
    "end_time": "22:00",
    "hours": 4,
    "reason": "项目赶工",
    "status": "pending",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### 2. 创建加班申请

**接口**: `POST /rest/v1/overtime_requests`

**请求体**:
```json
{
  "tenant_id": "uuid",
  "employee_id": "uuid",
  "overtime_type_id": "uuid",
  "overtime_date": "2025-01-01",
  "start_time": "18:00",
  "end_time": "22:00",
  "reason": "项目赶工"
}
```

### 3. 审批加班申请

**接口**: `PATCH /rest/v1/overtime_requests?id=eq.{request_id}`

**请求体**:
```json
{
  "status": "approved",
  "reviewer_comment": "同意加班"
}
```

---

## 数据分析API

### 1. 获取运营仪表盘数据

**接口**: `POST /rest/v1/rpc/get_dashboard_data`

**请求体**:
```json
{
  "tenant_id": "uuid",
  "store_id": "uuid",
  "date": "2025-01-01"
}
```

**响应示例**:
```json
{
  "today": {
    "revenue": 50000,
    "employees": 15,
    "efficiency": 3333,
    "cost": 12000,
    "cost_ratio": 24
  },
  "month": {
    "total_revenue": 1500000,
    "total_employees": 450,
    "avg_efficiency": 3333,
    "total_cost": 360000,
    "avg_cost_ratio": 24
  },
  "evaluation": {
    "cost_ratio_level": "优秀",
    "efficiency_level": "优秀",
    "contribution_level": "优秀"
  }
}
```

### 2. 获取成本分析数据

**接口**: `POST /rest/v1/rpc/get_cost_analysis`

**请求体**:
```json
{
  "tenant_id": "uuid",
  "store_id": "uuid",
  "start_date": "2025-01-01",
  "end_date": "2025-01-31"
}
```

**响应示例**:
```json
{
  "total_revenue": 1500000,
  "total_cost": 360000,
  "avg_cost_ratio": 24,
  "avg_efficiency": 3333,
  "employee_stats": {
    "total": 50,
    "regular": 45,
    "part_time": 5
  },
  "trend": [
    {
      "date": "2025-01-01",
      "revenue": 50000,
      "cost": 12000,
      "ratio": 24
    }
  ]
}
```

### 3. 获取趋势预测数据

**接口**: `POST /rest/v1/rpc/get_trend_forecast`

**请求体**:
```json
{
  "tenant_id": "uuid",
  "store_id": "uuid",
  "forecast_days": 7
}
```

**响应示例**:
```json
{
  "revenue_forecast": [
    {
      "date": "2025-01-08",
      "predicted_revenue": 52000,
      "confidence": 0.85
    }
  ],
  "cost_forecast": [
    {
      "date": "2025-01-08",
      "predicted_cost": 12500,
      "confidence": 0.85
    }
  ]
}
```

---

## 错误处理

### 错误代码

| 错误代码 | 说明 | HTTP状态码 |
|---------|------|-----------|
| AUTH_001 | 未授权访问 | 401 |
| AUTH_002 | Token已过期 | 401 |
| AUTH_003 | Token无效 | 401 |
| PERM_001 | 权限不足 | 403 |
| DATA_001 | 数据不存在 | 404 |
| DATA_002 | 数据已存在 | 409 |
| VALID_001 | 参数验证失败 | 400 |
| VALID_002 | 必填参数缺失 | 400 |
| BIZ_001 | 业务逻辑错误 | 400 |
| SYS_001 | 系统内部错误 | 500 |

### 错误响应示例

```json
{
  "success": false,
  "error": {
    "code": "VALID_001",
    "message": "参数验证失败：手机号格式不正确",
    "details": {
      "field": "phone",
      "value": "123",
      "constraint": "必须是11位手机号"
    }
  }
}
```

---

## 最佳实践

### 1. 认证处理

```typescript
// 设置请求头
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'apikey': anonKey,
  'Content-Type': 'application/json'
}

// 处理Token过期
if (error.code === 'AUTH_002') {
  // 刷新Token
  const newToken = await refreshToken()
  // 重试请求
  return retryRequest(newToken)
}
```

### 2. 错误处理

```typescript
try {
  const response = await fetch(url, options)
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error.message)
  }
  
  return data
} catch (error) {
  console.error('API请求失败:', error)
  // 显示用户友好的错误提示
  showErrorToast(error.message)
}
```

### 3. 分页处理

```typescript
// 使用limit和offset进行分页
const pageSize = 20
const page = 1
const offset = (page - 1) * pageSize

const url = `/rest/v1/employees?limit=${pageSize}&offset=${offset}`
```

### 4. 数据过滤

```typescript
// 使用Supabase查询语法
const url = `/rest/v1/employees?tenant_id=eq.${tenantId}&status=eq.active&order=created_at.desc`
```

---

## 联系支持

如果您在使用API时遇到问题，请联系技术支持：

- 📧 邮箱：api-support@canshijian.com
- 📱 电话：400-xxx-xxxx
- 💬 在线客服：工作日 9:00-18:00

---

**餐时间工作旅程系统** - 专业的API服务 🚀
