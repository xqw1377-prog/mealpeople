# Phase 2 · 排班旅途全链审计（SCHEDULING JOURNEY AUDIT）

> 日期：2026-10-07 · 状态：事实审计完成，未动任何 UI/代码
> 方法：三路并行只读审计（员工看班 / 管理者排班 / 冲突与通知）+ 承重结论人工复核（本文件中标注【亲验】的条目为审计后二次独立确认）

## 0. 一页结论

**排班旅途在数据层就是断的，先于任何 UI 问题。**

```
管理者排班（schedule-planning / schedule-form）
        │ 写入
        ▼
   schedules 表 ──────────✕──→ 员工工作台「我的班次」（packageB/scheduling）
                                    │ 读取
                                    ▼
                              employee_shifts 表 ←── 唯一写入函数 createShift/
                                                  batchCreateShifts 全仓零页面调用
                                                  （换班 swapShifts 也只动这张表）

   work_schedule_records 表 ←── schedule-history（孤儿页，入口只弹「开发中」）
```

管理者排的班，员工在真实入口（工作台「我的班次」）**永远看不到**，两张表之间没有任何同步：无迁移函数、无触发器（supabase/migrations 仅建表语句）、无页面级桥接。换班、历史班次各自又在第三张表上。变更通知生产端为零。

---

## 1. 链路四段现状

### 1.1 员工怎么看班

| 页面 | 数据表 | 入口 | 状态 |
|---|---|---|---|
| packageB/pages/scheduling（工作台真实入口【亲验】index.tsx:37-42） | employee_shifts【亲验】 | 工作台宫格、quick-start、employee-detail | 唯一被真实使用的员工视图；换班/换班记录从这进 |
| packageG/pages/my-schedule | schedules | role-modules 配置 + packageG 员工工作台 | 平行实现：月历视图，与 scheduling 数据源不同表 |
| packageB/pages/monthly-schedule | 纯客户端生成 | packageB 首页、schedule-center | 管理侧"智能生成"，参数全写死，**结果不落库** |
| packageB/pages/work-shifts | work_shifts | 启动向导、租户设置、管理页 | 班次字典 CRUD（管理配置页，非员工视图） |

- 「我的班次」存在双实现双数据源；role-modules.ts:39 与工作台实际入口指向不同页面
- 员工视图与管理者写入表不连通（见第 0 节）

### 1.2 管理者怎么排

三条互不相通的链：

- **链 A 排班规划（主链）**：schedule-planning 单页 2057 行，四步（营收→查表→人数→排休/兼职弹窗），一次保存串行写 5 张表（daily_operations、schedule_results、schedules×N、schedule_logs×N、part_time_shifts）；保存后不跳转、输入锁死需手动「重新规划」
- **链 B 手工单条**：schedule-form 7 字段；**日期/时间为纯文本无任何格式与逻辑校验**（placeholder "格式：2025-01-15"）；编辑入口指向不存在的 packageC（死链）
- **链 C 排班配置**：schedule-config/create 写 work_schedule_configs（draft→publish）；表单收集的 4 个目标参数**提交时静默丢弃**；「查看详情」死链；列表查询无租户过滤（页面层）

### 1.3 冲突怎么处理

- **员工时间重叠冲突检测：全仓不存在。** 唯一"去重"是 createSchedule 的同日幂等（schedule.ts:99-113，同员工同日已存在则静默返回旧记录，无报错）；update/delete 无任何前置校验
- 存在的"冲突"逻辑均非排班重叠：月度生成的人数/成本冲突（schedule-generator.ts:323）、请假-请假重叠（api-leave.ts:360）、餐段配置重叠（brand-config）
- **换班三断**【关键页 shift-swap】：
  1. 发起端：目标班次是硬编码 mock（shift-swap/index.tsx:32-49），提交 targetEmployeeId='mock-target-employee-id'（:138-139）
  2. 审批端：reviewSwapRequest（api-swap.ts:135）全仓无任何 UI 调用者——审批页面/按钮不存在；swap-records 页只有取消，无 approve/reject
  3. 生效端：swapShifts（api-swap.ts:193）互换 employee_id 前无重叠检查；且状态先置 approved 再交换、失败不回滚

### 1.4 调班/变更怎么通知

