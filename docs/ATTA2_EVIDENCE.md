# ATT-A2 · Command Authority 证据包

> 2026-10-07 · 依据：ATTENDANCE CONTRACT + A2 授权
> Migration：`00142_att_a2_clock_commands.sql`（已应用 live）
> 证明：C1–C12 = **13/13 PASS**（真实 JWT 三身份：empA/empB/admA）

## 实现要点

```text
attendance_clock_in(schedule_id)
  JWT → own employee identities → schedule published · 非排休 · 本人
  → advisory_xact_lock(schedule_id)   ← 锁围绕事实单位（同日多段班互不锁死）
  → EXISTS 前置检查 + UNIQUE(schedule_id) 双保险
  → planned snapshot：门店时区绝对时刻（跨午夜 end≤start +1 天；tz 缺省 Asia/Shanghai）
  → late_minutes = max(0, now − planned_start) 分钟
  → INSERT（identity/snapshot/时间/偏差全部服务端派生；客户端仅传 schedule_id）

attendance_clock_out(schedule_id)
  JWT → 本人 → lock → attendance 存在 · clock_in 存在 · clock_out 为空
  → early_leave_minutes = max(0, planned_end − now)
  → work_hours 服务端推导 → UPDATE → COMMIT
```

ACL：owner=scheduling_authority_owner；EXECUTE = owner + authenticated（无 PUBLIC/anon）；
身份经 `request.jwt.claims` GUC（排班 command 同模式）。

## 证明矩阵（13/13）

```text
PASS C1  本人 published 工作班 clock-in → identity/snapshot 全正确
         （schedule/tenant/store/employee/business_date/planned±/clock_in/late 全字段复核；
          planned 07:00+08 = 前日 23:00 UTC 断言精确到分钟）
PASS C2  他人班次 clock-in → AUTH_DENIED
PASS C3  legacy / day-off 班 clock-in → INVALID DENY
PASS C3b cancelled 班 clock-in → INVALID DENY
PASS C4  同日两段班（07-11 + 17-21）分别 clock-in → 2 条独立事实
PASS C5  并发同一 schedule 两个 clock-in → exactly one COMMIT · one DENY · 1 fact
PASS C9  跨午夜 22:00–02:00 → business_date=原日 04-11；planned 14:00Z→18:00Z（+08 语义）
         end>start 绝对区间正确
PASS C6  无考勤事实的 clock-out → DENY（尚未打上班卡）
PASS C7  合法 clock-out → server clock_out_at + work_hours 服务端派生
PASS C8  重复 clock-out → DENY · 事实未变（前后 clock_out/work_hours 逐字段比对）
PASS C10 客户端直写 INSERT → 403；UPDATE → 204 零行
PASS C11 开考后 schedule：UPDATE→FROZEN · cancel_schedule RPC→FROZEN · 物理 DELETE→RESTRICT
PASS C12 terminal = work_attendance 0 · schedules 301 legacy · schedule 通知 0
```

日志：`g0-closing-run/att-a2-proofs.log`（入库 `docs/evidence/att-a2/att-a2-proofs.txt`）。

## 实现期登记（如实）

1. 首跑暴露 owner 缺 `work_attendance` 表权限（A1 建表只建了 RLS/policy 未授表级
   SELECT/INSERT/UPDATE 给 command owner）→ 补授并**折入 canonical 00142**
   （standalone 00142b 已删除合并）
2. 证明脚本三处断言修正（非产品问题）：PG 返回 timestamptz 为 UTC 字符串 →
   C1/C9 断言改为精确 UTC 时刻；C10 的 204=零行 no-op 语义；C12 cleanup 改按
   notes LIKE（cancelled/legacy 状态残留）。另：跨午夜班（04-11 22→02）与相邻日
   排休的冲突是 B-R1 跨日引擎正确工作，证明日期已错开
3. cleanup 纪律延续 A1-R1 教训：通知随 schedule 一并清

## 未做（按裁定）

attendance_correct / attendance_events / absent / missing_clock_out / 八态 projection
= ATT-A3；UI / GPS / 申诉 = HOLD
