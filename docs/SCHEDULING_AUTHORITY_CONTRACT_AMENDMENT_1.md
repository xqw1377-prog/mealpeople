# SCHEDULING AUTHORITY CONTRACT · AMENDMENT 1

> 2026-10-07 · 性质：对 v0.1 的纯文档增补（不改原合同、不改 UI、不改数据库）。
> 依据：裁定 DESIGN PASS / AMENDMENT-1 REQUIRED。本增补仅四条（A1–A4）+ 状态值域 + 证明条款修订。

## A1 · Legacy Baseline

现存 301 条 `schedules` 为 **pre-authority legacy**，不是可继承的已发布事实，**不得直接发布**。

实测基线（2026-10-07，双方独立复核一致）：

```text
rows = 301 · schedule_date 2025-11-10 → 2025-11-20 · status 'pending' × 301
is_day_off = false × 301 · start_time/end_time 缺失 × 301
来源 = 4 个租户（含「食在不一样」「33」「测试餐厅」等历史/测试来源）
同员工同日多行分组 = 59
```

准确口径（修正原合同第 1 节措辞）：

```text
schedules = 唯一存在历史存量行的候选 SSOT
          ≠ 301 条均为合格的已发布排班事实
```

## A2 · Status 值域（冻结）

```text
legacy     = P2-S0 authority cutover 之前的旧存量；不参与员工当前班次；不参与新冲突计算
published  = 已正式发布；当前唯一有效排班事实；员工可见；参与冲突检测
cancelled  = 曾发布后取消；保留事实轨迹；不参与当前排班和冲突

pending    = P2-S0 后禁止进入 schedules
changed    = NOT A STATUS（是事件）
```

修改正式班次：`published` 内容变化 → 仍为 `published` → `updated_at` 更新 → 产生「排班修改」通知。
草稿只能存在于 `schedule_plans / schedule_results`。

Schema 纪律（P2-S0 migration 执行）：

```text
301 条现存 pending → legacy
status 列 DEFAULT 'pending' → REMOVE（实测默认值 'pending'::text 存在）
权威写入口必须显式写 published，不依赖默认值
```

## A3 · Authority Enforcement（P2-S0 blocker 登记）

实测当前 RLS：

```text
schedules            FOR ALL USING can_access_tenant(auth.uid(), tenant_id)（+ super_admin 全量）
shift_swap_requests  管理员审批/查看 = 纯 profiles.role 判断，无 tenant/store scope
```

**CURRENT RLS ≠ CONTRACT AUTHORITY。** P2-S0 必须将权威落地为：

```text
role + tenant boundary + store scope + ownership（员工仅自己）
```

原则写死：

```text
AUTHORITY MUST NOT LIVE ONLY IN UI
页面隐藏按钮 ≠ 权限控制
client role check ≠ authority
DB / transactional authority = final enforcement
```

## A4 · Cutover Rule

```text
员工班次查询只读取 published
legacy → 不展示 · 不参与冲突计算 · My Schedule 0 exposure
直到第一条真实 published schedule 发布，员工才看得到排班
```

## 证明条款修订（八条不推翻，两处加强）

第 1/2 条增加前提：

```text
legacy 301 → employee My Schedule = 0 exposure（隔离验证）
```

第 8 条必须证明数据库权威而非 UI：

```text
employee       → direct unauthorized schedule write = DENY
store_manager  → write Store A = ALLOW · write Store B = DENY
tenant_admin   → Tenant A = ALLOW · Tenant B = DENY
```

## 实现方向（登记，随 P2-S0 细化，本增补不冻结实现）

权威写入口收敛为 transactional command layer（publish_schedule / update_schedule /
cancel_schedule / request_schedule_swap / review_schedule_swap），每个 command：
`AUTH → TENANT/STORE SCOPE → VALIDATE → CONFLICT CHECK → WRITE → NOTIFICATION → COMMIT`，
任一步失败 ROLLBACK；页面不得再直写 `schedules`。
DB 函数沿用 G0 SECURITY DEFINER 纪律：dedicated NOLOGIN owner · least privilege ·
fixed search_path · explicit auth.uid checks · REVOKE PUBLIC/anon · only intended authenticated EXECUTE。