- 通知基础设施完整存在：notifications 表 CRUD、'schedule' 类型枚举、通知页「排班」计数格、未读徽标
- **生产端为零**：createNotification 全仓仅 3 个调用方（合同/任务/培训），排班创建/更新/删除/换班交换无一处产通知
- 无小程序订阅消息、无 Supabase realtime——纯拉取式，员工只能自己进页刷新
- 通知页点击 schedule 类型无路由跳转（notifications/index.tsx:184-204 只处理合同类）

---

## 2. 发现清单（分级）

### S0 域级断裂（动 UI 前必须先裁定）
1. 三表并存互不相通：schedules / employee_shifts / work_schedule_records（+ schedule_results、work_schedule_configs 平行体系）【亲验】
2. employee_shifts 唯一写入函数零页面调用——员工视图数据无生产者【亲验】
3. 变更通知生产端为零，基础设施空转
4. 员工时间重叠冲突检测不存在

### S1 功能死链 / 半成品
5. 换班全链三断（mock 发起 / 无审批 UI / 无保护生效）
6. schedules 列表编辑 → packageC 不存在；operation-adjustment:445 同样指向 packageC
7. schedule-config「查看详情」→ schedule-config-detail 不存在
8. schedule-log-form 孤儿页（无入口）；schedule-history 孤儿页（入口弹「开发中」）
9. schedule-config-create 收集的 4 个目标参数提交时丢弃
10. schedules 页班次类型/日期筛选为死代码（写入 _filteredSchedules 永不读取）
11. schedule-logs「本周/本月」筛选无效（startDate 计算后未用于查询）

### S2 状态语义 / 权限（Phase 1 Gate 同口径）
12. 16 页 0 个使用 ds 组件；错误一律 toast+console，多处 db 层吞错返回 []（错误与空态不可区分）
13. 全部排班页无 profiles.role 门禁（仅登录 guard）；员工工作台把 schedule-center 暴露给全员；首页管理入口按 position（店长/经理）而非 role 判定
14. api-leave.ts 空数据造默认 09:00-18:00（my-schedule 展示假班次）
15. 成本计算魔数：月薪兜底 5000、每月 30 天、8h=1 天
16. schedule-config 列表查询页面层无租户过滤（实际可见性取决于 RLS，未验证 SELECT 隔离）

### S3 一致性 / 死代码
17. 「我的班次」双实现双入口指向不同表
18. schedule-planning 2057 行（handleSave 325 行、JSX 占 53%）；blue-/indigo- 直写 90+ 处（五页合计）
19. useEffect + useDidShow 首次双请求（my-schedule、schedules）；调试 console 大面积残留（work-shifts 约 40 条、schedule-planning 55 处）
20. monthly-schedule 生成参数全写死（营收 15000/10000、岗位写死、年份 Picker 写死 [2024,2025,2026]）

---

## 3. Phase 2 排班开工前需要的裁定点（只列决策，不给方案）

| # | 裁定点 | 影响面 |
|---|---|---|
| D1 | **权威数据模型**：schedules / employee_shifts 二选一归一，或定义 V4 新模型（与 Journey V4 Domain Contract 独立轨道的关系需明确） | 全部排班 UI + 换班 + 历史 |
| D2 | 换班域：修复现有 mock 链（补审批 UI + 真实目标班次）还是随 D1 一并重设计 | shift-swap / swap-records / api-swap |
| D3 | 通知生产端是否纳入 Phase 2 范围（还是仅保展示位） | 排班保存/变更路径 |
| D4 | 冲突检测层级：仅保存时校验，还是换班审批时也校验 | db 层 + 表单 |
| D5 | 角色门禁口径：profiles.role 为准还是 position 为准 | 所有排班页入口 |

## 4. 审计范围

16 页面 + db 层：packageB/{scheduling, my-schedule 引用, schedules, schedule-planning, schedule-form, schedule-center, monthly-schedule, work-shifts, shift-swap, swap-records, schedule-logs, schedule-log-form, schedule-history, schedule-optimization}、packageA/{schedule-config, schedule-config-create}、packageG/my-schedule；db/modules/schedule.ts、api-shifts.ts、api-swap.ts、api-schedule-config.ts、api-leave.ts（数据源）、api-schedule-record.ts；utils/schedule-generator.ts；通知链 api-notification.ts + notifications 页。
