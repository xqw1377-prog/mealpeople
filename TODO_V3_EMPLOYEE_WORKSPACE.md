# V3.0 员工工作台开发计划

## 📌 开发目标

设计和实现员工工作台，包括：
1. **每月休假申请**：在休假规则范围内申请
2. **特殊审批流程**：超过规则需要走审批
3. **排班结果查看**：查看个人排班安排

---

## 🎯 功能需求分析

### 1. 休假申请功能

#### 1.1 基础休假申请
- **申请入口**：员工工作台 → 休假申请
- **申请流程**：
  1. 选择休假日期
  2. 选择休假类型（年假、事假、病假等）
  3. 填写休假原因
  4. 系统自动检查是否在规则范围内
  5. 提交申请

#### 1.2 休假规则检查
- **规则来源**：休假规则配置表（rest_day_rules）
- **检查项目**：
  - 当月已休天数
  - 规则允许的最大天数
  - 是否超出规则范围
- **检查结果**：
  - 在规则内：直接批准
  - 超出规则：需要特殊审批

#### 1.3 特殊审批流程
- **触发条件**：申请天数超过规则允许的最大天数
- **审批流程**：
  1. 员工提交申请
  2. 系统标记为"待审批"
  3. 店长/管理员审批
  4. 审批通过/拒绝
  5. 通知员工结果

### 2. 排班结果查看

#### 2.1 个人排班日历
- **展示方式**：月历视图
- **展示内容**：
  - 工作日：显示班次信息（时间、岗位）
  - 休息日：显示"休"标识
  - 请假日：显示"假"标识
- **交互功能**：
  - 点击日期查看详细信息
  - 切换月份查看历史/未来排班

#### 2.2 排班详情
- **详细信息**：
  - 日期
  - 班次名称
  - 工作时间
  - 工作岗位
  - 餐段信息
  - 预计工时
  - 预计薪酬

### 3. 工作台首页

#### 3.1 快速入口
- 休假申请
- 我的排班
- 我的请假记录
- 待办事项

#### 3.2 数据统计
- 本月工作天数
- 本月休假天数
- 本月累计工时
- 本月预计薪酬

---

## 🗄️ 数据库设计

### 1. 休假申请表（leave_requests）

```sql
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  
  -- 申请信息
  leave_type TEXT NOT NULL, -- 'annual_leave', 'sick_leave', 'personal_leave', 'other'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days DECIMAL(10,2) NOT NULL, -- 请假天数（支持半天）
  reason TEXT,
  
  -- 规则检查
  within_rules BOOLEAN NOT NULL DEFAULT false, -- 是否在规则范围内
  rule_id UUID REFERENCES rest_day_rules(id), -- 关联的休假规则
  current_month_days DECIMAL(10,2), -- 当月已休天数
  rule_max_days DECIMAL(10,2), -- 规则允许的最大天数
  
  -- 审批信息
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  approver_id UUID REFERENCES employees(id),
  approval_comment TEXT,
  approved_at TIMESTAMPTZ,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_leave_requests_tenant ON leave_requests(tenant_id);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- RLS策略
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- 员工可以查看和创建自己的请假申请
CREATE POLICY "员工可以查看自己的请假申请" ON leave_requests
  FOR SELECT USING (
    employee_id = auth.uid() OR
    is_admin(auth.uid())
  );

CREATE POLICY "员工可以创建请假申请" ON leave_requests
  FOR INSERT WITH CHECK (
    employee_id = auth.uid()
  );

CREATE POLICY "员工可以取消自己的待审批申请" ON leave_requests
  FOR UPDATE USING (
    employee_id = auth.uid() AND status = 'pending'
  );

-- 管理员可以审批请假申请
CREATE POLICY "管理员可以审批请假申请" ON leave_requests
  FOR UPDATE USING (
    is_admin(auth.uid())
  );
```

### 2. 审批记录表（approval_logs）

```sql
CREATE TABLE approval_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- 关联信息
  request_type TEXT NOT NULL, -- 'leave_request', 'schedule_change', etc.
  request_id UUID NOT NULL, -- 关联的申请ID
  
  -- 审批信息
  approver_id UUID NOT NULL REFERENCES employees(id),
  action TEXT NOT NULL, -- 'approved', 'rejected'
  comment TEXT,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_approval_logs_tenant ON approval_logs(tenant_id);
CREATE INDEX idx_approval_logs_request ON approval_logs(request_type, request_id);
CREATE INDEX idx_approval_logs_approver ON approval_logs(approver_id);
```

