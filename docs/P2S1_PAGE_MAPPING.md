# P2-S1-A · 排班 16 页 KEEP / MERGE / REDIRECT / RETIRE 映射

> 2026-10-07 · 依据：P2-S1-A 授权 + 排班审计 e77ddad + Authority Contract
> 原则：入口数据源全部收敛到 schedules SSOT + 6 个 command；旧模型主链不再"换皮活着"。

## 映射总表

| 页面 | 处置 | 依据 / 本轮动作 |
|---|---|---|
| packageB/scheduling（我的班次） | **KEEP**（唯一员工看班入口） | 数据源 employee_shifts → **schedules published**（RLS 隔离 legacy/他人）；统计同批推导 |
| packageB/shift-swap（换班申请） | **KEEP** | mock 目标归零 → 同店真实候选（00130 可见性）+ `request_schedule_swap`，服务端拒绝原因透出 |
| packageB/swap-records（换班记录） | **KEEP**（并入审批职能） | 班次详情来自真实 schedules；新增**管理者审批**（`review_schedule_swap` 通过/拒绝）与员工撤回（`cancel_schedule_swap`）——补上此前全仓缺失的审批入口 |
| packageB/schedules（排班列表） | **KEEP** | 编辑死链（packageC）修复；删除按钮 → `cancel_schedule`（物理删除 DB 已封死）；默认过滤 legacy；新增 published 状态色 |
| packageB/schedule-form（创建/编辑） | **KEEP** | 提交切 `publish_schedule` / `update_schedule`；日期时间改原生 Picker（消灭自由文本）；编辑模式锁定不可变字段（员工/日期） |
| packageB/schedule-planning（排班规划） | **KEEP**（待 S1-B 重构） | 保存循环直写 pending（已被 DB 封死）→ 逐员工 `publish_schedule`，汇总「发布 X · 冲突跳过 Y · 失败明细」 |
| packageB/schedule-center（排班中心） | **KEEP** | 月度排班卡片撤下，换上**换班审批**入口 |
| packageB/work-shifts（班次字典） | **KEEP** | work_shifts 配置表与 schedules 权威无关，不动 |
| packageB/schedule-logs（排班日志） | **KEEP** | 读 schedule_results 规划层（非事实层），不涉权威写入；S1-B 再治理其失效筛选 |
| packageA/schedule-config（排班配置列表） | **KEEP**（低优先） | work_schedule_configs 平行配置体系；不涉 schedules 权威；S1-B 评估是否并入规划层 |
| packageA/schedule-config-create | **KEEP**（低优先） | 同上 |
| packageG/my-schedule（我的班次·月历平行实现） | **REDIRECT** | 转重定向壳 → packageB/scheduling；role-modules 与员工工作台入口同步改指唯一入口 |
| packageB/monthly-schedule（月度生成） | **RETIRE（退出导航）** | 参数全写死、结果不落库、无事实来源；home 宫格改指排班列表、排班中心卡片撤下；页面文件保留不再可达 |
| packageB/schedule-history（历史班次） | **RETIRE** | 孤儿页（入口只弹"开发中"），读 work_schedule_records 旧模型；不再接入口 |
| packageB/schedule-log-form | **RETIRE** | 孤儿页（零入口），数据源与 schedule-logs 不同表 |
| packageB/schedule-optimization | **RETIRE（退出导航，待 S1-B 复核）** | 纯本地计算不落库；本轮仅登记（排班中心仍有入口，S1-B 与规划页合并时一并处置） |

另修：operation-adjustment 指向不存在 packageC 的死链 → packageB 真实路径。

## Cutover 对照（S1-1…S1-9 口径）

```text
S1-1 员工我的班次     = scheduling 读 schedules published（RLS：own + store；legacy 0 exposure）
S1-2 管理者发布       = schedule-form / schedule-planning → publish_schedule RPC（直写已无路径）
S1-3 更新/取消        = schedule-form 编辑 / schedules 列表 → update_schedule / cancel_schedule RPC
S1-4 换班             = shift-swap 真实候选 → request → swap-records 审批(review) → 交换/回滚
                       员工撤回 → cancel_schedule_swap（00129，D5 矩阵闭合）
S1-5 通知路由         = schedule 类通知 → 我的班次 / 换班（含审批）上下文
S1-9 旧导航           = packageC 死链修复；monthly-schedule/schedule-history/schedule-log-form 退出可达路径；
                       employee_shifts / work_schedule_records 无任何 UI 读取路径
```

## 伴随 DB 变更（migration）

```text
00129 cancel_schedule_swap   第 6 个 command：员工撤回自己的 pending（D5）
00130 同店 published 可见性   换班真实候选的数据前提（仅 published、仅本店、legacy 仍不可见）
```

## 交接给 S1-B（UI Redesign）的事项

- scheduling / shift-swap / swap-records / schedule-form / schedule-planning 五页按 DS（TabHero/StatsStrip/
  ErrorBanner/PullList/Form）重设计；本轮仅功能 cutover 未动视觉
- schedule-planning 2057 行重构（含"发布给 X 名员工 / 成功 / 失败"结果页）
- 审批卡片视觉化（张三 10:00-14:00 ⇅ 李四 17:00-21:00 + 服务端冲突结论）
- role-modules 中 scheduling-management 误指员工页的配置纠偏
- schedule-optimization 与规划页合并评估；schedule-logs 筛选失效修复
