# SCHEDULING AUTHORITY CONTRACT v0.1

> 2026-10-07 · 依据：D1–D5 裁定（2026-10-07）+ 排班全链审计 e77ddad
> 性质：Phase 2 排班事实合同。**不是 Journey V4 Domain Contract**（独立轨道，本合同不触碰）。
> 本合同只冻结事实与验收，不含 UI 设计。

## 1. 数据分层（D1 · 冻结）

```text
schedule_plans / schedule_results   = 规划 / 草稿 / 计算层（草稿不得进入事实层）
schedules                           = 已发布的员工排班事实 · SINGLE SOURCE OF TRUTH
employee_shifts                     = LEGACY · NO NEW WRITES
work_schedule_records               = LEGACY · NO NEW WRITES
```

现状行数（2026-10-07 实查，项目 ejnbljtgoislydeqtosz）：

```text
schedules = 301（唯一有生产数据的排班表）
employee_shifts = 0 · work_schedule_records = 0 · shift_swap_requests = 0
schedule_plans = 0 · schedule_results = 40 · schedule_logs = 301 · notifications = 0
```

→ Legacy 表全部为空：处置零数据迁移成本；`shift_swap_requests` 按裁定 rows=0 分支，直接迁 schedules FK 语义（不 DROP，改语义）。

## 2. 事实语义（D1 · 冻结）

- 一条 `schedules` = 一个员工的一段具体工作安排
- 同一天多段班 = **ALLOW**（08:00–12:00 + 17:00–21:00 合法）
- 现行 `createSchedule()` 同员工同日静默返回旧记录的逻辑**废除**
- 判定口径：**时间是否冲突 ≠ 当天是否已有记录**
- schema 事实：`schedules` 仅 PK（id），无业务唯一约束——多段班无需迁移即可写入
  （列：tenant_id / store_id / employee_id / schedule_date / shift_type / start_time / end_time /
  status / is_day_off / meal_period / rest_hours / notes / created_by）
- `schedules.status` 现值域含 'pending'（旧语义，无发布边界）；P2-S0 归一时定义发布语义值域，报裁定确认后生效

## 3. 发布边界（冻结）

```text
计划/计算/草稿 → schedule_plans / schedule_results
「发布排班」→ 服务端校验（冲突 + 权限）→ 写入 schedules → 员工立即可见 → 发通知
```

草稿不得进入 `schedules`；进入 `schedules` 即为组织已发布给员工的工作事实。
现行 schedule-planning 保存直接写 `status:'pending'` 的模式终止。

## 4. 冲突规则 v1（D4 · 冻结，服务端权威）

检测点 = 一切权威写入口：CREATE / UPDATE / BATCH PUBLISH / SWAP APPROVAL。
UI 预检 = UX 帮助；SERVER / DB CHECK = 权威。

```text
同一员工时间重叠                      → DENY
全天休息（is_day_off）+ 当天任何工作班次 → DENY
餐段休息 + 对应时间冲突                 → DENY
换班后任一员工发生重叠                  → DENY
自己编辑自己 → 排除当前记录后再检测
A.end_time = B.start_time（首尾相接）   → ALLOW
```

Phase 2 明确**不做**（留给下一层 Rule Engine）：最低休息时长、周工时上限、劳动法自动裁定、连续工作天数。

## 5. 换班事务（D2 · 冻结）

旧 mock 链（employee_shifts FK + mock 目标 + 无审批 UI + 先 approved 后交换不回滚）= **RETIRE**。
新换班基于 `schedules.id`：

```text
VERIFY → CONFLICT CHECK → SWAP → APPROVE → NOTIFICATION
全部成功才 COMMIT；任一步失败全部 ROLLBACK
```

候选班次必须是真实可交换的已发布 schedules；审批人为门店/租户管理者。

## 6. 通知（D3 · 冻结，Phase 2 范围内）

```text
IN-APP = YES（复用 notifications 表 + 'schedule' 类型）
微信订阅消息 / Realtime push / 短信 / 复杂消息中心 = HOLD
```

最少四类：排班发布、排班修改、排班取消、换班结果；另含：换班申请 → 审批人。
员工点击通知统一进入「我的班次」（通知页需补 schedule 类型路由，现无）。

## 7. 权限矩阵（D5 · 冻结）

```text
AUTHORIZATION = profiles.role + tenant boundary + store scope
position = 业务属性，永远不能授权（现行 position==='店长' 授权点全部改掉）

employee       → 看自己的班 · 发起自己的换班 · 撤回自己的 pending 请求
store_manager  → 管自己门店排班 · 审批本门店换班
tenant_admin   → 管租户范围内排班
super_admin    → 平台能力，不作正常门店业务角色
```

所有写操作必须同时验证 current tenant + store scope，不能只看 role 字符串。

## 8. P2-S0 · Scheduling Authority Closure 八条证明（验收）

```text
1. 管理者发布一条班 → schedules 产生事实
2. 员工「我的班次」→ 读取同一条 schedules 事实
3. 一天两个不重叠班次 → ALLOW
4. 时间重叠 → DENY / 0 partial writes
5. 全日排休与班次冲突 → DENY
6. Swap → request → approve → atomic exchange
7. Publish / Update / Swap → notification produced
8. employee / store_manager / tenant_admin → 权限与 tenant/store boundary 正确
```

八条未全绿：`SCHEDULING UI REDESIGN = HOLD`。

## 9. 旧页面处置原则（冻结）

不救 16 页。按 `KEEP / REDIRECT / RETIRE` 收敛到少数真实入口；
`monthly-schedule`、`schedule-history`、`schedule-log-form`、旧 schedules 平行视图、旧 employee_shifts scheduling 链——无明确价值者退出真实导航，不重新装修。具体清单在 P2-S0 数据层归一后随实现报裁定。

## 10. 禁止事项

- P2-S0 全绿前不开任何排班 UI 重设计
- 不提前定义 Journey V4 Domain Contract
- 不在本阶段引入 Rule Engine 扩展规则（见第 4 节排除项）
- 不为保持旧 API 维护两套班次 ID
