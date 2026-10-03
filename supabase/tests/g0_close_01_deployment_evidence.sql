-- ============================================================
-- G0 CLOSING RUN ①: Migration / Deployment Evidence
--（裁定 2026-10-03：工程整改 CLOSED，本文件只取证，不整改）
--
-- 用途：00111-00122 落库后在目标库执行，输出部署后的真实状态并断言
--       关键不变量。任何断言失败 = 部署状态与设计不符 = 证据不成立。
-- 运行：psql "$SUPABASE_DB_URL" -f g0_close_01_deployment_evidence.sql \
--         | tee ../run-logs/g0-close-01-deployment-<date>.txt
--       （或 SQL Editor 执行，全文复制存档）
-- ============================================================

\echo ============ G0 CLOSING ① DEPLOYMENT EVIDENCE ============
\echo run_at: :now

-- ---------- A. 迁移执行记录 ----------
-- 若项目使用 supabase_migrations，输出已应用版本；否则提示手工核对
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
              WHERE table_schema='supabase_migrations' AND table_name='schema_migrations') THEN
    RAISE NOTICE 'A1. supabase_migrations: %',
      (SELECT string_agg(version, ', ' ORDER BY version) FROM supabase_migrations.schema_migrations);
  ELSE
    RAISE NOTICE 'A1. 无 supabase_migrations 表——需人工核对本文件头部的逐条迁移执行输出';
  END IF;
END $$;

-- ---------- B. RLS 启用状态（本轮涉全部关键表） ----------
SELECT 'B. RLS enabled' AS section;
SELECT relname AS table_name, relrowsecurity AS rls_enabled
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND relname IN (
     'profiles','tenants','invitation_codes','invitation_code_uses',
     'invitation_redemption_attempts','membership_audit',
     'candidates','interviews','exit_interviews','resignation_requests',
     'employee_lifecycle_events','work_shifts','meal_periods',
     'efficiency_standards','daily_operations','schedule_plans',
     'schedule_plan_periods','schedule_results','part_time_shifts',
     'part_time_records','day_off_records','salary_structures',
     'salary_records','employee_benefits','benefit_usage_records'
   )
 ORDER BY relname;

-- ---------- C. 全部策略（public schema） ----------
SELECT 'C. public policies' AS section;
SELECT tablename, policyname, cmd, roles,
       qual AS using_expr, with_check
  FROM pg_policies
 WHERE schemaname = 'public'
 ORDER BY tablename, policyname;

-- ---------- D. Grants（裁定核对点：叠加权限语义） ----------
SELECT 'D1. table privileges (profiles / invitation 系) 给 authenticated' AS section;
SELECT table_name, privilege_type
  FROM information_schema.table_privileges
 WHERE table_schema='public' AND grantee='authenticated'
   AND table_name IN ('profiles','invitation_codes','invitation_code_uses',
                      'membership_audit','invitation_redemption_attempts')
 ORDER BY table_name, privilege_type;

SELECT 'D2. column privileges（应只有白名单）' AS section;
SELECT table_name, column_name, privilege_type
  FROM information_schema.column_privileges
 WHERE table_schema='public' AND grantee='authenticated'
   AND table_name IN ('profiles','invitation_codes')
 ORDER BY table_name, column_name, privilege_type;

-- ---------- E. SECURITY DEFINER 函数清单（裁定核对点） ----------
SELECT 'E1. DEFINER 函数: owner / search_path' AS section;
SELECT p.proname AS function,
       pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef AS security_definer,
       p.proconfig AS config
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname='public' AND p.prosecdef
 ORDER BY p.proname;

SELECT 'E2. EXECUTE grants（PUBLIC 必须为空；只允许 authenticated）' AS section;
SELECT routine_name, grantee
  FROM information_schema.routine_privileges
 WHERE routine_schema='public'
   AND routine_name IN ('join_tenant_with_code','admin_assign_member_role',
                        'create_invitation','generate_invitation_code')
 ORDER BY routine_name, grantee;

-- ---------- F. 专用主体 ----------
SELECT 'F. membership_issuer_owner' AS section;
SELECT rolname, rolcanlogin
  FROM pg_roles
 WHERE rolname = 'membership_issuer_owner';

-- ---------- G. Storage ----------
SELECT 'G1. buckets' AS section;
SELECT id, public, file_size_limit FROM storage.buckets ORDER BY id;
SELECT 'G2. storage policies (contract_signatures)' AS section;
SELECT policyname, cmd, roles, qual, with_check
  FROM pg_policies
 WHERE schemaname='storage'
   AND (qual ILIKE '%contract_signatures%' OR with_check ILIKE '%contract_signatures%')
 ORDER BY policyname;

