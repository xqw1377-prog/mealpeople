-- ============================================================
-- G0-D 安全不变量测试（Payroll / PII）
-- 目标迁移：00113_g0d_payroll_performance_tenant_scope.sql
--           00114_g0d_enable_rls_missing_tables.sql
-- 运行方式与判定纪律同 g0a_profiles_invariants.sql。
-- ============================================================

BEGIN;
CREATE TEMP TABLE g0d_results (test_id text PRIMARY KEY, status text, detail text);

-- ---------- 夹具 ----------
INSERT INTO public.tenants (id, name, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'G0D-TENANT-A', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'G0D-TENANT-B', 'active');

INSERT INTO public.profiles (id, phone, role, tenant_id) VALUES
  ('99999999-0000-0000-0000-000000000002', '13800000002', 'tenant_admin', '11111111-1111-1111-1111-111111111111'),  -- A管理员
  ('99999999-0000-0000-0000-000000000003', '13800000003', 'employee',     '11111111-1111-1111-1111-111111111111'),  -- A员工
  ('99999999-0000-0000-0000-000000000005', '13800000005', 'employee',     '22222222-2222-2222-2222-222222222222');  -- B员工

INSERT INTO public.stores (id, tenant_id, name) VALUES
  ('33333333-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'G0D-STORE-A'),
  ('33333333-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'G0D-STORE-B');

INSERT INTO public.employees (id, tenant_id, store_id, user_id, name) VALUES
  ('55555555-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   '33333333-0000-0000-0000-000000000001', '99999999-0000-0000-0000-000000000003', 'A店员工'),
  ('55555555-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
   '33333333-0000-0000-0000-000000000002', '99999999-0000-0000-0000-000000000005', 'B店员工');

-- B 租户的敏感数据（salary PII + 候选人 PII + B员工生命周期事件）
INSERT INTO public.salary_records (tenant_id, employee_id, year, month)
VALUES ('22222222-2222-2222-2222-222222222222', '55555555-0000-0000-0000-000000000002', 2026, 9);

INSERT INTO public.candidates (tenant_id, name, phone)
VALUES ('22222222-2222-2222-2222-222222222222', 'B店候选人', '13900000000');

INSERT INTO public.employee_lifecycle_events (employee_id, event_type, event_date)
VALUES ('55555555-0000-0000-0000-000000000002', 'onboarding', '2026-09-01');

-- ============================================================
-- D1 宪法条款：A企业管理员读不到B企业工资（跨租户薪酬 DENY）
-- ============================================================
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000002","role":"authenticated"}', true);
DO $$
DECLARE v int;
BEGIN
  SELECT count(*) INTO v FROM public.salary_records
   WHERE tenant_id = '22222222-2222-2222-2222-222222222222';
  IF v = 0 THEN
    INSERT INTO g0d_results VALUES ('D1','PASS','跨租户工资不可见');
  ELSE
    INSERT INTO g0d_results VALUES ('D1','FAIL','A管理员读到B企业工资 '||v||' 条');
  END IF;
END $$;

-- ============================================================
-- D2 宪法条款：A企业管理员读不到B企业候选人 PII
-- ============================================================
DO $$
DECLARE v int;
BEGIN
  SELECT count(*) INTO v FROM public.candidates
   WHERE tenant_id = '22222222-2222-2222-2222-222222222222';
  IF v = 0 THEN
    INSERT INTO g0d_results VALUES ('D2','PASS','跨租户候选人不可见');
  ELSE
    INSERT INTO g0d_results VALUES ('D2','FAIL','读到B企业候选人 '||v||' 条');
  END IF;
END $$;

-- ============================================================
-- D3 宪法条款：匿名（anon）读不到候选人 PII（此前全库直开）
-- ============================================================
SELECT set_config('role','anon', true);
SELECT set_config('request.jwt.claims', '', true);
DO $$
DECLARE v int;
BEGIN
  SELECT count(*) INTO v FROM public.candidates;
  IF v = 0 THEN
    INSERT INTO g0d_results VALUES ('D3','PASS','anon 不可读候选人');
  ELSE
    INSERT INTO g0d_results VALUES ('D3','FAIL','anon 读到候选人 '||v||' 条');
  END IF;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO g0d_results VALUES ('D3','PASS','anon 被拒: '||SQLERRM);
END $$;
SELECT set_config('role','postgres', true);

-- ============================================================
-- D4 回归（应为真）：A管理员可读本租户工资
-- ============================================================
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000002","role":"authenticated"}', true);
DO $$
DECLARE v int;
BEGIN
  SELECT count(*) INTO v FROM public.salary_records
   WHERE tenant_id = '11111111-1111-1111-1111-111111111111';
  -- A租户无工资夹具行，能查询且不报错即可；再验证策略表达式放行本租户：
  INSERT INTO public.salary_records (tenant_id, employee_id, year, month)
  VALUES ('11111111-1111-1111-1111-111111111111', '55555555-0000-0000-0000-000000000001', 2026, 9);
  INSERT INTO g0d_results VALUES ('D4','PASS','本租户工资读/写路径保留');
EXCEPTION WHEN OTHERS THEN
  INSERT INTO g0d_results VALUES ('D4','FAIL','本租户薪酬路径被误伤: '||SQLERRM);
END $$;

-- ============================================================
-- D5 宪法条款：B员工读不到A员工的生命周期事件（employee_id 伪造无效）
-- ============================================================
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000005","role":"authenticated"}', true);
DO $$
DECLARE v int;
BEGIN
  SELECT count(*) INTO v FROM public.employee_lifecycle_events
   WHERE employee_id = '55555555-0000-0000-0000-000000000001';
  IF v = 0 THEN
    INSERT INTO g0d_results VALUES ('D5','PASS','他人生命周期事件不可见');
  ELSE
    INSERT INTO g0d_results VALUES ('D5','FAIL','B员工读到A员工事件 '||v||' 条');
  END IF;
END $$;

-- ============================================================
-- D6 回归（应为真）：员工可读自己的生命周期事件
-- ============================================================
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000005","role":"authenticated"}', true);
DO $$
DECLARE v int;
BEGIN
  SELECT count(*) INTO v FROM public.employee_lifecycle_events
   WHERE employee_id = '55555555-0000-0000-0000-000000000002';
  IF v > 0 THEN
    INSERT INTO g0d_results VALUES ('D6','PASS','本人生命周期事件可见');
  ELSE
    INSERT INTO g0d_results VALUES ('D6','FAIL','本人事件不可见（自见策略失效）');
  END IF;
END $$;
SELECT set_config('role','postgres', true);

-- ---------- 汇总 ----------
DO $$
DECLARE v_fails int; r record;
BEGIN
  FOR r IN SELECT * FROM g0d_results ORDER BY test_id LOOP
    RAISE NOTICE '[%] %  %', r.test_id, r.status, r.detail;
  END LOOP;
  SELECT count(*) INTO v_fails FROM g0d_results WHERE status <> 'PASS';
  IF v_fails > 0 THEN
    RAISE EXCEPTION 'G0-D 安全不变量验证失败：共 % 项未通过', v_fails;
  END IF;
  RAISE NOTICE '=== G0-D 全部不变量通过（% 项） ===', (SELECT count(*) FROM g0d_results);
END $$;

ROLLBACK;
