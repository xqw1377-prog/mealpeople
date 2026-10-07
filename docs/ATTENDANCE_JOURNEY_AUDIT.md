# Phase ATT-A0 · 考勤旅途全链审计（ATTENDANCE JOURNEY AUDIT）

> 2026-10-07 · 状态：事实审计完成，未动任何 UI/代码/DB
> 方法：两路并行只读审计（数据层+live DB / 页面层+交互链）+ 承重结论人工复核（本文件标注【亲验】者）

## 0. 一页结论

**考勤域与排班 SSOT 完全断裂，且打卡功能从未真正可用。**

```
排班 SSOT（schedules published）──✕──→ 考勤（work_attendance）
                                          │
                                          ├─ RLS：唯一 INSERT 策略仅放行管理员角色
                                          │   → 员工本人打卡必被 RLS 拒绝【亲验】
                                          │
                                          ├─ 表 0 行 = 生产中从未成功写入过一条打卡
                                          │
                                          ├─ status 四态（normal/late/early_leave/absent）
                                          │   判定算法前后端均不存在，clockIn 恒写 normal
                                          │
                                          ├─ 无补卡 / 无修正 / 无申诉 / 无审批（全仓 0 命中）
                                          │
                                          └─ 无 GPS / 无位置 / 无设备信息（纯时间打卡）
```

更严重的是**对用户的持续误导**：工作台「打卡状态：未打卡 / 今日班次：待查询」是**硬编码字符串**（src/pages/index/index.tsx:232-239，【亲验】），管理端 dashboard 的「迟到 N 人 / 考勤率 96.5%」是**写死示例数据**（api-dashboard.ts:240-277 注释自认"使用示例数据"）。用户看到的考勤状态全是假的。

## 1. 数据模型现状

### 1.1 表

| 表 | 行数 | 用途 | 与考勤页面关系 |
|---|---|---|---|
| `work_attendance` | **0** | 唯一打卡事实表（13 列） | 打卡页读写目标 |
| `area_attendance_overview` | **0** | 区域排班概览快照（jsonb） | 页面不读写（平行孤儿） |

`work_attendance` 关键列：employee_id / store_id / tenant_id / date / shift_type / clock_in_time / clock_out_time / status(default 'normal') / work_hours / note。**无任何 GPS/位置列**。

### 1.2 结构性缺陷（live 实查）

```text
UNIQUE(employee_id, date)      → 一天只能一条记录 = 天然无法支持一天多段班打卡
无 FK 指向 schedules            → 打卡与排班事实零关联
shift_type 列从不被写入         → 死列
status 判定算法不存在           → 四态中三态是死值
RLS INSERT 仅管理员角色         → 员工打卡路径与 RLS 直接矛盾（0 行与此一致）
RLS 管理员策略无 tenant/store scope → 仅按 role 字符串（与排班域 D5 已冻结纪律相悖）
DB 侧零函数/零 RPC              → 与排班 6+2 command 架构完全不对称
```

### 1.3 时区缺陷

"今天"用 `toISOString().split('T')[0]`（UTC 日期）——东八区 00:00–08:00 打卡会落到**前一天**的记录上（api-attendance.ts:33/63）。而展示层 formatTime 用本地 getHours——同一页两套时区口径。

## 2. 打卡链路（页面层）

### 2.1 真实入口与写入口

```
工作台「考勤打卡」/「打卡状态」（硬编码"未打卡"）
  → /packageG/pages/working/attendance/index（400 行，真实入口）
      上班：clockIn → INSERT work_attendance（status 恒 'normal'）
      下班：clockOut → UPDATE 补 clock_out_time + work_hours（前端算时长）
  防重复：前端 check-then-act（非原子）+ DB UNIQUE 兜底
  并发：UNIQUE 拒绝但代码不识别该错误码（无差异化提示）
  离线/跨店/设备：无任何处理
```

### 2.2 页面语义缺口

```text
1  加载失败全部吞掉（catch → console / 返回 null）→ "查询失败"与"未打卡"不可区分
2  无骨架屏；启用 pulldownRefresh 但无 handler
3  角色无区分：管理端 dashboard 的考勤警报也跳员工打卡页
4  无月度统计/日历/历史页（现成函数 getMonthlyAttendanceStats 无调用者）
5  下班按钮 bg-blue-100 text-white 近乎不可见；"已打卡"徽章绿底蓝字
6  当前时间无定时器 → 页面停留时时间冻结
```

