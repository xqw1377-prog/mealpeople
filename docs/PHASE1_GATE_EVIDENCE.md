# Frontend V2 · Phase 1 Gate 证据包（P1-E 运行时证据版，2026-10-07）

> 本版为 SYNC PREVIEW 授权后的运行时证据收口。P1-C 版修订了静态口径；本版补齐真实构建、
> 四 Tab 真实截图与 >20 条分页验证，并如实披露预览过程中发现并修复的 H5 运行时缺陷（fee8598）。

## 检查口径（按裁定更正）

```
TYPE CHECK      = PASS   （tsgo -p tsconfig.check.json 全仓 0 错误）
STATIC CHECK    = PASS   （biome：本提交涉及文件 0 error；仓库存量 7 条无关旧文件错误）
RUNTIME BUILD   = PASS   （本地 npx taro build --type h5，基准 fee8598，BUILD_EXIT:0）
RUNTIME PREVIEW = PASS   （Playwright 无头浏览器 + 本地 HTTP 预览 + 真实 Supabase 会话）
```

## 8 条 Gate 当前状态

### G1 视觉同源 = PASS（P1-E 截图佐证）
四 Tab 结构语言统一（TabHero + StatsStrip + 白卡 + 灰底），截图证据见 G8；
本地像素核验：四 Tab 顶带均为品牌橙（primary-500 系），无手写杂色头。

### G2 色彩 token = PASS
四页 `blue-/purple-/indigo-` 视觉类直写 = 0；全部经 primary/success/warning/danger/info token。

### G3 DS 复用 = PASS（P1-C 修复）
- 新增 `TabHero` / `StatsStrip` / `ErrorBanner`（TabShell.tsx）收敛手写模式
- **4/4 Tab 真实 import DS**：index(TabHero+StatsStrip+ErrorBanner)、work-log(TabHero+StatsStrip+PullList)、
  growth(TabHero+StatsStrip+ErrorBanner)、profile(TabHero+ErrorBanner)
- 手写 Hero 残留检查：`bg-primary-500 px-4 pt-` 出现次数 = **0**
- PullList 内部错误态/骨架/空态集中维护

### G4 状态完整 = PASS（P1-C 修复）
- **PullList 独立 error 态**：首屏失败 → 可见错误视图 + 重试按钮；翻页失败 → 保留内容 + 轻提示；
  空态判定增加 `error === null` 前置条件（错误绝不再落入空态）
- **index**：loadError + ErrorBanner（可见 + 重试）
- **profile**：loadError + ErrorBanner（可见 + 重试）
- **growth**：既有错误视图改用 ErrorBanner（Hero + 横幅 + 重试）

### G5 路由 parity = PASS（d618916 → P1-C 后复核）
```
BEFORE = 25 | AFTER = 25
唯一差异 = /packageB/pages/home/index → /pages/index/index（坏路由修复，非能力删减）
```

### G6 图标 = PASS
重写区域 100% iconify。

### G7 复杂度 = PASS（P1-D 后实文件统计）
```
index    291 行（原 456）
work-log 315 行（原 385）—— P1-D 第4项 base 状态拆分（骨架/Error/无租户/无档案四态）增加约 37 行
growth   272 行（原 366）
profile  288 行（原 332）
```
work-log 因 G4 要求的四态拆分增至 315（>300，如实登记）；其余三页 < 300。
（注：历史版本报告的 226/237/259/174 与 291/278/278/287 分别为 biome 前与 P1-C 统计，均以本版为准。）

### G8 Build + 截图 = PASS（P1-E 运行时证据，三组）

**第一组 · 真实构建**
```
基准        = fee8598（= d1deb50 + H5 请求适配修复，见下方 P1-E 披露）
命令        = npx taro build --type h5
结果        = ✓ built in 1m 36s，BUILD_EXIT:0（完整日志 g0-closing-run/executor/build2.log）
预览        = 本地 HTTP 服务 dist/，Playwright 加载 http://127.0.0.1:4200 成功渲染
```

**第二组 · 四 Tab 真实截图**（`g0-closing-run/screenshots/`，780×1688 @2x，md5 见 run-v3.log）
| 文件 | 内容核验（DOM 断言 + 视觉转录双确认） |
|---|---|
| 01-workbench.png | 「夜深了，G0分页验证员 / 10月7日 周三 · G0黑盒租户A」问候 Hero + 三项状态条（待查询/未打卡/去开始）+ 8 宫格（工作记录/考勤打卡/我的班次/请假申请/我的入职/我的培训/我的绩效/我的薪酬）+ TabBar 高亮工作台 |
| 02-work-log.png | 「工作记录 / 随手记录，看见成长」Hero + 统计条 **今日 2 / 本周 25 / 本月 25**（独立 count 查询，自然周/月口径）+ 记录列表首屏（DOM 计 20 条 = 第 1 页） |
| 02-work-log-scrolled.png | 滚动后可见 **#19–#25**（#21+ 为第 2 页触底加载项）+ 「— 已经到底啦 —」结束标记 |
| 03-growth.png | 「我的成长 / 培训发展与职业成长」Hero + 等级卡（初级服务员，0/100）+ 学习统计（0/0/0）+ 完成率卡 + 认证空态 + 学习中心入口，TabBar 高亮我的成长 |
| 04-profile.png | 「我的 / 账号与设置」Hero + 用户卡（G0分页验证员 · 员工 · G0黑盒租户A）+ 菜单（快速开始/帮助中心/关于我们/配置中心）+ 退出登录，TabBar 高亮我的 |

