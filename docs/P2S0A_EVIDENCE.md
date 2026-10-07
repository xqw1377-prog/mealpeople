# P2-S0-A · Legacy + Status + RLS Authority Baseline 证据包

> 2026-10-07 · 依据：SCHEDULING AUTHORITY CONTRACT v0.1 + AMENDMENT 1（FROZEN）第一刀授权
> Migration：`supabase/migrations/00124_p2s0_a_scheduling_authority_baseline.sql`（21 条语句，Management API 应用，38.5s，全 OK）

## 设计输入（数据模型事实，全部实测）

```text
user_role 枚举 = super_admin / tenant_admin / store_manager / employee / guest / agent
                 （store_manager 为 schema 既有值，当前 0 行使用——无发明）
stores.manager_id → profiles.id（schema 既有 FK，0/26 填充）= 店长授权关系
User → Employee = 1:N（实测 3 个 user_id 对应 61 行员工记录；跨 4 租户）
ownership 解析  = employees.user_id = auth.uid() AND status='active'
tenant 解析     = profiles.tenant_id（经既有 get_user_tenant_id）
```

## 证据组 1 · Migration Diff

`00124_p2s0_a_scheduling_authority_baseline.sql`（随本提交入库）：
S0-A1 唯一批量迁移 `UPDATE ... SET status='legacy' WHERE status='pending'`（301 行）；
S0-A2 `SET NOT NULL` + `DROP DEFAULT` + `CHECK (legacy/published/cancelled)`；
S0-A3 弃 2 条旧宽策略，建 4 helper（SECURITY DEFINER/STABLE/固定 search_path，沿用 G0 纪律）+ 10 条策略。
**未做**：`pending → published`（禁止）、补假时间（禁止）、swap/notification/UI（未触碰）。

## 证据组 2 · After-state

```text
schedules status 分组：legacy=301（其余 0）
status 列：column_default = null · is_nullable = NO
约束：schedules_status_check CHECK (status IN legacy/published/cancelled)
RLS：relrowsecurity = true
helper：sched_my_employee_ids / sched_my_managed_store_ids / sched_is_store_manager / sched_is_tenant_admin
```

## 证据组 3 · RLS Policy 定义（live pg_policies 摘录）

```text
SELECT（4，OR 合并）：
  own_published    USING status='published' AND employee_id IN (sched_my_employee_ids())
  managed_stores   USING sched_is_store_manager() AND store_id IN (sched_my_managed_store_ids())
  own_tenant_admin USING sched_is_tenant_admin() AND tenant_id = get_user_tenant_id(auth.uid())
  super_admin      USING is_super_admin(auth.uid())

INSERT（3）WITH CHECK：
  tenant_admin ：sched_is_tenant_admin() AND tenant_id=get_user_tenant_id() AND status='published'
  store_manager：同上 + store_id IN (sched_my_managed_store_ids())
  super_admin  ：is_super_admin() AND status='published'

UPDATE（3）USING 同权限范围，WITH CHECK 额外限 status IN ('published','cancelled')：
  → legacy 不可经任何 JWT 进入或修改

DELETE：无任何 policy —— 全部 JWT 角色物理删除 = 0 行受影响；物理删除仅 service 层
```

不变量：employee 角色对 schedules **无任何 JWT 写路径**（无 INSERT/UPDATE/DELETE policy）。

## 证据组 4 · 真实 JWT DENY/ALLOW 矩阵（18/18 PASS）

执行账号（G0 黑盒测试身份，g0bb 测试租户）：emp.a(employee) / admin.a(tenant_admin A) /
store_manager 身份（signup 因平台邮箱限流不可用 → 临时复用 g0bb.unaff 翻转 role，矩阵结束已还原 employee/null）。
完整日志：`g0-closing-run/p2s0-a-jwt-matrix.log`。

```text
PASS T1  employee SELECT → 0 行（legacy 0 exposure，A4）
PASS T2  employee INSERT published → DENY(403)
PASS T3  tenant_admin INSERT 本租户 published → ALLOW(201)（row1）
PASS T4  tenant_admin(A) INSERT tenant B → DENY
PASS T5  INSERT status='pending' → DENY（RLS with_check 先拦）
PASS T6  store_manager INSERT 所管门店 → ALLOW（row2）
PASS T7  store_manager INSERT 非所管门店 → DENY
PASS T8  store_manager(A) INSERT tenant B → DENY
PASS T9  store_manager SELECT → 仅所管门店行
PASS T10 tenant_admin(A) SELECT → 仅本租户（他租户 301 legacy 不可见）
PASS T11 employee SELECT → 自己的 published ×2（员工与管理者读同一事实，八条证明 #2 前置）
PASS T12 employee UPDATE own row → 0 行受影响，内容未变（复核 notes 未被篡改）
PASS T13 employee DELETE own row → 0 行受影响，行仍在
PASS T14 tenant_admin UPDATE published→cancelled → ALLOW（状态迁移）
PASS T15 UPDATE status→'legacy' → DENY（WITH CHECK）
PASS T16 tenant_admin(A) UPDATE 他租户 legacy 行 → DENY（不可见）
PASS T17 tenant_admin DELETE → 0 行受影响，行仍在（物理删除仅 service 层）
PASS T18 service 层 INSERT 'pending' → CHECK 23514（A2 第二道防线实测存在）
```

语义说明（PostgreSQL RLS）：无 policy 的 UPDATE/DELETE 对不可用行是**静默 0 行**而非抛错——
T12/T13/T17 的拒绝证据 = 0 行受影响 + 行/内容事后复核未变。

## 清理与终态

```text
测试行删除 2/2（RETURNING id 复核）· store A manager_id 复位 NULL · 门店 B 移除
g0bb.unaff 还原 employee/null · 终态 schedules = 301 × legacy（与初始唯一差异 = status 值）
```

## 登记（P2-S0-B 需处理，本轮未动）

- `shift_swap_requests` 旧策略（role 字符串无 scope）仍原样——随 D2 换班重建一并处置
- schedules 写入尚无 created_by 强制归属（command layer 范畴）
- 平台旧版 service_role/anon key 已于 2026-10-05 禁用（本次发现）：Management API + publishable key 通道正常，Admin API 通道不可用（signup 限流为独立现象）
