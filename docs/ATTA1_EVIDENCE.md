# ATT-A1 · Data Foundation 证据包

> 2026-10-07 · 依据：ATTENDANCE AUTHORITY CONTRACT + Amendment 1（FROZEN）授权
> Migration：`00140_att_a1_data_foundation.sql`（已应用于 live DB，含分段续跑与两处实现期修正，见下）
> 证明：F1–F7 = **24/24 PASS**（真实 JWT + Management API）· Security Advisor = 0 ERROR，A1 相关 3 WARN 均为预期类别

## 落地内容（对照五刀）

```text
A1-1 stores.timezone          TEXT NOT NULL DEFAULT 'Asia/Shanghai'；存量 26 店全部回填；
                              CHECK ((now() AT TIME ZONE timezone) IS NOT NULL)——无效 IANA
                              使 cast 抛错 → DENY（比正则更权威的真伪校验）
A1-2 work_attendance 重建     表 0 行无包袱：直接按合同语义重建；
                              UNIQUE(schedule_id)；UNIQUE(employee_id,date) 随重建消灭
A1-3 planned snapshot 列      schedule_id/tenant/store/employee/business_date/
                              planned_start_at/planned_end_at NOT NULL；
                              snapshot_sane（end>start）+ clock_sane（out>in 若都在）
                              三个复合 FK（schedule/stores(id,tenant)/employees(id,tenant,store)）
A1-4 RLS baseline             3 条 SELECT policy（own / managed_stores / tenant_admin，
                              复用排班域 private.sched_* + 新 private.att_my_employee_ids
                              definer helper）；无任何 INSERT/UPDATE/DELETE policy；
                              REVOKE SELECT FROM anon（GraphQL 暴露收口）
A1-5 schedule freeze guard    trg_att_schedule_freeze（BEFORE UPDATE ON schedules）：
                              attendance 存在 ⇒ 8 个语义字段 UPDATE → 'FROZEN' 异常；
                              notes 不受限；未开考班不受限；**service 角色与排班 RPC
                              同样被兜底**（F6-6 实测 cancel_schedule 对已开考班 DENY）
A4  immutable trigger         trg_att_immutable_snapshot：identity/planned 7 列
                              UPDATE → 'IMMUTABLE' 异常（含 service 层，correction 也不可改）
```

## 证明矩阵（24/24）

```text
F1-1 存量门店 100% Asia/Shanghai                    F1-2 NULL → DENY(23502)
F1-3 'Not/AZone!' → DENY（cast 抛错）               F1-4 'Asia/Tokyo' → ALLOW
F2-1 同员工同日 2 个 schedule → 2 attendance ALLOW   F2-2 同 schedule 二插 → DENY(23505)
F3-1 emp INSERT → 403                               F3-2 emp UPDATE → 0 行
F3-3 emp DELETE → 0 行                              F3-4 admin INSERT → 403
F3-5 admin UPDATE → 0 行
F4-1 emp SELECT 自己 2 条（他人行不可见）            F4-2 tenant_admin(A) 本租户 ALLOW
F4-3 tenant_admin(B) 跨租户 → 0 行
F5-1 planned_start_at 篡改 → IMMUTABLE DENY          F5-2 employee_id 篡改 → DENY
F6-1 已开考班改 start_time → FROZEN                  F6-2 改 status(cancel) → FROZEN
F6-3 换员工 → FROZEN                                 F6-4 改 notes → ALLOW
F6-5 未开考班时间可改（guard 仅限已开考）            F6-6 cancel_schedule RPC → FROZEN DENY
F7-1 work_attendance 0 行零残留                      F7-2 schedules 301 legacy 不变
```

完整日志：`g0-closing-run/att-a1-proofs.log`。

## Security Advisor

```text
total 390 · ERROR 0
A1 相关 3 WARN：
  pg_graphql_authenticated_table_exposed（work_attendance 对 authenticated 经 GraphQL 可见——
    与 schedules 等既有表同类别；表有 RLS+SELECT-only，与排班域一致口径，非新增暴露面）
  authenticated_security_definer_function_executable ×2（att_my_employee_ids + guard 函数——
    与排班 sched_* 同款预期 WARN；guard 为表 trigger 调用（postgres owner），helper 仅
    authenticated EXECUTE，均无 anon/PUBLIC）
处置：anon SELECT on work_attendance 已 REVOKE（migration 内固化）→ anon 暴露 WARN 消除
```

## 应用过程登记（如实）

1. migration 经 mgmt-exec 分段续跑（正则含 `$` 触发切分器断句 → IANA 校验改为
   `AT TIME ZONE` cast 单条件；复合 UNIQUE 与 00125 重复 DROP 被 FK 依赖拒绝 → 去重直接引用；
   guard trigger 函数保留 postgres owner（表 trigger 内部调用，不对外暴露）；
   补 updated_at 通用 trigger）——**migration 文件已按最终生效形态修回**，与 live 一致
2. 证明脚本一次实现期修复：pub helper 曾重复调用 publish RPC（第二次必 CONFLICT），已修

## 未做（按裁定纪律）

- 未创建任何 attendance command（clock_in/out/correct = A2/A3）
- 未做 legacy 兼容层（表原 0 行，无历史包袱）
- UI 零改动；schedules 域 authority/conflict/permission contract 未动
  （freeze guard 是 Amendment A5 授权的唯一窄豁免，且为纯增量 trigger）