---

## 📱 页面设计

### 1. 员工工作台首页
**路径**：`/packageG/pages/employee-workspace/index`

**布局**：
```
┌─────────────────────────────────┐
│  👤 员工工作台                    │
├─────────────────────────────────┤
│  📊 本月统计                      │
│  ┌─────┬─────┬─────┬─────┐      │
│  │工作  │休假  │工时  │薪酬  │      │
│  │15天 │2天  │120h │¥3600│      │
│  └─────┴─────┴─────┴─────┘      │
├─────────────────────────────────┤
│  🔧 快速入口                      │
│  ┌──────────┬──────────┐        │
│  │ 📅 休假申请 │ 📋 我的排班 │        │
│  ├──────────┼──────────┤        │
│  │ 📝 请假记录 │ ⏰ 待办事项 │        │
│  └──────────┴──────────┘        │
├─────────────────────────────────┤
│  📅 本月排班预览                  │
│  [月历视图]                       │
└─────────────────────────────────┘
```

### 2. 休假申请页面
**路径**：`/packageG/pages/leave-request/index`

**布局**：
```
┌─────────────────────────────────┐
│  ← 休假申请                       │
├─────────────────────────────────┤
│  休假类型                         │
│  ○ 年假  ○ 事假  ○ 病假  ○ 其他  │
├─────────────────────────────────┤
│  开始日期                         │
│  [2025-11-10] 📅                │
├─────────────────────────────────┤
│  结束日期                         │
│  [2025-11-12] 📅                │
├─────────────────────────────────┤
│  请假天数：3天                    │
├─────────────────────────────────┤
│  📋 规则检查                      │
│  ✅ 当月已休：2天                 │
│  ✅ 规则允许：5天/月              │
│  ✅ 本次申请：3天                 │
│  ⚠️  超出规则，需要审批            │
├─────────────────────────────────┤
│  请假原因                         │
│  [文本框]                         │
├─────────────────────────────────┤
│  [提交申请]                       │
└─────────────────────────────────┘
```

### 3. 我的排班页面
**路径**：`/packageG/pages/my-schedule/index`

**布局**：
```
┌─────────────────────────────────┐
│  ← 我的排班                       │
│  [< 2025年11月 >]                │
├─────────────────────────────────┤
│  日 一 二 三 四 五 六              │
│     1  2  3  4  5  6             │
│  早 早 休 晚 早 早 休              │
│                                  │
│  7  8  9  10 11 12 13            │
│  早 早 休 晚 早 早 休              │
│                                  │
│  14 15 16 17 18 19 20            │
│  早 早 假 晚 早 早 休              │
├─────────────────────────────────┤
│  📊 本月统计                      │
│  工作：18天 | 休息：8天 | 请假：1天│
│  工时：144h | 薪酬：¥4320         │
└─────────────────────────────────┘
```

### 4. 请假记录页面
**路径**：`/packageG/pages/leave-records/index`

**布局**：
```
┌─────────────────────────────────┐
│  ← 请假记录                       │
├─────────────────────────────────┤
│  [全部] [待审批] [已通过] [已拒绝] │
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │ 年假 | 2025-11-10 ~ 11-12   ││
│  │ 3天 | ⏳ 待审批              ││
│  │ 原因：家里有事                ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 病假 | 2025-10-15 ~ 10-15   ││
│  │ 1天 | ✅ 已通过              ││
│  │ 原因：感冒发烧                ││
│  │ 审批人：张经理                ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

### 5. 审批管理页面（管理员）
**路径**：`/packageG/pages/leave-approval/index`

**布局**：
```
┌─────────────────────────────────┐
│  ← 请假审批                       │
├─────────────────────────────────┤
│  [待审批(5)] [已处理]             │
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │ 👤 李小明 | 年假              ││
│  │ 📅 2025-11-10 ~ 11-12 (3天) ││
│  │ 📋 原因：家里有事              ││
│  │ ⚠️  超出规则（已休2天，规则5天）││
│  │ [✅ 批准] [❌ 拒绝]           ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 👤 王小红 | 病假              ││
│  │ 📅 2025-11-08 ~ 11-08 (1天) ││
│  │ 📋 原因：感冒                 ││
│  │ ✅ 在规则范围内               ││
│  │ [✅ 批准] [❌ 拒绝]           ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

