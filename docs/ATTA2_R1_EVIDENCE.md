# ATT-A2-R1 · Active Authority + First-Clock-In Serialization 证据包

> 2026-10-08 · 依据：ATT-A2 = HOLD-R1 裁定（两 blocker）
> Migration：`00143_att_a2_r1_active_auth_and_serialization.sql`（已应用）
> 证明：P1–P5 = **5/5 PASS**（真实 JWT + 真双 HTTP 并发）

## 修复对照

```text
R1-1 ACTIVE AUTHORITY
  attendance_clock_in 的 ownership：
    att_my_employee_ids（含 inactive）→ sched_my_employee_ids（active only）
  attendance_clock_out 保持 ownership helper（班中被停用不卡死下班卡）：
    开始新考勤 = active employment required
    完成已开始考勤 = ownership sufficient

R1-2 FIRST-CLOCK-IN SERIALIZATION
  clock_in / clock_out 的 schedule 读取改为 SELECT ... FOR UPDATE
  （与 update_schedule / cancel_schedule / review_schedule_swap 同一行级互斥），
  row lock 内重新验证（published/非排休/在职本人）→ advisory lock → EXISTS → INSERT
  → 拿锁后读到的一定是最新已提交事实；旧 snapshot TOCTOU 窗口消灭
```

## 证明（5/5，含真并发）

```text
PASS P1  inactive 员工 + 自己 published 班 → clock-in AUTH_DENIED
         （裁定原始打穿路径封死）
PASS P2  同一 inactive 员工 SELECT 历史考勤 → ALLOW
         （Amendment A3 历史语义未受伤——两个 helper 权限边界正确分离）
PASS P3  clock-in vs update_schedule 真双 HTTP 并发：
         实测 ci=200 · update=400(FROZEN) · schedule 保持 10-18 ·
         attendance planned=02:00Z(=10:00+08) —— clock-in 先赢，
         update 触发 freeze guard；二选一合法且 snapshot 一致断言通过
PASS P4  clock-in vs review_schedule_swap 真并发：
         实测 ci=200 · review=400(FROZEN) · SC 仍归 empA ·
         attendance 归属一致 · swap 保持 pending —— 无 identity mismatch
PASS P5  terminal = attendance 0 · 301 legacy · 通知 0
```

日志：`g0-closing-run/att-a2-r1-proofs.log`（入库 `docs/evidence/att-a2/att-a2-r1-proofs.txt`）。

## 并发语义说明

两域现在共用 schedules 行级互斥：
- clock-in 先拿 row lock → attendance 落库 → 排班 UPDATE 触发 FROZEN（P3/P4 实测此路径）
- 排班变更先拿 row lock → clock-in 等待 → 醒来读到新事实 → 重新验证（归属/状态变了则 DENY）
  或用新 snapshot 建 attendance——任一交错下 schedule↔attendance 恒一致（P3 的
  consistent 断言覆盖两方向）

advisory lock(schedule_id) 与 UNIQUE(schedule_id) 双保险保留（C5 并发 clock-in
语义不受本轮改动影响）。