### 2.3 重复与死代码

```text
attendance/index.tsx（孤儿复制品，与 working 版 diff 仅 3 处 shadow-sm）
api-employee-workspace.ts 的第二套 work_attendance CRUD（零调用者）
profile/index-new.tsx「我的考勤」→ /pages/attendance/index 主包死链
quick-start「考勤管理」→ /packageA/pages/attendance-management 死链（目录不存在）
```

## 3. 与排班域的对照（断裂清单）

| 排班域（已冻结） | 考勤域（现状） |
|---|---|
| schedules = SSOT，status 三值冻结 | work_attendance 0 行，status 判定不存在 |
| 6 command + 2 read RPC，事务权威 | 前端直 INSERT/UPDATE，零 RPC |
| 冲突检测并发安全（advisory lock） | check-then-act 竞态窗口 |
| RLS = role + tenant + store + ownership | 仅 role 字符串，无 scope |
| legacy 0 exposure 隔离 | 无历史概念（因为从未有数据） |
| 通知生产端五类 | 零通知 |

## 4. 需要裁定的决策点（只列，不给方案）

| # | 决策点 | 影响 |
|---|---|---|
| AD1 | **考勤事实语义**：打卡是否必须关联 schedules published 班次？还是允许无排班自由打卡？（决定 UNIQUE(employee,date) 是否要废、一天多段班打卡模型） | 表结构与全部判定逻辑 |
| AD2 | **迟到/早退/缺卡裁决**：服务端 command（同排班纪律）还是继续前端？口径以排班班段时间为基准的话，跨午夜班/多段班的应打卡时间如何定义 | 事实权威与 UI |
| AD3 | **打卡写入架构**：复制排班 command RPC 模式（clock_in/clock_out command + 并发安全 + RLS 收口）还是保留直写 + 补 RLS | 与排班域架构一致性 |
| AD4 | **补卡/修正/申诉**：本期是否纳入（员工申请→管理者审批→留痕）？还是先只做管理端修正 command | 范围 |
| AD5 | **GPS/位置**：当前纯时间打卡。是否要求门店范围（真实校验 or 仅展示）？ | 需要产品决策，技术两档成本差异大 |
| AD6 | **时区口径**：统一本地日界（东八区）还是 UTC？（影响"今天"判定与统计） | 全部日期逻辑 |
| AD7 | **工作台/仪表盘假数据**：硬编码"未打卡/待查询"与 dashboard 示例考勤率——先摘除/置灰（诚实）还是等考勤域建成后接真数据 | 用户信任 |
| AD8 | **area_attendance_overview**：平行孤儿表，RETIRE 还是并入规划层 | 页面收敛 |

## 5. S0/S1 风险分级

### S0（断裂级，动 UI 前必须裁定）
1. 员工打卡被 RLS 拒绝（功能从未可用）+ 表 0 行
2. 考勤与 schedules SSOT 零关联；UNIQUE(employee,date) 与多段班互斥
3. status 判定算法不存在 → 迟到/早退/缺卡全是死值
4. 用户可见的考勤状态是硬编码假数据（工作台+dashboard）

### S1（功能缺口）
5. 补卡/修正/申诉/审批全链不存在
6. 管理端无考勤管理页（dashboard 警报跳员工页）
7. 月度统计/历史无页面（函数无调用者）
8. 时区双口径（UTC 存储 vs 本地展示）

### S2（状态语义/一致性）
9. 错误全吞（失败与未打卡不可区分）；无骨架；无角色语境
10. 死链×2、孤儿页×1、死 CRUD×1、dashboard 示例数据

## 6. 审计范围

页面：packageG/working/attendance（真实入口）、packageG/attendance（孤儿）、index 工作台入口、
packageD/dashboard（假数据）、profile/index-new（死链）、quick-start（死链）；
数据层：api-attendance.ts 全文、api-employee-workspace.ts 死 CRUD、api-dashboard.ts 示例数据；
live DB：work_attendance / area_attendance_overview 的列/行数/RLS/policy/FK/trigger/pg_proc 依赖。
