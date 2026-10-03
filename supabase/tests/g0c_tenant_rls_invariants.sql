-- ============================================================
-- G0-C 安全不变量测试（跨租户攻击）
-- 目标迁移：supabase/migrations/00112_g0c_tenant_scope_core_rls.sql
-- 运行方式与判定纪律同 g0a_profiles_invariants.sql 头部说明。
-- 覆盖三种策略形态：直接 tenant_id（work_shifts / part_time_shifts）、
-- 父表关联（schedule_plan_periods）、未登录（anon）全拒。
-- ============================================================

BEGIN;
CREATE TEMP TABLE g0c_results (test_id text PRIMARY KEY, status text, detail text);

-- ---------- 夹具（postgres 身份插入，事务结束回滚） ----------
INSERT INTO public.tenants (id, name, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'G0C-TENANT-A', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'G0C-TENANT-B', 'active');

INSERT INTO public.profiles (id, phone, role, tenant_id) VALUES
  ('99999999-0000-0000-0000-000000000003', '13800000003', 'employee', '11111111-1111-1111-1111-111111111111'),
  ('99999999-0000-0000-0000-000000000005', '13800000005', 'employee', '22222222-2222-2222-2222-222222222222');

INSERT INTO public.stores (id, tenant_id, name) VALUES
  ('33333333-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'G0C-STORE-A'),
  ('33333333-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'G0C-STORE-B');

INSERT INTO public.work_shifts (tenant_id, shift_name, start_time, end_time) VALUES
  ('22222222-2222-2222-2222-222222222222', 'B店班次', '09:00', '18:00');

INSERT INTO public.schedule_plans (id, tenant_id, store_id, plan_date) VALUES
  ('44444444-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
   '33333333-0000-0000-0000-000000000002', '2026-10-05');

INSERT INTO public.part_time_shifts (tenant_id, store_id, operation_date, employee_name, work_hours, hourly_rate, total_cost) VALUES
  ('22222222-2222-2222-2222-222222222222', '33333333-0000-0000-0000-000000000002',
   '2026-10-05', 'B店兼职', 4, 20, 80);

-- 以员工A身份（租户A）执行攻击
-- ============================================================
-- C1 宪法条款：A企业员工不能给B企业写班次配置（伪造 tenant_id 无效）
-- ============================================================
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000003","role":"authenticated"}', true);
DO $$
BEGIN
  BEGIN
    INSERT INTO public.work_shifts (tenant_id, shift_name, start_time, end_time)
    VALUES ('22222222-2222-2222-2222-222222222222', '攻击插入', '09:00', '18:00');
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0c_results VALUES ('C1','PASS','跨租户写 work_shifts 被 DENY');
    RETURN;
  END;
  INSERT INTO g0c_results VALUES ('C1','FAIL','跨租户 work_shifts 写入成功');
END $$;

-- ============================================================
-- C2 宪法条款：A企业员工看不到B企业的班次配置
-- ============================================================
DO $$
DECLARE v int;
BEGIN
  SELECT count(*) INTO v FROM public.work_shifts
   WHERE tenant_id = '22222222-2222-2222-2222-222222222222';
  IF v = 0 THEN
    INSERT INTO g0c_results VALUES ('C2','PASS','跨租户 work_shifts 不可见（0行）');
  ELSE
    INSERT INTO g0c_results VALUES ('C2','FAIL','跨租户 work_shifts 可见 '||v||' 行');
  END IF;
END $$;

-- ============================================================
-- C3 宪法条款：A企业员工不能写B企业排班计划的明细（父表关联判定）
-- ============================================================
DO $$
BEGIN
  BEGIN
    INSERT INTO public.schedule_plan_periods (schedule_plan_id, period_name)
    VALUES ('44444444-0000-0000-0000-000000000002', '攻击插入');
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0c_results VALUES ('C3','PASS','跨租户写 schedule_plan_periods 被 DENY');
    RETURN;
  END;
  INSERT INTO g0c_results VALUES ('C3','FAIL','跨租户排班明细写入成功');
END $$;

-- ============================================================
-- C4 宪法条款：A企业员工不能写B企业兼职班次
-- ============================================================
DO $$
BEGIN
  BEGIN
    INSERT INTO public.part_time_shifts (tenant_id, store_id, operation_date, employee_name, work_hours, hourly_rate, total_cost)
    VALUES ('22222222-2222-2222-2222-222222222222', '33333333-0000-0000-0000-000000000002',
            '2026-10-06', '攻击兼职', 4, 20, 80);
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0c_results VALUES ('C4','PASS','跨租户写 part_time_shifts 被 DENY');
    RETURN;
  END;
  INSERT INTO g0c_results VALUES ('C4','FAIL','跨租户兼职班次写入成功');
END $$;

-- ============================================================
-- C5 回归（应为真）：A企业员工可以读写自己租户的数据
-- ============================================================
DO $$
DECLARE v int; v2 int;
BEGIN
  INSERT INTO public.work_shifts (tenant_id, shift_name, start_time, end_time)
  VALUES ('11111111-1111-1111-1111-111111111111', 'A店班次', '09:00', '18:00');
  SELECT count(*) INTO v FROM public.work_shifts
   WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

  INSERT INTO public.schedule_plans (id, tenant_id, store_id, plan_date)
  VALUES ('44444444-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
          '33333333-0000-0000-0000-000000000001', '2026-10-05');
  INSERT INTO public.schedule_plan_periods (schedule_plan_id, period_name)
  VALUES ('44444444-0000-0000-0000-000000000001', '午市');
  SELECT count(*) INTO v2 FROM public.schedule_plan_periods;

  IF v > 0 AND v2 > 0 THEN
    INSERT INTO g0c_results VALUES ('C5','PASS','本租户读写路径保留');
  ELSE
    INSERT INTO g0c_results VALUES ('C5','FAIL','本租户数据不可见/不可写');
  END IF;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO g0c_results VALUES ('C5','FAIL','本租户读写被误伤: '||SQLERRM);
END $$;
SELECT set_config('role','postgres', true);

-- ============================================================
-- C6 宪法条款：未登录（anon）对上述表全部 DENY
-- ============================================================
SELECT set_config('role','anon', true);
SELECT set_config('request.jwt.claims', '', true);
DO $$
DECLARE v int;
BEGIN
  SELECT count(*) INTO v FROM public.work_shifts;
  IF v = 0 THEN
    INSERT INTO g0c_results VALUES ('C6','PASS','anon 不可读（策略 TO authenticated）');
  ELSE
    INSERT INTO g0c_results VALUES ('C6','FAIL','anon 读到 '||v||' 行');
  END IF;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO g0c_results VALUES ('C6','PASS','anon 被拒: '||SQLERRM);
END $$;
SELECT set_config('role','postgres', true);

-- ---------- 汇总 ----------
DO $$
DECLARE v_fails int; r record;
BEGIN
  FOR r IN SELECT * FROM g0c_results ORDER BY test_id LOOP
    RAISE NOTICE '[%] %  %', r.test_id, r.status, r.detail;
  END LOOP;
  SELECT count(*) INTO v_fails FROM g0c_results WHERE status <> 'PASS';
  IF v_fails > 0 THEN
    RAISE EXCEPTION 'G0-C 安全不变量验证失败：共 % 项未通过', v_fails;
  END IF;
  RAISE NOTICE '=== G0-C 全部不变量通过（% 项） ===', (SELECT count(*) FROM g0c_results);
END $$;

ROLLBACK;
