# P2-S1-B-R1 · schedule-form 收口证据包

> 2026-10-07 · 依据：P2-S1-B = HOLD-R1 裁定（三点，仅 schedule-form）
> typecheck 0 错 · biome 0 error · H5 build exit 0 · 修复点证明 4/4 PASS（真实浏览器）
> 视觉证据资产化：15 张走查截图 + run.log + R1 证明截图/日志全部入库 `docs/evidence/p2s1b/`

## 修复对照

```text
R1-A 日期无条件必填   validate() 首行 if (!date) errs.date（工作班/排休同一口径）
                     实测：排休+空日期 → 日期 Field inline error，发布被拦
R1-B 编辑锁定显示员工 编辑模式渲染「谁在上班：张三 🔒不可修改」卡片（真实姓名来自
                     getScheduleById 的消歧 embed）；摘要行 isEdit 用 editEmployeeName
                     实测：编辑页显示「G0分页验证员（不可修改）」+「即将修改：G0分页验证员 · …」
R1-C 状态完整        initialLoading 骨架卡；loadError → ErrorBanner + 重试
                     （onRetry=loadSchedule/loadStores）；无门店 → 引导空态；
                     有门店无员工 → 警示条引导
                     实测：不存在 id → 真实错误 → ErrorBanner+重试按钮渲染（截图），
                     点击重试触发真实重新加载（REST 请求计数 >0）
```

## 证明（4/4，headed 真实交互）

```text
PASS R1-A  排休 + 空日期 → 日期字段 inline error（发布被拦）      [r1a-dayoff-date-error.png]
PASS R1-B  编辑页「G0分页验证员（不可修改）」+ 摘要真名            [r1b-edit-locked-employee.png]
PASS R1-C  加载失败 → ErrorBanner + 重试触发真实重新加载          [r1c-error-banner.png]
PASS TERM  终态 301 legacy 零残留
```

日志：`docs/evidence/p2s1b/r1-proofs.log`。按裁定未重跑 12 步业务链（R1 不改 RPC/旅途）。

## 证据资产化（B1/B8/B9/B10 的可审计载体）

```text
docs/evidence/p2s1b/
  01…13 × 15 张  S1-10 全链走查截图（创建/规划/编辑/看班/换班三步/审批卡+弹窗+结果/列表/取消）
  r1a/r1b/r1c    本轮三点修复截图
  run.log        S1-10 12/12 完整日志
  r1-proofs.log  本轮 4/4 日志
```

实现说明一处：R1-C 的重试点击在自动化下需 force click（Taro H5 弹层命中测试拦截），
该现象与 S1-10 走查中 weui modal 同源；重试按钮 onRetry 绑定为源码级验证 + 请求计数运行时验证。
