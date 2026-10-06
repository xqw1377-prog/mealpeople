# Frontend V2 · Phase 1 Gate 证据包（P1-C 修订版，2026-10-06）

> 本版为 P1-C 收口后的事实口径修订。此前版本（a70b0af）中的行数统计与 Build 措辞不准确，已按裁定更正。

## 检查口径（按裁定更正）

```
TYPE CHECK     = PASS   （tsgo -p tsconfig.check.json 全仓 0 错误）
STATIC CHECK   = PASS   （biome：本提交涉及文件 0 error；仓库存量 7 条无关旧文件错误）
RUNTIME BUILD  = NO-EVIDENCE（本环境构建脚本被禁用；真实 build 需平台侧同步预览后取证）
```

## 8 条 Gate 当前状态

### G1 视觉同源 = HOLD（待截图）
四 Tab 结构语言已统一（TabHero + StatsStrip + 白卡 + 灰底），但无真实截图不得签视觉 PASS。

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

### G7 复杂度 = PASS（最终行数按 P1-C 后实文件统计）
```
index    291 行（原 456）
work-log 278 行（原 385）
growth   278 行（原 366）
profile  287 行（原 332）
```
全部 < 300。（注：此前版本报告的 226/237/259/174 为 biome 格式化前统计，已废弃。）

### G8 Build + 截图 = HOLD
- TYPE/STATIC 见文首口径
- RUNTIME BUILD = NO-EVIDENCE（待平台同步预览）
- 4 Tab 截图 = 待平台同步预览
- **分页专项验证（预览时必测）**：WORK-LOG > 20 RECORDS → 滚动到底 → 第 2 页实际加载。
  已做结构修复：去掉外层纵向 ScrollView，PullList 以 flex-1 + min-h-0 独占剩余高度，
  onScrollToLower 可触发性待运行时证明。

## P1-C 变更明细（相对 dbca090）

```
P1-1  work-log 统计改为独立 count 查询（head-only，tenant+employee+日期范围三联），失败显示 '-' 不再误导
P1-2  PullList 增加 error 独立态 + retry；index/profile 增加 ErrorBanner；growth 改用 ErrorBanner
P1-3  新增 TabShell（TabHero/StatsStrip/ErrorBanner）；四 Tab 全部真实 import DS；手写 Hero 清零
P1-4  本证据文件事实口径修订（行数、Build 措辞）
NESTED-SCROLL  work-log 去除嵌套纵向滚动（PullList 独占 flex-1 区域）
```
