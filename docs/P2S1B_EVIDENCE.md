# P2-S1-B · 五页 DS 重设计证据包（含 S1-10 真实 UI 走查）

> 2026-10-07 · 依据：P2-S1-B 授权（五页冻结流 + B1-B10 终验）
> typecheck 0 错 · biome 触及文件 0 error · H5 build exit 0（56.6s）
> S1-10：**headed 可见浏览器 + trusted 点击，12/12 PASS，零 RPC 兜底**

## 五页重设计（按角色旅途，非逐页美化）

| 页面 | 旅途任务 | 结构 |
|---|---|---|
| scheduling | 我今天几点上班→下一班→本周→换班入口 | 今日班次 Hero（工作橙/排休绿/未排班三态）→ 下一班卡 → 本周七日条（含多段班）→ 双入口 |
| shift-swap | 三步：我的班→同事班→原因确认 | 步骤指示条 + 选中即现「我的 ⇅ 交换」对照卡；候选走 purpose-built RPC |
| swap-records | 审批直呈结论 | StatsStrip 四统计 + 筛选；审批卡「张三 10:00–14:00 ⇅ 李四 17:00–21:00」；服务端冲突原因内联于卡（danger 区），非 toast 完事 |
| schedule-form | 谁→哪天→什么班段→备注→发布 | 工作班/排休切换；班段类型自动带时间（显式可选改）；冲突错误映射到时间字段旁；编辑模式锁定身份/日期；发布前摘要条 |
| schedule-planning | 经营需求→人数→人→每人班段→发布 | 五步卡；员工 chips 多选；**每人显式班段**（统一应用=用户显式动作；无任何隐含默认时间）；逐人发布结果 成功/冲突明细 |

DS 复用：TabHero ×5、StatsStrip ×1（swap-records）、ErrorBanner ×3、Field ×4、tokens（primary/success/warning/danger/info）与 iconify 全量；无 blue-/indigo- 直写、无 emoji 图标。

## S1-10 真实 UI 走查（12/12，g0bb 测试租户，双会话真实点击）

```
PASS W1  管理 UI 创建排班（schedule-form：默认员工+班段确认带时间）→ published 事实
PASS W2  管理 UI 排班规划页发布（chips 选人 + 统一班段 + 逐人结果）→ published 事实
PASS W3  管理 UI 修改（编辑模式锁不可变字段，备注变更）→ update_schedule 生效
PASS W4  员工「我的班次」今日班次 Hero + 本周排班
PASS W5  换班 1→2：选中我的班，候选出现同事班（真实候选 RPC）
PASS W6  员工三步发起换班 → pending
PASS W7  审批卡直呈双方对照（待审批）
PASS W8  管理真实点击「通过并交换」→ modal 确认 → approved
PASS W9  交换生效（A行→B · B行→A）+ 员工页刷新可见
PASS W10 换班结果通知 ≥2（双方）
PASS W11 管理 UI 列表页「取消发布」→ cancelled 轨迹
PASS TERM 终态 301 legacy / 0 swap / 0 schedule 通知（零残留）
```

截图 15 张（`g0-closing-run/screenshots-p2s1b/`：表单空/填、规划、规划结果、编辑、员工看班前后、换班三步、审批卡/弹窗/通过、列表、取消弹窗）；完整日志 run.log。

## B1–B10 对照

```
B1 五页视觉一致    = TabHero 头 + 白卡 + 灰底统一；主色/功能色全 token（截图佐证）
B2 DS 真实复用    = TabHero×5 / StatsStrip / ErrorBanner / Field / tokens（import 可查）
B3 状态完整       = 骨架（scheduling/shift-swap）、空态（每页含引导文案）、ErrorBanner+重试、
                    成功 toast+后续（发布→返回/审批→刷新）
B4 表单校验防重   = inline 字段错误（日期/时间/员工）+ 服务端 CONFLICT 贴字段；提交按钮
                    loading/置灰防重（publishing/submitting/acting）
B5 角色语境       = 员工页仅自己+同店候选；审批按钮仅非本人 pending；权威在 DB 不变
B6 无 raw 色/emoji = 五页 0 处 blue-/indigo-/purple- 直写；图标全 iconify
B7 无旧 authority = 全部读写经 6 command + 2 purpose-built RPC；schedules 无直写路径
B8 布局稳定       = 390×844 @2x 全程截图；滚动/弹层正常
B9 真数据截图     = 15 张（见上）
B10 S1-10 走查    = 12/12 真实点击（本节）
```

## 走查过程修复的四个真实缺陷（全部登记）

1. **Taro API 按需打包裁剪**：`Taro.showToast` 默认导入在部分页面 chunk 运行时 undefined
   （捕获块自崩掩盖真实错误）→ 五页全部改具名导入（showToast/showModal/navigateTo/navigateBack）
2. **复合 FK 嵌入歧义回归（00125 的运行时影响，S1-A 静态检查未覆盖）**：
   schedules↔employees/stores 双 FK 使 `employees(name)` embed 触发 PGRST201 →
   getScheduleById / getSchedulesByTenantId 静默返回空 → 编辑页"班次不存在"、列表空。
   修复：`!约束名` 消歧（schedule.ts 3 处）
3. **planning 门店闭包陈旧**：setState 后同闭包读旧值提前 return（员工列表永不加载）→ 局部变量承接
4. **会话整页重载清空 zustand 租户/门店上下文**（bridge/路由交互触发）→ planning 增加默认门店
   解析（同步全局）；走查在依赖全局态的页面前经 tenant-select 重建上下文（真实登录流等价路径）

另：测试基建修正——bridge-master.html 为自登录版（硬编码 emp.a），`?t=` 参数被无视，
曾致"管理会话"实为员工；本轮新增 bridge-param.html（参数注入）并全链路复用。

## 登记事项

- 旧 planning 的 排休弹窗/兼职/效能区间/规划落库（schedule_results/daily_operations）不再由本页承担：
  排休走「创建排班-排休」；兼职（part_time_shifts 旧模型）与规划产物链路（schedule-logs 数据源）
  待后续裁定，本页发布即事实
- schedule-form 常用班段快捷时间（早/中/晚/全天）为**显式选择后自动带出、可见可改**，
  非隐含默认；自定义可全手动