-- ============================================================
-- H. 断言（任一失败即整份证据不成立）
-- ============================================================
DO $$
DECLARE
  v_bad_grant text;
  v_bad_owner text;
  v_bad_path text;
  v_public_exec text;
  v_true_using text;
  v_no_rls text;
BEGIN
  -- H1: profiles 对 authenticated 无 table-level UPDATE/INSERT
  SELECT string_agg(table_name || ':' || privilege_type, ', ')
    INTO v_bad_grant
    FROM information_schema.table_privileges
   WHERE table_schema='public' AND grantee='authenticated'
     AND table_name='profiles' AND privilege_type IN ('INSERT','UPDATE');
  IF v_bad_grant IS NOT NULL THEN
    RAISE EXCEPTION 'H1 FAIL: profiles 仍有 table-level %', v_bad_grant;
  END IF;

  -- H2: invitation_codes 对 authenticated 无 INSERT
  SELECT string_agg(privilege_type, ',') INTO v_bad_grant
    FROM information_schema.table_privileges
   WHERE table_schema='public' AND grantee='authenticated'
     AND table_name='invitation_codes' AND privilege_type='INSERT';
  IF v_bad_grant IS NOT NULL THEN
    RAISE EXCEPTION 'H2 FAIL: invitation_codes 仍可被 authenticated 直接 INSERT';
  END IF;

  -- H3: 三个 issuer/指派函数 owner = membership_issuer_owner
  SELECT string_agg(p.proname, ',') INTO v_bad_owner
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public'
     AND p.proname IN ('join_tenant_with_code','admin_assign_member_role','create_invitation')
     AND pg_get_userbyid(p.proowner) <> 'membership_issuer_owner';
  IF v_bad_owner IS NOT NULL THEN
    RAISE EXCEPTION 'H3 FAIL: owner 不是专用主体: %', v_bad_owner;
  END IF;

  -- H4: 全部 public DEFINER 函数 search_path 固定
  SELECT string_agg(p.proname, ',') INTO v_bad_path
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.prosecdef
     AND (p.proconfig IS NULL OR NOT EXISTS (
           SELECT 1 FROM unnest(p.proconfig) c
            WHERE c ILIKE 'search_path=%'));
  IF v_bad_path IS NOT NULL THEN
    RAISE EXCEPTION 'H4 FAIL: DEFINER 函数未固定 search_path: %', v_bad_path;
  END IF;

  -- H5: issuer 函数对 PUBLIC/anon 无 EXECUTE
  SELECT string_agg(routine_name || ':' || grantee, ', ') INTO v_public_exec
    FROM information_schema.routine_privileges
   WHERE routine_schema='public'
     AND routine_name IN ('join_tenant_with_code','admin_assign_member_role','create_invitation')
     AND grantee IN ('PUBLIC','anon');
  IF v_public_exec IS NOT NULL THEN
    RAISE EXCEPTION 'H5 FAIL: PUBLIC/anon 可执行: %', v_public_exec;
  END IF;

  -- H6: 本轮修复的表上无 USING(true) 全开策略残留
  SELECT string_agg(tablename || ':' || policyname, ', ') INTO v_true_using
    FROM pg_policies
   WHERE schemaname='public'
     AND (qual = 'true' OR with_check = 'true' OR qual ILIKE '%(true)%')
     AND tablename IN ('work_shifts','meal_periods','efficiency_standards',
         'daily_operations','schedule_plans','schedule_plan_periods',
         'schedule_results','part_time_shifts','part_time_records',
         'day_off_records','candidates','interviews','exit_interviews',
         'resignation_requests','employee_lifecycle_events',
         'salary_structures','salary_records','employee_benefits',
         'benefit_usage_records','profiles');
  IF v_true_using IS NOT NULL THEN
    RAISE EXCEPTION 'H6 FAIL: 全开策略残留: %', v_true_using;
  END IF;

  -- H7: 5 张此前无 RLS 的表现已启用
  SELECT string_agg(c.relname, ', ') INTO v_no_rls
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND NOT c.relrowsecurity
     AND c.relname IN ('candidates','interviews','exit_interviews',
                       'resignation_requests','employee_lifecycle_events');
  IF v_no_rls IS NOT NULL THEN
    RAISE EXCEPTION 'H7 FAIL: 仍未启用 RLS: %', v_no_rls;
  END IF;

  RAISE NOTICE '=== H. 断言全部通过（H1-H7） ===';
END $$;

\echo ============ G0 CLOSING ① END ============
