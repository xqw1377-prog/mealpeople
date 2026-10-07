# ATTENDANCE AUTHORITY CONTRACT v0.1

> 2026-10-07 · 依据：ATT-A0 审计（01b3e0e）+ AD1–AD8 裁定（2026-10-07 FROZEN）
> 性质：考勤事实合同。不是 Journey V4 Domain Contract（独立轨道，本合同不触碰）。
> 本合同只冻结事实模型/权威/时区/修正与 15 条证明，不含 UI 设计。

## 1. 两层 SSOT（AD1 · 冻结）

```text
schedules (published)   = 应该发生什么 · Planned Work SSOT
        ↓ schedule_id
work_attendance         = 实际发生了什么 · Actual Attendance SSOT
```

- 一条 `work_attendance` = 一条具体 published 工作班段的实际考勤事实
- `1 published schedule → 0 or 1 attendance fact`（UNIQUE(schedule_id)）
- **废除 UNIQUE(employee_id, date)**：同日两段班 = 两个 schedule = 两条 attendance，各打各的卡
- 员工不得"无排班自由打卡"；临时加班 = 管理者先发布真实 schedule（排班域 6 command 已支持）
- 排休班（is_day_off）与 cancelled/legacy 班不可打卡（A3）

## 2. 行语义与时间事实（AD2 · 冻结）

不再维护单一 `status` 枚举（无法表达"迟到12分+早退8分"并存）。事实冻结为数值与时间戳：

```text
planned_start_at / planned_end_at   首次形成 attendance 时从 schedule 快照（不可变）
clock_in_at / clock_out_at          服务端打卡时刻（server time only，客户端不传时间）
late_minutes / early_leave_minutes  服务端裁决；分别计算，允许同时 > 0，互不覆盖
work_hours                          从最终上下班时间服务端推导，不信客户端
```

状态由 server projection 解释（不落库为可写枚举）：

```text
班前 → not_started ｜ 已上班卡未下班卡 → in_progress
完成无偏差 → normal ｜ late_minutes>0 → late ｜ early_leave_minutes>0 → early_leave
班次结束无 clock-in → absent ｜ clock-in 后班次结束仍无 clock-out → missing_clock_out
```

本期不引入处罚规则/宽限政策引擎，只记录客观分钟事实。

## 3. 时区语义（AD6 · 冻结）

```text
DB 时间戳        = UTC timestamptz（不变）
business_date    = schedules.schedule_date 直接继承（绝不从打卡时刻推导）
门店业务时区     = stores.timezone（新增列，DEFAULT 'Asia/Shanghai'）
planned 快照     = schedule_date + start/end 在门店时区的绝对时刻
```

跨午夜示例：schedule_date=10-07，22:00→02:00 ⇒ business_date=10-07，
planned_start=10-07T22:00+08，planned_end=10-08T02:00+08。凌晨 02:00 的打卡永远属于 10-07 的班。

## 4. 写入权威（AD3 · 冻结）

```text
authenticated 对 work_attendance 直接 INSERT/UPDATE/DELETE = DENY（RLS 全封）
唯一写路径 = command RPC（复制排班模式：AUTH→scope→validate→lock→write→commit）
并发 = advisory 事务锁 + UNIQUE(schedule_id) 双保险
```

## 5. Command 清单（AD2/AD3 · 冻结）

```text
attendance_clock_in(schedule_id)      仅本人 published 工作班；server time；防重复
attendance_clock_out(schedule_id)     必须已有 clock-in；duplicate DENY；算 early_leave_minutes
attendance_correct(...)               管理者修正（store_manager/tenant_admin，scope 校验）
                                      reason 必填；追加不可变 audit event；同事务
```

员工申诉工作流本期不做（AD4）；GPS/位置本期不做且 UI 不得声称定位能力（AD5 HOLD）。

## 6. 修正与审计（AD4 · 冻结）

```text
correction = 管理者 command + reason 必填 + 不可变 attendance_events 追加（同事务）
员工自助补卡申请 → 后续阶段
```

## 7. 诚实展示（AD7 · 冻结，随 Honesty Patch 立即执行）

真数据接通前，工作台与 dashboard 只允许「暂无考勤数据 / -- / 暂不可用」；
不得再出现任何伪造考勤数值（96.5% / 迟到N人 / 未打卡 等）。

## 8. 旧物处置（AD8 · 冻结）

`area_attendance_overview` = RETIRE（0 行、无消费链）；管理看板未来由
`schedules + work_attendance` server projection 生成，不维护第二份考勤快照。

## 9. 15 条证明契约（ATT-A 终验，冻结）

```text
A1  本人 published 工作班 clock-in → attendance.schedule_id 正确
A2  他人班次 clock-in → DENY
A3  cancelled/day-off/非 published 班 clock-in → DENY
A4  同日两段 published → 分别 clock-in/out → 2 条事实 ALLOW
A5  同一 schedule 并发 clock-in → exactly one winner
A6  clock-out 须已有 clock-in；duplicate clock-out → DENY
A7  客户端直写 work_attendance（INSERT/UPDATE/DELETE）→ DENY
A8  跨租户/跨店 command → DENY
A9  22:00–02:00 跨午夜 → business_date 保持原 schedule_date；planned 区间正确
A10 迟到+早退并存 → 两偏差同时记录，互不覆盖
A11 班次结束无 attendance → absent projection
A12 clock-in 后班次结束无 clock-out → missing_clock_out projection
A13 管理者修正 → reason 必填 → 事实更新 + 不可变 audit event 追加
A14 跨店/跨租户修正 → DENY
A15 工作台/dashboard → 无伪造考勤数值
```

## 10. 实施顺序（门禁复制排班）

```text
ATT-A1 Data Foundation（表语义/关系完整性/时区列/RLS 基线/直写封死）
ATT-A2 Command Authority（clock_in / clock_out）
ATT-A3 Projection + Correction（偏差分钟/projection/管理者修正+audit event）
ATT-A-HONESTY PATCH（假数据摘除，可先行，不属 UI redesign）
```

## 11. 禁止事项

- 不改 schedules 域任何冻结结构（含 6+2 RPC/RLS/复合 FK）
- 不做员工申诉流、处罚/宽限政策引擎、GPS/geofence（均 HOLD）
- 不从打卡时刻推导 business_date；不让客户端提交任何时间/status/work_hours
- UI 不声称"到店/定位成功/门店范围内"
