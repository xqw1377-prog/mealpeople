# P2-S1-A-R1 · 权限面收敛与事实纪律 证据包

> 2026-10-07 · 依据：P2-S1-A = HOLD-R1 裁定（四 blocker）
> Migration：`00131_p2s1_a_r1_purpose_built_reads.sql` · typecheck 0 错 · H5 build exit 0（1m14s）

## 修复对照

```text
R1-1  DROP schedules_select_store_published（00130 宽策略）+ DROP sched_my_store_ids
      → 专用最小读 RPC：
        list_schedule_swap_candidates(requester_schedule_id)
          服务端验证：班次 published + 属当前用户 active employment
          仅返回 schedule_id / employee_name / schedule_date / start_time / end_time
        get_swap_shift_brief(schedule_id)
          换班记录展示用（撤宽策略后员工侧同事班次 embed 被 RLS 过滤为 null 的最小补齐；
          仅本店在职或本店管理者可读，同 5 最小字段）
      schedules 表级策略回到 4 条 SELECT（own_published / managed / tenant_admin / super_admin）

R1-2  shift-swap 候选改走 list_schedule_swap_candidates RPC，不再直查同店 schedules

R1-3  schedule-planning：
      删除逐员工 publish_schedule('09:00','18:00') 虚构发布（规划层不发布事实，
      保存提示指引用户经「创建排班」显式指定班段发布；S1-B 补完整流）
      上岗员工判定读取加 .eq('status','published')（legacy/cancelled 不再计入）

R1-4  schedule-center 撤「排班优化」卡片（映射 RETIRE 落地，无导航引用）
      role-modules scheduling-management → /packageB/pages/schedule-center/index
      （管理端不再误入员工「我的班次」）
```

00129 cancel_schedule_swap 未动（裁定确认 PASS）。

## 证明（7/7 PASS，真实 JWT）

```text
PASS P1  employee REST 直读同店他人 schedules → 0 rows（宽策略已撤，实测）
PASS P2  candidates RPC → 同店真实候选 ×1，字段恰为 5 最小字段（无 notes/created_by，实测键序）
PASS P3  候选 → request_schedule_swap → DB status=pending
PASS P4  schedule-planning 源码无 publish_schedule 调用（grep）
PASS P5  planning 上岗读取含 status='published'（grep）
PASS P6  schedule-optimization 无任何导航引用（仅剩 app.config 注册，页面不可达）；
         scheduling-management path = schedule-center
PASS TERM 终态 301 legacy / 0 published / 0 swap / 0 schedule 通知
```

日志：`g0-closing-run/p2s1a-r1-proofs.log`。

## 静态检查

typecheck（tsgo）= 0 错误；biome：R1 触及文件 0 error（shift-swap/swap-records 已格式化，
遗留错误仍只在未重写旧文件，随 S1-B 重设计消亡）；H5 构建 exit 0。