---

## 🔧 技术实现

### 1. 数据库API（src/db/api-leave.ts）

```typescript
// 创建请假申请
export async function createLeaveRequest(data: {
  tenantId: string
  employeeId: string
  storeId: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  reason: string
}): Promise<LeaveRequest>

// 检查休假规则
export async function checkLeaveRules(
  tenantId: string,
  employeeId: string,
  month: string,
  requestDays: number
): Promise<{
  withinRules: boolean
  currentMonthDays: number
  ruleMaxDays: number
  ruleId: string | null
}>

// 获取员工的请假申请列表
export async function getLeaveRequestsByEmployee(
  employeeId: string,
  status?: string
): Promise<LeaveRequest[]>

// 获取待审批的请假申请
export async function getPendingLeaveRequests(
  tenantId: string
): Promise<LeaveRequest[]>

// 审批请假申请
export async function approveLeaveRequest(
  requestId: string,
  approverId: string,
  action: 'approved' | 'rejected',
  comment?: string
): Promise<void>

// 取消请假申请
export async function cancelLeaveRequest(
  requestId: string
): Promise<void>

// 获取员工的排班结果
export async function getEmployeeSchedule(
  employeeId: string,
  month: string
): Promise<ScheduleResult[]>
```

### 2. 页面组件

#### 2.1 休假申请表单组件
```typescript
// src/components/leave/LeaveRequestForm.tsx
interface LeaveRequestFormProps {
  onSubmit: (data: LeaveRequestData) => void
  onCancel: () => void
}
```

#### 2.2 排班日历组件
```typescript
// src/components/schedule/ScheduleCalendar.tsx
interface ScheduleCalendarProps {
  schedules: ScheduleResult[]
  month: string
  onDateClick: (date: string) => void
}
```

#### 2.3 请假记录卡片组件
```typescript
// src/components/leave/LeaveRecordCard.tsx
interface LeaveRecordCardProps {
  record: LeaveRequest
  onCancel?: (id: string) => void
}
```

#### 2.4 审批卡片组件
```typescript
// src/components/leave/ApprovalCard.tsx
interface ApprovalCardProps {
  request: LeaveRequest
  onApprove: (id: string, comment?: string) => void
  onReject: (id: string, comment?: string) => void
}
```

---

## 📝 开发任务清单

### 阶段1：数据库设计和实现 ✅
- [ ] 1.1 创建 leave_requests 表
- [ ] 1.2 创建 approval_logs 表
- [ ] 1.3 设置RLS策略
- [ ] 1.4 创建索引
- [ ] 1.5 测试数据库操作

### 阶段2：后端API实现
- [ ] 2.1 实现 createLeaveRequest
- [ ] 2.2 实现 checkLeaveRules
- [ ] 2.3 实现 getLeaveRequestsByEmployee
- [ ] 2.4 实现 getPendingLeaveRequests
- [ ] 2.5 实现 approveLeaveRequest
- [ ] 2.6 实现 cancelLeaveRequest
- [ ] 2.7 实现 getEmployeeSchedule
- [ ] 2.8 编写API测试

### 阶段3：前端组件开发
- [ ] 3.1 创建 LeaveRequestForm 组件
- [ ] 3.2 创建 ScheduleCalendar 组件
- [ ] 3.3 创建 LeaveRecordCard 组件
- [ ] 3.4 创建 ApprovalCard 组件
- [ ] 3.5 创建 WorkspaceStats 组件

### 阶段4：页面开发
- [ ] 4.1 员工工作台首页
- [ ] 4.2 休假申请页面
- [ ] 4.3 我的排班页面
- [ ] 4.4 请假记录页面
- [ ] 4.5 审批管理页面（管理员）

