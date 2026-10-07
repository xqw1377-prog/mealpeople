# ATTENDANCE AUTHORITY CONTRACT · AMENDMENT 1

> 2026-10-07 · 性质：对 v0.1 的纯文档增补（不改原合同、不改 UI/代码/DB）。
> 依据：裁定 DESIGN PASS / AMENDMENT-1 REQUIRED（2026-10-07）。仅五条（A1–A5）。

## A1 · Projection 补第八态：`late_early_leave`

原合同第 2 节 projection 列表遗漏双偏差并存态。补齐为**八态完整契约**：

```text
not_started          班前
in_progress          已上班卡 · 未下班卡
normal               完成 · 无偏差
late                 late_minutes > 0
early_leave          early_leave_minutes > 0
late_early_leave     late_minutes > 0 AND early_leave_minutes > 0
absent               班次结束 · 无 clock-in
missing_clock_out    clock-in 后班次结束 · 仍无 clock-out
```

值名用下划线连接（`late_early_leave`），不含 `+` 等程序处理不友好字符。
事实模型（两列分钟分别记录）不变，此为投影层的完整枚举。

## A2 · `stores.timezone` = TEXT **NOT NULL** DEFAULT 'Asia/Shanghai'

原合同仅写 DEFAULT，显式 NULL 仍可绕过——planned snapshot 将失去权威。冻结：

```text
stores.timezone = TEXT NOT NULL DEFAULT 'Asia/Shanghai'
现有门店回填   = 统一 'Asia/Shanghai'
约束           = 仅接受有效 IANA 时区名（本阶段不做时区配置 UI）
```

## A3 · Attendance SELECT 权威矩阵（RLS baseline 前置冻结）

沿用排班域已冻结关系（store manager scope = `stores.manager_id → profiles.id`；
employee ownership = `employees.user_id`；不造 `profiles.store_id`）：

```text
employee       → SELECT 自己的 attendance facts
                 （ownership = employees.user_id = current user；
                   历史记录不因 employee.status 后来 inactive 而消失）
store_manager  → SELECT 所管门店 attendance
tenant_admin   → SELECT 本租户 attendance
super_admin    → 平台角色，不作为正常门店业务访问路径
cross-store    → DENY
cross-tenant   → DENY
```

## A4 · Attendance identity + planned snapshot：服务端派生、创建后不可变

```text
以下字段全部由 schedule 服务端派生，客户端永远不得提交：
  schedule_id / tenant_id / store_id / employee_id /
  business_date / planned_start_at / planned_end_at

其中 identity + planned snapshot（上列全部）在 attendance 创建后 immutable。
管理者 attendance_correct 同样不能修改这些字段。
correction 只允许修改实际事实：clock_in_at / clock_out_at，
并由服务端重算 late_minutes / early_leave_minutes / work_hours / projection，
强制 reason + attendance_event —— 修正考勤不得变成改排班历史。
```

## A5 · 考勤已开始 ⇒ schedule 考勤语义字段冻结（跨域 DB guard）

```text
存在 work_attendance(schedule_id = S)
⇒ S 的以下字段禁止再改：
  tenant_id / store_id / employee_id / schedule_date /
  start_time / end_time / is_day_off / status

即：已开始考勤的班 → 不能 swap、不能取消、不能改时间、不能换员工。
notes 等不影响考勤事实的字段可继续修改。
```

**唯一例外条款**（对原合同第 11 节"不改 schedules 域冻结结构"的窄豁免）：

```text
允许为 attendance consistency 在 schedules 域增加最小 DB integrity guard（如
trigger/constraint 拒绝对已开考班的语义字段 UPDATE）；不得改写排班域的
authority / conflict / permission contract 本身。
SCHEDULING DOMAIN = STILL FROZEN（除此守卫外）
```

落实层面：该 guard 由 ATT-A 阶段实施（如 review_schedule_swap / update_schedule /
cancel_schedule 内的原子检查或表级 trigger），执行细节属实现自由，
本条只冻结不变量与豁免边界。
