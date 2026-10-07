# P2-S1-A · Scheduling Journey Cutover 证据包

> 2026-10-07 · 依据：P2-S1-A 授权（cutover 先行，不做视觉装修）
> 页面映射：`docs/P2S1_PAGE_MAPPING.md` · Migrations：00129 / 00130 · 构建 build5.log（52.9s，exit 0）

## Cutover 完成度（对照 S1-1…S1-9）

```text
S1-1 员工我的班次   scheduling 数据源 employee_shifts → schedules published
                    （RLS own+store 双策略；legacy 0 exposure；统计同批推导）
S1-2 管理者发布     schedule-form / schedule-planning → publish_schedule RPC
                    （日期/时间改原生 Picker；直写路径在代码与 DB 双重不存在）
S1-3 更新/取消      schedule-form 编辑 → update_schedule；schedules 列表 → cancel_schedule
                    （原 deleteSchedule 直删已不可能：无 DELETE policy）
S1-4 换班           shift-swap mock 归零 → 同店真实候选 + request_schedule_swap；
                    swap-records 补上全仓缺失的审批入口（review_schedule_swap）+ 员工撤回
                    （cancel_schedule_swap，00129，D5 矩阵「撤回自己的 pending」闭合）
S1-5 通知路由       schedule 类通知 → 我的班次；含「换班」→ 换班记录/审批页
S1-6/7 状态与表单   提交按钮 loading/disabled 防重；服务端拒绝原因透出（CONFLICT/INVALID
                    原文 toast）；本轮为功能 cutover，Loading/Empty 视觉归 S1-B
S1-8 角色语境       员工页只见自己与同店候选；审批按钮仅对非本人 pending 出现；
                    权威全在 DB（RLS + command），UI 只解释
S1-9 旧导航         packageC 死链修复；monthly-schedule/schedule-history/schedule-log-form
                    退出可达路径；packageG/my-schedule 转重定向壳；employee_shifts /
                    work_schedule_records 无任何 UI 读取路径（grep 复核）
```

## 运行时冒烟（真实 H5 + 真实会话，8/8 PASS）

日志 `g0-closing-run/screenshots-p2s1a/run.log`，截图同目录：

```text
PASS SM1  command 发布 empA 09-13 / empB 15-19（目标日 10-09）
PASS SM2  员工「我的班次」H5 渲染（schedules 数据源，含交换前班次）
PASS SM3  员工页内发起 request_schedule_swap → pending
PASS SM4  管理者换班审批页渲染真实 pending（双方姓名/班次时间/原因——sm4 截图视觉核验）
PASS SM5  审批 approved（UI 渲染已证 + RPC 兜底，见下「已知限制」）
PASS SM6  交换生效（A行→empB · B行→empA）+ 状态 approved + 结果通知 ≥1
PASS SM7  员工页交换后截图留存
PASS TERM 终态 301 legacy / swap 0 / schedule 通知 0（测试数据零残留）
```

## 伴随 DB 变更

```text
00129 cancel_schedule_swap   第 6 个 command（员工撤回自己的 pending；owner/ACL 同纪律，
                             CREATE 施权限即用即撤）
00130 同店 published 可见性   private.sched_my_store_ids + schedules_select_store_published
                             （仅 published · 仅本店 · legacy 仍不可见）——换班真实候选的数据前提
```

## 已知限制（如实登记，交接 S1-10 终验）

1. **UI 按钮点击自动化受限**：headless Playwright 对 Taro H5 的点击 actionability 被滚动容器/自定义元素
   拦截（locator 可见性判定超时），SM5 的「通过并交换」按钮点击无法稳定自动化 → 冒烟以 RPC 兜底闭合业务
   结果；按钮 onClick → review_schedule_swap 的代码路径与 SM3 页内请求同构。
   按 P2-S1 裁定，真实 publish/update/cancel/swap 走查本就是 **S1-10 终验 Gate**（S1-B 重设计后），
   届时以真机/可见浏览器完成。
2. schedule-planning / schedules 等页存在**遗留** biome 错误（noExplicitAny ×8 等，均为未重写旧代码行）；
   本轮新增代码 0 error（cutover 涉及的重写文件已清零 + 格式化）；遗留项随 S1-B 整页重设计消亡。

## 提交边界

UI 变更 = 功能 cutover（数据源/命令/入口/路由），无视觉重设计、无 DS 组件引入（留 S1-B）、
未触碰 301 legacy / NOT VALID FK / P2-S0 冻结结构 / Journey V4 / 长尾 250 页。
