# 长尾页面收敛映射（LONG-TAIL CONVERGENCE MAP）

> 2026-10-11 · 方法：app.config 全量注册 + 全仓导航引用 grep + 活根 BFS 传递可达
> 范围：245 注册页，排除已重设计 13 页后评估 232 页

## 统计

```text
注册总数   = 245（主包 19 + A 22 + B 34 + D 30 + F 14 + G 21 + H 69 + J 27 + N 9）
已重设计   = 13（4 Tab + 排班 5 + 考勤 1 + 请假 3）
本次评估   = 232
KEEP      = 93（40.1%）
MERGE      = 9（3.9%）
REDIRECT   = 15（6.5%）
RETIRE    = 115（49.6%）
```

## 四个死链根（合计拖死约 40 页）

```text
1. pages/management          死管理枢纽，8 个出链目标需接驳
2. packageD/startup-center   死启动枢纽，10+ 出链全死
3. packageH/onboarding/index 死目录套件（~15 页零引用复制品）
4. packageJ/interview-management 死招聘枢纽（~10 页零引用）
```

## 入口断点修复（本轮已执行）

```text
1. my-leave 四个「功能开发中」按钮 → 接通 leave-request / leave-records / leave-approval
   （重设计请假三页从零活入口 → 三个活入口）
2. profile 两处死链：
   /pages/agent-workspace → /packageF/pages/agent-workspace
   /packageE/pages/join-tenant → /packageD/pages/join-tenant（packageE 不存在）
```

## 完整映射表

（见后台审计输出，245 页逐页可达性分析；此处摘录关键分类）

### RETIRE 115 页（含 4 个死链根）
- 主包：work-log/add + detail（792 行死页面，功能已内联进 Tab）、management
- packageA：employee-detail、employee-profile、store-form、team-management、temp-worker-form、schedule-config-create、schedule-config
- packageB：analytics/analytics、data-export、impact-factors、operation-adjustment、operation-dashboard、operation-review、revenue-detail-form、revenue-detail-list、revenue-excel-import、revenue-history-import、revenue-import、debug-work-shifts、schedule-history、schedule-log-form、schedule-optimization
- packageD：bind-wechat、brand-config、business-area-config、business-areas、min-revenue-config、quick-reference、rest-day-rules、setup-wizard、startup-center、system-config、admin、join-tenant、my-applications、permission-management、tenant-management、user-management
- packageF：core-position-backup、store-hierarchy、tutorial、agent-assign-stores、agent-detail
- packageG：employee-workspace、work-log-create、work-log-detail、working/skill
- packageH：debug-onboarding、document-upload、my-contract、my-resignation、my-social-security、onboarding 套件 15 页、resignation 套件 5 页
- packageJ：招聘域 10 页、training-admin 等 6 页
- packageN：announcement 4 页、task 3 页

### REDIRECT 15 页
- packageA/employee-workspace → /pages/index/index（login 跳转需改）
- packageA/position-management → packageD/position-management
- packageA/stores → packageD/store-management
- packageB/leave-request → packageG/leave-request
- packageB/monthly-schedule → packageB/schedule-planning
- packageG/attendance → packageG/working/attendance
- packageG/my-schedule → packageB/scheduling（已做 redirect 壳）
- packageG/leave-request-easy → packageG/leave-request
- packageG/leave-approval-easy → packageG/leave-approval
- packageG/working/leave|overtime|performance|promotion|salary|transfer → 对应 packageF 正本

### MERGE 9 页
- employee-import/employee-import → employee-import（单页流程）
- schedule-config + schedule-config-create → schedule-form（排班域已重设计）
- data-analytics → analytics
- revenue-management → home（重建入口）
- my-onboarding-application + onboarding-application + onboarding-apply → my-onboarding

## 死代码配套（可一并删除）

```text
src/components/module-grid（零引用）
src/config/role-modules.ts（仅被 module-grid 和死 system-config 引用）
```

## 执行说明

RETIRE = 从 app.config 摘除注册 + 文件可保留（不再可达即达目的）。
执行应分批进行，每批验证 build + 无路由报错。
