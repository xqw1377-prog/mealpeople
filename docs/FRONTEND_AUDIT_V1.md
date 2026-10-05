# 前端全量审计报告 V1（2026-10-05）

> 范围：app-7daop8q0sxdt（Restaurant Workforce Journey OS / 工作旅途）
> 技术栈：Taro + React + Tailwind + iconify + miaoda-auth-taro，目标端微信小程序/H5
> 审计方式：全量静态盘点（254 页面配置）+ 模式抽样 + 主页面精读

## 一、盘点总览

| 维度 | 数据 |
|---|---|
| 页面总数 | **254**（主包 28 + 8 个分包 226） |
| 分包分布 | A员工门店22 / B排班34 / D数据看板30 / F成长14 / G考勤21 / H人事流程**69** / J管理27 / N公告任务9 |
| TabBar | 4 个：工作台 / 工作记录 / 我的成长 / 我的 |
| 组件目录 | **仅 9 个**（Drawer/EmptyState/Skeleton/WorkLog/common/info-dashboard/module-grid/signature/wechat） |
| 超大页面 | 39 页超过 500 行，最大 packageH 合同管理 1334 行 |

## 二、核心发现（按严重度）

### P0 结构性问题

**1. 主题色割裂 —— 品牌是什么颜色？**
- TabBar 用「爱马仕橙 #FF6600」，但 **219/254 页面（86%）是蓝色系**，橙系仅 51 页
- 无 design token 层：颜色全部散落在各页 Tailwind 类名里，换主题=逐页改

**2. 组件化荒漠**
- 9 个组件支撑 254 页；EmptyState 组件存在却只有 20 页引用，**166 页各自手写空态**
- 68 对 add/edit 型表单页几乎逐份复制（brand-add/brand-edit、store-form…）
- 无统一 NavBar/列表容器/表单组件 → 每页自造轮子

**3. 图标体系三轨混用**
- 202 页 iconify（i-mdi-*）+ 33 页 emoji 图标 + TabBar 图片图标 —— 同屏混搭常见

### P1 交互问题

**4. 长列表性能炸弹**
- 全仓仅 **6 页（2.4%）** 有下拉刷新/触底加载
- 排班日志 301 行、营收明细 242 行若全量渲染，低端机必卡

**5. 表单体验原始**
- 36+ 页用 toast 做「请输入xxx」校验，无行内校验、无草稿保存、无提交loading防重

**6. 状态覆盖不均**
- loading 91% / error 94% 尚可；**空态仅 65%**（1/3 页面空数据时白屏或裸文字）

**7. 视觉噪音**
- 首页 21 处渐变 + 多处阴影叠加；卡片圆角/间距/字号无规范，各页自定

### P2 一致性问题

**8. 三代页面风格并存**：「视觉优化版」新首页（渐变卡片）、老页面（朴素列表）、平台 AI 生成页（另一种风格）——同一 App 三种气质
**9. overrides.scss 全是 !important**：与 miaoda-auth-taro 库样式对抗，维护脆弱
**10. 导航栏全部原生默认**（0 自定义），页面标题/返回行为不统一

## 三、重设计方案（Blueprint）

### 3.1 设计系统「工作旅途 DS」

```
Design Tokens（src/design/tokens.scss + tailwind.config 扩展）
├─ 色彩：primary 暖橙系（承接品牌橙，餐饮温度感）500/600/700
│        functional: success/warning/danger/info
│        neutral: 9 阶灰
├─ 字阶：11/12/13/15/17/20/24（小程序适配）
├─ 间距：4 的倍数（4/8/12/16/20/24/32）
├─ 圆角：sm 8 / md 12 / lg 16 / full
└─ 阴影：card（轻）/ dropdown / modal 三档
```

**基础组件库 v2（20 个）**：Button / NavBar / Card / List+ListItem / Tabs / Tag / Badge /
Empty / Skeleton / Form Field 套件(Input/Picker/Upload+行内校验) / Modal / ActionSheet /
Toast(统一封装) / PullList(下拉刷新+触底分页+空态+骨架四合一) / Steps / Avatar / Icon(统一iconify) /
SearchBar / FilterBar / StatCard

### 3.2 信息架构收敛：254 → 约 150 页

- **按员工旅程重组**：入职(H) → 排班考勤(B+G) → 日常工作(主包) → 成长(F) → 离职(H)
- add/edit 成对页 → 通用表单组件 + 单页双模式（-68 页）
- 功能重复页合并（各类 detail 变体、三级列表页直接并入列表抽屉）（-30 页左右）
- 死页/演示页清理

### 3.3 交互标准（全站强制）

1. 所有列表页 = PullList 组件（分页+刷新+空态+骨架）
2. 所有表单 = Form 套件（行内校验+提交防重+成功反馈统一）
3. 图标只用 iconify（i-mdi 主集），emoji 图标全替
4. 空态必有引导动作（「去创建」按钮），不是裸「暂无数据」
5. 自定义 NavBar 统一（标题/返回/右侧动作），沉浸式仅首页

### 3.4 分期执行

| 期 | 内容 | 量 |
|---|---|---|
| 一期 | tokens + 20 组件 + 4 个 Tab 主页面重设计（视觉定调样板） | 1 周 |
| 二期 | 高频路径：排班/考勤/工作记录/请假 全链路重构 + 列表性能 | 2 周 |
| 三期 | 管理域 packageH(69页) + packageJ(27页) | 2 周 |
| 四期 | 长尾统一 + 死页清理 + 全站走查 | 1 周 |

## 四、立即可见的收益

- 主题一致（一色系全站）→ 品牌感知 ×
- 列表分页 → 首屏数据量降 90%+
- 组件复用 → 后续每页开发成本 -50%
- 页面收敛 100+ → 维护面减 40%
