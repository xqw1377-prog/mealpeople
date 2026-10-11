# LEAVE AUTHORITY CONTRACT v0.1

> 2026-10-11 · 依据：请假审计 + 排班/考勤域已建立的模式
> 性质：事实合同，不含 UI 设计。

## 1. SSOT

```text
leave_requests = 请假事实 SSOT（现役表，v2 schema：TEXT leave_type + status CHECK 四态）
leave_types / leave_balances = RETIRE（0 行、初始化函数无调用方、余额体系空转）
approval_logs = 保留（审计表，待请假审批 RPC 落库时启用）
```

## 2. 事实语义

```text
一条 leave_requests = 员工的一次请假申请
状态机: pending → approved / rejected / cancelled（DB CHECK 已有）
employee_id = employees.id（统一语义，废除 auth.uid() 混用）
```

## 3. 写入权威（AD-1）

```text
创建请假申请 → leave_request_command RPC（服务端校验：日期/冲突/角色）
审批         → leave_review_command RPC（服务端：tenant/store scope + 状态迁移 + 通知）
取消         → leave_cancel_command RPC（员工仅撤回自己的 pending）
authenticated 直写 = DENY（收口，对齐排班/考勤域）
```

请假是"组织事实"（影响排班/考勤/薪酬），需权威裁决——与排班同模式。

## 4. 冲突检查（AD-9）

```text
服务端：同员工同日期范围重叠的 pending/approved → DENY
       AND 语义（修正前端 OR 反转 bug）
范围：仅 leave-leave 重叠；排班覆盖检查属 UI 提示非阻断
```

## 5. RLS 收敛（AD-5）

```text
废除 9 条旧策略 → 重建 4 条：
  SELECT own（employees.user_id ownership，历史不因 inactive 消失）
  SELECT managed（store_manager scope）
  SELECT tenant_admin
  写路径 = 零 policy（command RPC 走 definer）
```

## 6. 通知

```text
申请提交 → 通知审批人（tenant_admin）
审批结果 → 通知员工
复用 notifications 表 + 'system' 类型（无 'leave' 枚举值，用 system）
```

## 7. 页面收敛（AD-6）

```text
KEEP: packageG/leave-request（员工申请——重写数据层）
KEEP: packageG/leave-approval（管理者审批——重写数据层）
KEEP: packageG/leave-records（员工记录——修 employee_id 语义）
KEEP: packageG/my-leave（余额/统计——真数据接通前显示空态）
RETIRE: packageB/leave-request（孤儿，逻辑最全但无入口）
RETIRE: packageG/leave-request-easy（孤儿）
RETIRE: packageG/leave-approval-easy（孤儿）
RETIRE: packageG/working/leave（字节级复制品）
```

## 8. 证明

```text
L1 员工创建请假 → pending + 通知审批人
L2 日期重叠 → DENY
L3 管理者审批 → approved + 通知员工 + approval_comment 落库
L4 员工取消自己的 pending → cancelled
L5 员工取消他人的/非 pending → DENY
L6 跨租户审批 → DENY
L7 直写 leave_requests → DENY
L8 terminal: leave_requests 测试数据零残留
```
