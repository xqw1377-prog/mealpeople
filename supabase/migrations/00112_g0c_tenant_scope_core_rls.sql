-- ============================================================
-- G0-C: Tenant RLS —— 封闭 10 张 USING(true) 全开表（P0-SEC-04）
-- 治理裁定：2026-10-03（LEGACY FUNCTION FREEZE 生效中；不新增业务功能）
--
-- 背景：下列表的现行策略为 USING(true)/WITH CHECK(true)（或等价全开），
-- 租户隔离完全依赖客户端传 tenant_id。本迁移将隔离收回到数据库层。
--
-- 行为影响：
--   * 租户内成员的读写权限保持不变（与 8 张核心表同模式 can_access_tenant）
--   * 跨租户读写一律 DENY；anon（未登录）对下列表全部 DENY
--   * 同租户内不分角色（店经理/员工同权）为遗留行为，G0 不改变（P1 另行处理）
--
-- 无 tenant_id 的 3 张子表（schedule_plan_periods / day_off_records /
-- part_time_records）经由父表 schedule_plans.tenant_id 关联判定，
-- 使用 SECURITY DEFINER 的 can_access_tenant()，不受父表 RLS 递归影响。
-- ============================================================

-- ---------- 1. work_shifts 班次配置 ----------
-- 旧策略 "认证用户可以管理班次配置"（50_fix_meal_periods_and_work_shifts_display.sql:52-55, true/true）
DROP POLICY IF EXISTS "认证用户可以管理班次配置" ON work_shifts;
CREATE POLICY "认证用户可访问本租户班次配置" ON work_shifts
  FOR ALL TO authenticated
  USING (public.can_access_tenant(auth.uid(), tenant_id))
  WITH CHECK (public.can_access_tenant(auth.uid(), tenant_id));

-- ---------- 2. meal_periods 餐段配置 ----------
DROP POLICY IF EXISTS "认证用户可以管理餐段配置" ON meal_periods;
CREATE POLICY "认证用户可访问本租户餐段配置" ON meal_periods
  FOR ALL TO authenticated
  USING (public.can_access_tenant(auth.uid(), tenant_id))
  WITH CHECK (public.can_access_tenant(auth.uid(), tenant_id));

-- ---------- 3. efficiency_standards 效能标准 ----------
DROP POLICY IF EXISTS "认证用户可以管理效能标准配置" ON efficiency_standards;
CREATE POLICY "认证用户可访问本租户效能标准" ON efficiency_standards
  FOR ALL TO authenticated
  USING (public.can_access_tenant(auth.uid(), tenant_id))
  WITH CHECK (public.can_access_tenant(auth.uid(), tenant_id));

-- ---------- 4. daily_operations 每日运营 ----------
DROP POLICY IF EXISTS "认证用户可以管理每日运营记录" ON daily_operations;
CREATE POLICY "认证用户可访问本租户每日运营记录" ON daily_operations
  FOR ALL TO authenticated
  USING (public.can_access_tenant(auth.uid(), tenant_id))
  WITH CHECK (public.can_access_tenant(auth.uid(), tenant_id));

-- ---------- 5. schedule_plans 排班规划 ----------
DROP POLICY IF EXISTS "认证用户可以管理排班规划" ON schedule_plans;
CREATE POLICY "认证用户可访问本租户排班规划" ON schedule_plans
  FOR ALL TO authenticated
  USING (public.can_access_tenant(auth.uid(), tenant_id))
  WITH CHECK (public.can_access_tenant(auth.uid(), tenant_id));

-- ---------- 6. schedule_plan_periods 排班规划餐段明细（无 tenant_id，经父表） ----------
DROP POLICY IF EXISTS "认证用户可以管理排班规划餐时间段" ON schedule_plan_periods;
CREATE POLICY "认证用户可访问本租户排班规划明细" ON schedule_plan_periods
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schedule_plans sp
    WHERE sp.id = schedule_plan_id
      AND public.can_access_tenant(auth.uid(), sp.tenant_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM schedule_plans sp
    WHERE sp.id = schedule_plan_id
      AND public.can_access_tenant(auth.uid(), sp.tenant_id)
  ));

-- ---------- 7. schedule_results 排班结果 ----------
-- 生产快照策略名与迁移文件名不一致（schema.sql:20548 vs 18 号迁移），两个名字都清
DROP POLICY IF EXISTS "Authenticated users have full access to schedule_results" ON schedule_results;
DROP POLICY IF EXISTS "All users have full access to schedule_results" ON schedule_results;
CREATE POLICY "认证用户可访问本租户排班结果" ON schedule_results
  FOR ALL TO authenticated
  USING (public.can_access_tenant(auth.uid(), tenant_id))
  WITH CHECK (public.can_access_tenant(auth.uid(), tenant_id));

-- ---------- 8. part_time_shifts 兼职班次 ----------
DROP POLICY IF EXISTS "Authenticated users have full access to part_time_shifts" ON part_time_shifts;
DROP POLICY IF EXISTS "All users have full access to part_time_shifts" ON part_time_shifts;
CREATE POLICY "认证用户可访问本租户兼职班次" ON part_time_shifts
  FOR ALL TO authenticated
  USING (public.can_access_tenant(auth.uid(), tenant_id))
  WITH CHECK (public.can_access_tenant(auth.uid(), tenant_id));

-- ---------- 9. part_time_records 兼职记录（无 tenant_id，经父表） ----------
DROP POLICY IF EXISTS "认证用户可以管理兼职记录" ON part_time_records;
CREATE POLICY "认证用户可访问本租户兼职记录" ON part_time_records
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schedule_plans sp
    WHERE sp.id = schedule_plan_id
      AND public.can_access_tenant(auth.uid(), sp.tenant_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM schedule_plans sp
    WHERE sp.id = schedule_plan_id
      AND public.can_access_tenant(auth.uid(), sp.tenant_id)
  ));

-- ---------- 10. day_off_records 排休记录（无 tenant_id，经父表） ----------
DROP POLICY IF EXISTS "认证用户可以管理休假记录" ON day_off_records;
CREATE POLICY "认证用户可访问本租户排休记录" ON day_off_records
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schedule_plans sp
    WHERE sp.id = schedule_plan_id
      AND public.can_access_tenant(auth.uid(), sp.tenant_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM schedule_plans sp
    WHERE sp.id = schedule_plan_id
      AND public.can_access_tenant(auth.uid(), sp.tenant_id)
  ));

-- ---------- 确认 RLS 全部启用（幂等防御；work_shifts 曾被 31_3 关闭、50 重开） ----------
ALTER TABLE work_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE efficiency_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_plan_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_time_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_off_records ENABLE ROW LEVEL SECURITY;
