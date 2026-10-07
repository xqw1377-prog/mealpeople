# P2-S0-B · Transactional Scheduling Commands + Conflict Authority 证据包

> 2026-10-07 · 依据：AUTHORITY CONTRACT D1-D5 + P2-S0-B 授权
> Migration：`00127_p2s0_b_scheduling_commands.sql`（57 条语句，Management API 应用，全 OK）

## 架构（live 状态）

**五个 command RPC**（public schema，PostgREST 可达，仅 authenticated EXECUTE）：

```text
publish_schedule / update_schedule / cancel_schedule
request_schedule_swap / review_schedule_swap

owner = scheduling_authority_owner（NOLOGIN，同 A 阶段专用角色）
流程 = AUTH → tenant/store scope → validate → pg_advisory_xact_lock(员工+日期)
       → CONFLICT CHECK → WRITE → NOTIFICATION → COMMIT
异常（任一步）= 整体 ROLLBACK（0 partial writes）
```

**设计要点（均已在 live 验证）**：
- RPC 内身份取 `request.jwt.claims` GUC 直读（不调 `auth.uid()`，R1 实测 definer 无法获得 auth schema USAGE；G0 g0_jwt_sub 同模式）
- 冲突检查并发安全：`(employee, date)` 级 advisory 事务锁 + 同事务检查 → 并发冲突发布恰一个提交
- 冲突规则 = 合同 D4 冻结六条：同员工重叠 DENY（严格不等式 → 端点相接 ALLOW；end≤start 视为跨天）/ 全天排休互斥 / 餐段排休按租户 meal_periods 窗口（无配置保守按全天）/ 换班后双向无冲突 / 编辑排除自身
- 换班仅限同店（复合 FK (employee,tenant,store) 必然推论）；交换双方须为该店在职员工记录
- `shift_swap_requests` FK 由 employee_shifts 切至 **schedules**（rows=0 直接迁语义）；旧 5 条无 scope 策略全部淘汰，仅留最小 SELECT（本人/店长/租户管理员）
- **B7 直写封死**：schedules 的 6 条 INSERT/UPDATE policy 全部撤销，只剩 4 条 SELECT——
  authenticated 直插 42501、直改 0 行；权威写入只经 command
- 通知：发布/修改/取消/换班结果/换班申请→审批人 五类 in-app（notifications，type='schedule'）；
  员工未绑定登录用户时静默跳过（不炸事务）

## 证明（B1–B9 + 回滚 + 终态，13/13 PASS）

```text
PASS B1  合法 publish → published 事实 + 员工「排班已发布」通知
PASS B2  同日两个不重叠班次（09-13 / 17-21）→ ALLOW
PASS B3  时间重叠（12-15 vs 09-13）→ DENY(CONFLICT) · 行数不变 · 通知不变（0 partial）
PASS B4a 全天排休 + 当天工作班 → DENY
PASS B4b 餐段排休（晚餐窗 17:00-21:30，租户 meal_periods 实配）+ 工作班 18-20 → DENY
PASS B5  编辑排除自身：13:00-17:00 与 17:00-21:00 端点相接 → ALLOW；
         改 16:00-18:00 重叠 → DENY 且内容未变
PASS B6  并发两个冲突 publish（09-12 / 10-13 同员工同日）→ exactly one COMMIT · one DENY · 终值 1 行
PASS B7  admin JWT 直插 schedules → 42501；直改 → 200 + 0 行（写路径仅剩 command）
PASS B8  swap 闭环：员工发起（本人班次校验）→ 审批人收到通知 → 管理者批准
         → 两行原子交换（a→B b→A）→ request approved → 双方结果通知
         （target 无绑定用户按 NULL-skip，通知=1 为正确值）
PASS B8b 交换将致重叠（empB 预置 11-13 与换入的 10-14 冲突）→ DENY(CONFLICT)
         · request 仍 pending · 班未交换 · 0 新通知（完整回滚）
PASS B9  跨租户 tenant_admin 发 schedule 命令 → DENY(AUTH_DENIED)；
         employee 发 publish → DENY(AUTH_DENIED)
PASS CX  cancel → cancelled + 「排班已取消」通知
PASS TERM 终态 = schedules 301×legacy · swap 0 · schedule 通知 0（测试数据零残留）
```

完整日志：`g0-closing-run/p2s0-b-proofs.log`（真实 JWT：admin.a/admin.b/emp.a，g0bb 测试租户）。

## 应用过程中的两处修正（已折入 migration 文件，如实登记）

1. owner 缺 `schedules` SELECT（冲突引擎/行锁读取需要）→ 补 `GRANT SELECT`
2. `sched_notify` 对未绑定登录用户的员工产生 NULL user_id → 违反 notifications 非空约束并炸掉整个
   approve 事务（B8 首跑暴露——顺带验证了事务完整性）→ 改为 NULL 静默跳过

## 登记事项

- 5 个 command 的 ACL 含 service_role EXECUTE（平台对 public 新函数的默认授予，服务端可信上下文，
  与既有函数一致；anon/PUBLIC 均无）
- 通知展示端（通知页 schedule 类型路由 → 我的班次）属 UI 范畴，P2-S1 处理
- schedules 写路径仅剩 command；schedule-planning 等旧页面直插 `pending` 的代码已被数据层天然封死，
  页面改造属 P2-S1 UI HOLD 范围
