# WORK_RECORD AUTHORITY CONTRACT v0.1

> 2026-10-11 · 依据：工作记录审计 + 排班/考勤域已建立的模式
> 性质：事实合同，不含 UI 设计。

## 1. SSOT（AD-1）

```text
work_records = 工作记录事实 SSOT（现役、有 UI、有 category FK）
work_logs / work_ratings = LEGACY / RETIRE（V3.17 旧排班日志，0 行，绑旧表）
simple_work_records = RETIRE（表未建，代码死路径）
```

## 2. 事实语义

一条 work_records = 员工的一条工作记录事实（含文字+图片/视频 URL）。
与排班/考勤的关联为**展示层 join**（同 employee + 日期区间），不强制 FK（员工可记非排班时段的工作）。

## 3. 写入权威（AD-7）

```text
authenticated 直写 work_records = 保留（员工自写自删，低风险域）
tenant 隔离 = RLS 补 tenant_id 条件（员工和管理员策略均补）
DELETE = 员工删自己的（已补策略）；管理员不删（历史事实不删）
```

不迁移 command RPC：工作记录是员工自述事实（无冲突裁决/无并发竞争/无跨域一致性），
直写+RLS 足够（与排班/考勤的本质差异：那些是"组织事实"需要权威裁决）。

## 4. 管理者链路（AD-4）

本期仅实现：管理者查看本租户员工记录（RLS 已补 tenant 隔离）。
评价（work_ratings）、统计排行 = HOLD（旧表 RETIRE 后待产品决策）。

## 5. 死代码处置（AD-10）

```text
RETIRE: pages/work-log/add(502行) + detail(290行) —— 从 app.config 摘除
RETIRE: api-work-log.ts 11 个死函数 —— 删除
RETIRE: api-work-records.ts + packageG/work-log-create —— 删除（目标表不存在）
RETIRE: work_logs / work_ratings 表 —— 不动（0 行无风险，避免 DDL 波动）
FIX:   role-modules 死链 /pages/work-logs → /pages/work-log（已修）
```

## 6. 证明

```text
W1 员工创建自己的记录 → ALLOW（tenant 正确）
W2 员工删除自己的记录 → ALLOW（新增 DELETE 策略）
W3 跨租户管理员 SELECT → 0 行（tenant 隔离）
W4 is_user_admin 不再抛错（已修，00145）
W5 管理者看本租户记录 → ALLOW
W6 terminal: work_records 测试数据零残留
```
