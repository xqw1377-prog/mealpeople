# P2-S0-A-R1 · Authority Hardening 证据包

> 2026-10-07 · 依据：P2-S0-A = HOLD-R1 裁定（仅修两个 blocker）
> Migrations：`00125_p2s0_a_r1_authority_hardening.sql` + `00126_p2s0_a_r1b_helper_param_redesign.sql`

## Blocker 1 · Helper 权限收口（R1-A）

```text
schema     private（不在 PostgREST 暴露集，实测 pgrst.db_schemas 无 private）
owner      scheduling_authority_owner（NOLOGIN · BYPASSRLS · 仅 SELECT profiles/employees/stores）
ACL        {owner=X, authenticated=X}——PUBLIC/anon/service_role 全部无 EXECUTE
策略       10 条全部重建，引用 private.sched_*(auth.uid()) 限定名
范围       仅 4 × sched_*；Advisor 点名的其他历史函数未动（裁定纪律）
```

**过程发现（设计修正）**：`auth` schema 归 `supabase_admin`，平台 SQL 通道（postgres）对其只有 USAGE
无 GRANT OPTION——给 definer owner 授权 auth USAGE 的尝试无法生效（API 返回成功但 ACL 不变）。
解法不是继续申请权限，而是 **00126 参数化重设计**：`auth.uid()` 由 policy 层求值（authenticated
原生可访问 auth）后作参数传入，definer 函数体不再触碰 auth schema。依赖消除优于权限扩张。

## Blocker 2 · 行关系完整性（R1-B，复合 FK NOT VALID）

```sql
stores    UNIQUE (id, tenant_id)
employees UNIQUE (id, tenant_id, store_id)
schedules FK (store_id,   tenant_id)             → stores(id, tenant_id)            NOT VALID
schedules FK (employee_id, tenant_id, store_id)  → employees(id, tenant_id, store_id) NOT VALID
```

convalidated = false（实测）：301 条 legacy（含 4 处 store↔tenant、4 处 employee↔tenant 历史错配）
未被扫描/修复/破坏；今后 INSERT/UPDATE 的新行强制真实 tenant/store/employee 关系——
tenant boundary 不再只验证字段标签。

## 6 条证明（真实 JWT / anon key，9/9 PASS 含终态与 FK 状态）

```text
PASS R1-1  anon 调用 rpc/sched_is_store_manager → DENY（404，private 不暴露）
PASS R1-2  sched_* ×4 owner = scheduling_authority_owner（NOLOGIN），ACL 仅 owner+authenticated
           （明细：owner=scheduling_authority_owner login=false bypassrls=true
             acl={scheduling_authority_owner=X/*, authenticated=X/*}）
PASS R1-3  tenant A + store B             → DENY（复合 FK 23506）
PASS R1-4  tenant A + employee B          → DENY（复合 FK 23506）
PASS R1-5  store B1 + employee(另一店)    → DENY（复合 FK 23506）
PASS R1-6  合法 tenant/store/employee + published → ALLOW（201）
PASS R1-6b employee SELECT 经 private helper（参数化链路）→ 读到自己 published ×1
PASS TERM  终态 = 301 legacy · published 0 · stores.manager_id 空 · unaff 已还原
PASS FKNV  两条复合 FK convalidated=false（NOT VALID 语义确认）
```

完整日志：`g0-closing-run/p2s0-a-r1-proofs.log`。

## Security Advisor 复核

```text
GET /v1/projects/ejnbljtgoislydeqtosz/advisors/security
total lints = 380 · ERROR 级 = 0
提及 sched_* 的 finding = 0（此前 4 条 anon SECURITY DEFINER RPC finding 全部消失）
剩余 WARN 均为历史函数（can_access_tenant / is_super_admin / get_user_tenant_id /
handle_new_user 等）——按裁定不在本轮范围
```

## 未动项（按裁定纪律）

- `shift_swap_requests` 及其旧策略：未触碰（P2-S0-B 随 D2 处置）
- transactional scheduling commands：未开始（等本门 PASS 放行）
- 301 legacy：原样隔离，未做任何"整理"
