# P2-S1-A-R2 · Brief Context Binding 证据包

> 2026-10-07 · 依据：P2-S1-A = HOLD-R2 裁定（get_swap_shift_brief 对象授权）
> Migration：`00132_p2s1_a_r2_brief_context_binding.sql`（仅改本函数；前端无变化，
> `ac80c80` 的 typecheck/build/运行时证据继续有效）

## 修复语义（R1 版 → R2 版）

```text
R1 版（越界）  同店 active 员工可按任意 UUID 读 5 字段（含 legacy）
R2 版（收口）  legacy → 恒 0 行
              管理者 → sched_can_write_store（本店写权限，tenant/store scope）
              员工   → 仅当该班次绑定于自己发起的 swap request
                       （requester_id IN sched_my_employee_ids(v_uid)
                        AND p_schedule_id IN (requester_shift_id, target_shift_id)）
              其余   → 0 行
```

员工授权显式基于 `shift_swap_requests.requester_id`（本人申请语境），
不再基于"我是这家店员工"；不做通用同店排班详情查询通道。

## 证明（5/5 PASS，真实 JWT）

```text
PASS R2-1  employee + 任意同店 legacy schedule → 0 rows（修复了裁定打穿的路径）
PASS R2-2  employee + 同店 published（无自己参与的 swap request）→ 0 rows
PASS R2-3  employee 建立真实 swap request 后，requester/target 两班 brief
           各返回 1 行，字段恰为 5 最小字段
PASS R2-4  管理者：本店（tenant_admin A）brief = 1 行 ALLOW；
           跨租户管理者（tenant_admin B 查 store A 班次）= 0 rows DENY
PASS TERM  终态 = 301 legacy · swap 0 · schedule 通知 0（零残留）
```

日志：`g0-closing-run/p2s1a-r2-proofs.log`。
swap-records 页面行为不变：员工侧仍可补齐自己换班记录的双方班次（R2-3 语义），
管理者侧不受影响（R2-4 前半）。