### 阶段5：集成和测试
- [ ] 5.1 集成所有页面
- [ ] 5.2 测试休假申请流程
- [ ] 5.3 测试审批流程
- [ ] 5.4 测试排班查看
- [ ] 5.5 测试权限控制
- [ ] 5.6 测试数据同步

### 阶段6：优化和文档
- [ ] 6.1 性能优化
- [ ] 6.2 用户体验优化
- [ ] 6.3 编写用户文档
- [ ] 6.4 编写开发文档

---

## 🎨 设计规范

### 1. 颜色系统
- **主色调**：微信品牌蓝 `hsl(var(--primary))`
- **成功色**：绿色 `hsl(var(--success))`
- **警告色**：橙色 `hsl(var(--warning))`
- **错误色**：红色 `hsl(var(--destructive))`

### 2. 状态标识
- **待审批**：橙色圆点 + "待审批"文字
- **已通过**：绿色对勾 + "已通过"文字
- **已拒绝**：红色叉号 + "已拒绝"文字
- **已取消**：灰色 + "已取消"文字

### 3. 交互反馈
- **加载状态**：显示加载动画
- **成功提示**：Toast提示 + 绿色对勾
- **错误提示**：Toast提示 + 红色叉号
- **确认操作**：显示确认对话框

---

## 🔐 权限控制

### 1. 员工权限
- ✅ 查看自己的排班
- ✅ 提交休假申请
- ✅ 查看自己的请假记录
- ✅ 取消待审批的申请
- ❌ 查看其他员工的信息
- ❌ 审批请假申请

### 2. 店长权限
- ✅ 查看本店所有员工的排班
- ✅ 查看本店的请假申请
- ✅ 审批本店的请假申请
- ❌ 查看其他店铺的信息

### 3. 管理员权限
- ✅ 查看所有员工的排班
- ✅ 查看所有请假申请
- ✅ 审批所有请假申请
- ✅ 管理休假规则

---

## 📊 数据流程

### 1. 休假申请流程
```
员工提交申请
    ↓
检查休假规则
    ↓
在规则内？
    ├─ 是 → 自动批准 → 更新排班
    └─ 否 → 待审批 → 管理员审批
                        ↓
                   批准/拒绝
                        ↓
                   通知员工
```

### 2. 排班查看流程
```
员工打开排班页面
    ↓
加载当月排班数据
    ↓
显示月历视图
    ↓
点击日期
    ↓
显示详细信息
```

---

## 🧪 测试计划

### 1. 单元测试
- [ ] 测试休假规则检查逻辑
- [ ] 测试日期计算逻辑
- [ ] 测试权限检查逻辑

### 2. 集成测试
- [ ] 测试完整的申请流程
- [ ] 测试完整的审批流程
- [ ] 测试数据同步

### 3. 用户测试
- [ ] 员工角色测试
- [ ] 店长角色测试
- [ ] 管理员角色测试

---

## 📅 开发时间表

### 第1周：数据库和API
- Day 1-2：数据库设计和实现
- Day 3-5：后端API开发和测试

### 第2周：前端组件和页面
- Day 1-2：基础组件开发
- Day 3-4：页面开发
- Day 5：集成测试

### 第3周：优化和上线
- Day 1-2：性能优化
- Day 3-4：用户测试和修复
- Day 5：文档编写和上线

---

## 🎯 成功标准

### 1. 功能完整性
- ✅ 员工可以提交休假申请
- ✅ 系统自动检查休假规则
- ✅ 超出规则自动进入审批流程
- ✅ 管理员可以审批申请
- ✅ 员工可以查看排班结果

### 2. 用户体验
- ✅ 界面简洁美观
- ✅ 操作流畅便捷
- ✅ 反馈及时明确
- ✅ 移动端适配良好

### 3. 性能指标
- ✅ 页面加载时间 < 2秒
- ✅ 操作响应时间 < 1秒
- ✅ 数据同步延迟 < 3秒

---

## 📚 相关文档

- [V3.0需求文档](./V3.0_REQUIREMENTS.md)
- [数据库设计文档](./V3.0_DATABASE_DESIGN.md)
- [API文档](./docs/api/leave-management.md)
- [用户手册](./docs/user/employee-workspace.md)

---

*创建时间：2025-11-06*  
*版本：v1.0*  
*状态：规划中*