采集方式：Playwright 无头 Chromium（iPhone 14 视口），bridge 页注入真实密码会话（g0bb.emp.a 测试账号），
经 tenant-select 自动选择租户后逐 Tab hash 导航（避免整页 reload 清空内存态租户 store）。
每张截图前有 DOM innerText 断言（内容不满足不拍），采集后 md5 去重校验（v1 两张因断言缺失导致重复，已废弃）。

**第三组 · WorkLog > 20 条分页专项**
```
数据        = work_records 25 条（P1分页验证 #01–#25，测试租户 g0bb 测试员工，非生产数据）
API 层      = PostgREST Range 头：PAGE1 206 content-range: 0-19/25（20 行）
              PAGE2 200 content-range: 20-24/*（5 行，首条 P1分页验证 #21）
UI 层       = 首屏 DOM 20 条 → 鼠标滚轮触底 → #21 可见、累计 25 条 → 「已经到底啦」
              （PullList 触底分页 + finished 判定 + 结束标记，D-3 布局修复的运行时证明）
```

## P1-E 运行时缺陷披露（SYNC PREVIEW 过程中发现并修复）

**事实**：d1deb50 的 H5 包存在全部数据查询静默失败的运行时缺陷。即此前若直接签 PREVIEW=LOADABLE 将是
不实结论；本缺陷由本次预览取证流程发现。

```
现象     采集 v2 截图时 tenant-select 报「未获取到用户数据」；全网络追踪 = 0 个 Supabase 请求
根因     customFetch 经 Taro.request 适配，但 Taro H5 按需打包的运行时不包含 request API，
         调用抛 TypeError: _.request is not a function；supabase-js 捕获后返回 null，
         getUser()/全部 PostgREST 查询静默失败（无 toast、无 console.error 主流程可见）
定位     Playwright console/pageerror 全量捕获 → 精确堆栈 → 复现于 common chunk
修复     fee8598：src/client/supabase.ts 单文件 6 行 —— TARO_ENV=h5 时 customFetch 直接走
         浏览器原生 fetch；小程序分支 Taro.request 原样保留（无 UI/交互改动）
复验     重新构建（BUILD_EXIT:0）→ v3 采集全部断言通过 → 上述三组证据均产自修复后的包
```

**构建基准说明（如实登记）**：fee8598 之上工作区另有 24 文件（69+/51-）的 P1-C/P1-D 期间 biome
safe-fix 未提交存量（未用参数 `_` 前缀、可选链等，涉及 db 模块与 packageA/B/D/H 页面，另含
help-center 1 行 useCallback 依赖修复）。该存量在 d1deb50 证据构建与本次重建中均同样存在，
两次构建基准一致；未在本次顺手提交或改动（遵守"不顺手大改"裁定）。

## 截图证据核验方法（三重独立）
1. **DOM 断言**（采集时）：innerText 含预期内容且不含「请先选择企业」引导态才允许截图
2. **本地像素核验**（不经任何云端）：Chromium canvas 解码 PNG，四 Tab 顶部色带 84–97% 品牌橙像素，
   对照组（无 Hero 页面）0%；01 与 02-scrolled 像素分布可区分
3. **视觉模型转录**（JPEG 重编码后独立 URL）：逐字转录与 DOM 断言文本一致（问候语/统计数字/条目编号）

## P1-C 变更明细（相对 dbca090）

```
P1-1  work-log 统计改为独立 count 查询（head-only，tenant+employee+日期范围三联），失败显示 '-' 不再误导
P1-2  PullList 增加 error 独立态 + retry；index/profile 增加 ErrorBanner；growth 改用 ErrorBanner
P1-3  新增 TabShell（TabHero/StatsStrip/ErrorBanner）；四 Tab 全部真实 import DS；手写 Hero 清零
P1-4  本证据文件事实口径修订（行数、Build 措辞）
NESTED-SCROLL  work-log 去除嵌套纵向滚动（PullList 独占 flex-1 区域）
```

## P1-D 变更明细（相对 9189cb4，仅六项）

```
D-1  count 查询显式检查 Supabase error（{count, error} + throw），失败走 catch → '-'
D-2  统计口径改自然周/自然月：今日=当天00:00 / 本周=本周一00:00 / 本月=本月1日00:00
D-3  PullList 移除写死 style height:100vh → h-full；work-log 根布局 h-screen overflow-hidden
     flex flex-col，列表区 flex-1 min-h-0（真正的剩余空间高度）
D-4  work-log base 状态拆分：baseLoading(骨架) / baseError(ErrorBanner+重试) /
     无 currentTenant(选择企业引导) / 无 employee(暂无员工档案 Empty) / employee(PullList)
D-5  profile loadData 开始处 setLoadError(null)（重试成功后横幅不再残留）
D-6  growth 错误分支真实使用 ErrorBanner（TabHero + ErrorBanner + 重试），
     证据与实现一致（此前 P1-C 证据声称已换用但实现未生效，本版修正）
```

## P1-E 变更明细（相对 d1deb50，仅一项）

```
E-1  src/client/supabase.ts：customFetch 在 TARO_ENV=h5 时改走原生 fetch（6 行）。
     根因/影响/复验见上方「P1-E 运行时缺陷披露」。无 UI/交互/数据层其他改动。
```
