# P2-S0-B-R1 · 跨日冲突 + Swap 语义 + day-off 不变量 证据包

> 2026-10-07 · 依据：P2-S0-B = HOLD-R1 裁定（三 blocker + 两小口子）
> Migration：`00128_p2s0_b_r1_crossday_swap_semantics.sql`（追加最小修复，未重写 00127 / 未动已 PASS 结构）

## 修复内容（对应裁定编号）

```text
B-R1-1  冲突引擎 v2：统一绝对分钟区间（相对 p_date），查询窗口 ±1 天，
        跨午夜班（end≤start +1440）自然覆盖"前日班侵入当日"与"当日晚班侵入次日"
        锁：publish/update 改员工级 advisory lock；swap 双员工按 UUID 序（LEAST→GREATEST）加锁防死锁
B-R1-2  swap exclude 互换：查 target 接 requester 班 → 排除 target 换出的班（ts.id）；
        查 requester 接 target 班 → 排除 requester 换出的班（rs.id）
B-R1-3  update_schedule work↔day_off 归一：
        切 day_off → 强制 start/end=NULL · shift_type='day_off'
        切回工作班 → 必须显式提供起止时间（缺省 DENY）· meal_period/rest_hours 清空 · day_off→regular
B-R1-4  meal_periods 精确本店优先：(store_id = p_store) DESC NULLS LAST → 租户默认(IS NULL) → 无配置保守全天；
        WHERE 排除他店配置（不再可能取到另一门店窗口）
B-R1-5  REVOKE CREATE ON SCHEMA public/private FROM scheduling_authority_owner（施工权限回收）
```

## 应用过程一处修正（如实登记）

首放后 P6 证明暴露：Postgres `ORDER BY boolean DESC` 默认 **NULLS FIRST**，
租户默认行（store_id IS NULL → 表达式 NULL）反而压过本店覆盖 → 补 `NULLS LAST` 后全绿。
该修正是 B-R1-4 语义的正确实现，已折入 migration 文件（文件内 3 处 NULLS LAST）。

## 证明（8/8 PASS，真实 JWT，g0bb 测试租户）

```text
PASS P1  2099-01-20 22:00-02:00 + 01-21 01:00-04:00 → DENY（跨午夜侵入检测，裁定原文场景）
PASS P2  2099-01-20 22:00-02:00 + 01-21 02:00-05:00 → ALLOW（跨日端点相接）
PASS P3  两员工同日同时间（09:00-17:00）互换 → ALLOW + 原子交换完成（exclude 换出班修正生效）
PASS P4  swap 致真实第三方冲突（empB 预置 11-13 与换入 10-14 重叠）→ DENY(CONFLICT)
         · request 仍 pending · 班未换 · 0 新通知（整体回滚）
PASS P5  work→all_day：update 后 start/end=NULL · shift_type=day_off · meal_period=all_day；
         切回工作班未提供时间 → DENY(INVALID)；带 10:00-14:00 → 成功且 meal_period 已清空
PASS P6  本店餐段窗优先：本店覆盖 18:00-20:00 + 租户默认 17:00-21:30 并存时
         19:00-19:30 → DENY（本店窗内）；20:05-21:20（租户窗内/本店窗外）→ ALLOW
         —— ALLOW 即证明本店配置被采用（若用租户窗必 DENY）
PASS P7  has_schema_privilege(owner, public/private, CREATE) = false/false
PASS TERM 终态 = schedules 301×legacy · swap 0 · schedule 通知 0（测试数据零残留）
```

完整日志：`g0-closing-run/p2s0-b-r1-proofs.log`。

## 未动项

- 00127 已 PASS 结构（五 command 架构 / RLS / FK / B6 并发语义）未重写
- B6 同日并发未重证（裁定已独立复验 PASS；员工级锁严格粗于原锁，安全性只增不减）
- B 证据文档 ACL 措辞已按裁定修正（owner + authenticated + service_role，无 PUBLIC/anon）
