# ATT-A1-R1 · Hardening 证据包

> 2026-10-07 · 依据：ATT-A1 = HOLD-R1 裁定（四项）
> Migration：`00141_att_a1_r1_hardening.sql`（live delta）+ `00140` 重写为 canonical baseline
> 证明：R1-1…R1-6 = **6/6 PASS**（含裁定补打过的 store_manager 矩阵不重跑）

## 四项处置

```text
R1-1 00140 canonical 重写   单一语义可重放：无重复块/孤立片段；stores_timezone_valid
                            = 正则 + AT TIME ZONE（与 live 一致）；含
                            update_work_attendance_updated_at trigger；FK=RESTRICT；
                            guard 全角色 REVOKE —— 文件级断言全过（R1-5）
R1-2 live hardening(00141)  guard 函数 EXECUTE：PUBLIC/anon/authenticated/service_role
                            全部 false（owner 保留）；schedule FK CASCADE→RESTRICT
R1-3 孤儿通知清理           11 条 proof orphan（明确 ID 列表删除，非模糊匹配）+ 后续
                            R1 证明过程产生的通知一并按 ID 清理
R1-4 证据措辞修正           「guard 不对外暴露」→ 修正为「DB internal：全角色 EXECUTE
                            false」；「cast-only 校验」→ 修正为「正则 + AT TIME ZONE」
```

## 证明（6/6）

```text
PASS R1-1  has_function_privilege(anon/authenticated/service_role/public, att_guard_*) = false ×2×4
PASS R1-2  Security Advisor：att_guard_* 相关 finding = 0（原 2 条 WARN 消失）
PASS R1-3  attendance 存在 → schedule 物理 DELETE → 23503 RESTRICT DENY；
           schedule 留存 1 · attendance 留存 1（考勤事实不再被级联抹掉）
PASS R1-4  已开考班 start_time 改写 → FROZEN DENY 仍生效；notes 改写 → ALLOW
PASS R1-5  00140 canonical：dropTable×1 · updated_at trigger ✓ · 正则+cast 约束 ✓ ·
           RESTRICT ✓ · guard REVOKE ✓ · 无 LIKE 残片
PASS R1-6  terminal = work_attendance 0 · schedules 301 legacy · schedule 通知 0
```

日志：`g0-closing-run/att-a1-r1-proofs.log`（副本入库 `docs/evidence/att-a1/att-a1-r1-proofs.txt`）。

## 上轮 F1-F7 证据的措辞更正（R1-4 要求）

- ~~"guard trigger 函数：postgres owner（表 trigger 调用，不对外暴露）"~~
  → 事实：当时 authenticated/service_role EXECUTE=true（Advisor 2 条 WARN）；
    00141 后全角色 false，DB internal。
- ~~"IANA 以 AT TIME ZONE cast 真伪校验"~~
  → 事实：live 约束为 正则格式 + AT TIME ZONE 真伪 双条件；canonical 00140 已一致。
- F7 首轮"零残留"不成立：publish_schedule 产生的 11 条通知未随 schedule 清理
  （proof 脚本只删了 schedules）；已按明确 ID 清除并登记。root cause：证明脚本的
  cleanup 清单遗漏 notifications——本轮起 proof cleanup 同时清通知。

## 账面澄清

产品实现 SHA = `06f5b99`（migration+evidence）；`d3936b9` = evidence carrier（proofs.txt）。
本轮 R1 实现 = `00141` + `00140` 重写（下一 commit）。
