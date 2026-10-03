-- ============================================================
-- G0-A 安全不变量测试（负向攻击测试）
-- 目标迁移：supabase/migrations/00111_g0a_harden_profiles_identity.sql
--
-- 运行方式（二选一）：
--   A. Supabase Dashboard -> SQL Editor：整段粘贴执行（以 postgres 身份）
--   B. psql："psql $SUPABASE_DB_URL -f supabase/tests/g0a_profiles_invariants.sql"
--
-- 机制：事务内打夹具 -> 以 set_config('role','authenticated') + 伪造 JWT claims
--       模拟各类攻击者 -> 断言越权被 DENY / 正常路径仍放行 -> ROLLBACK 不留痕。
-- 任何一项 FAIL 会在结尾整体 RAISE EXCEPTION，脚本以错误结束。
--
-- 判定纪律：不依赖"代码看起来正确"，只认脚本输出。
-- ============================================================

BEGIN;

-- ---------- 夹具（固定 UUID，事务结束全部回滚） ----------
CREATE TEMP TABLE g0_results (test_id text PRIMARY KEY, status text, detail text);

INSERT INTO public.tenants (id, name, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'G0A-FIXTURE-TENANT-A', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'G0A-FIXTURE-TENANT-B', 'active');

INSERT INTO public.profiles (id, phone, role, tenant_id) VALUES
  ('99999999-0000-0000-0000-000000000001', '13800000001', 'super_admin',   '11111111-1111-1111-1111-111111111111'),
  ('99999999-0000-0000-0000-000000000002', '13800000002', 'tenant_admin',  '11111111-1111-1111-1111-111111111111'),
  ('99999999-0000-0000-0000-000000000003', '13800000003', 'employee',      '11111111-1111-1111-1111-111111111111'),
  ('99999999-0000-0000-0000-000000000004', '13800000004', 'tenant_admin',  '22222222-2222-2222-2222-222222222222'),
  ('99999999-0000-0000-0000-000000000005', '13800000005', 'employee',      '22222222-2222-2222-2222-222222222222'),
  ('99999999-0000-0000-0000-000000000006', '13800000006', 'employee',      NULL);

-- ---------- 工具：以某用户身份执行 ----------
-- 用法三行连用：
--   SELECT set_config('role','authenticated', true);
--   SELECT set_config('request.jwt.claims', '{"sub":"<uuid>","role":"authenticated"}', true);
--   <攻击/操作语句>

-- ============================================================
-- T1 宪法条款：普通员工不能把自己变成管理员
-- ============================================================
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000003","role":"authenticated"}', true);
DO $$
BEGIN
  BEGIN
    UPDATE public.profiles SET role = 'super_admin'
     WHERE id = '99999999-0000-0000-0000-000000000003';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0_results VALUES ('T1','PASS','员工自提权被 DENY: '||SQLERRM);
    RETURN;
  END;
  INSERT INTO g0_results VALUES ('T1','FAIL','员工成功修改了自己的 role');
END $$;
SELECT set_config('role','postgres', true);

-- ============================================================
-- T2 宪法条款：员工不能横向移动到租户 B
-- ============================================================
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000003","role":"authenticated"}', true);
DO $$
BEGIN
  BEGIN
    UPDATE public.profiles SET tenant_id = '22222222-2222-2222-2222-222222222222'
     WHERE id = '99999999-0000-0000-0000-000000000003';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0_results VALUES ('T2','PASS','横向移动被 DENY: '||SQLERRM);
    RETURN;
  END;
  INSERT INTO g0_results VALUES ('T2','FAIL','员工成功变更了 tenant_id');
END $$;
SELECT set_config('role','postgres', true);

-- ============================================================
-- T3 宪法条款：认证用户不能插入 role=super_admin 的 profile（通道1）
-- ============================================================
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000003","role":"authenticated"}', true);
DO $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, phone, role, tenant_id)
    VALUES ('99999999-0000-0000-0000-000000000013', '13800000013', 'super_admin',
            '11111111-1111-1111-1111-111111111111');
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0_results VALUES ('T3','PASS','插入特权 profile 被 DENY: '||SQLERRM);
    RETURN;
  END;
  INSERT INTO g0_results VALUES ('T3','FAIL','成功插入 role=super_admin 的 profile');
END $$;
SELECT set_config('role','postgres', true);

-- ============================================================
-- T4 宪法条款：tenant_admin 不能改自己的 role（自封超级管理员）
-- ============================================================
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000002","role":"authenticated"}', true);
DO $$
BEGIN
  BEGIN
    UPDATE public.profiles SET role = 'super_admin'
     WHERE id = '99999999-0000-0000-0000-000000000002';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0_results VALUES ('T4','PASS','tenant_admin 自提权被 DENY: '||SQLERRM);
    RETURN;
  END;
  INSERT INTO g0_results VALUES ('T4','FAIL','tenant_admin 成功把自己提升为 super_admin');
END $$;
SELECT set_config('role','postgres', true);

-- ============================================================
-- T5 宪法条款：tenant_admin 不能把本租户成员提升为 super_admin（白名单外）
-- ============================================================
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000002","role":"authenticated"}', true);
DO $$
BEGIN
  BEGIN
    UPDATE public.profiles SET role = 'super_admin'
     WHERE id = '99999999-0000-0000-0000-000000000003';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0_results VALUES ('T5','PASS','越白名单授权被 DENY: '||SQLERRM);
    RETURN;
  END;
  INSERT INTO g0_results VALUES ('T5','FAIL','tenant_admin 成功授予 super_admin');
END $$;
SELECT set_config('role','postgres', true);

-- ============================================================
-- T6 回归（应为真）：tenant_admin 可将本租户成员升为 store_manager
-- ============================================================
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000002","role":"authenticated"}', true);
DO $$
DECLARE v text;
BEGIN
  UPDATE public.profiles SET role = 'store_manager'
   WHERE id = '99999999-0000-0000-0000-000000000003'
   RETURNING role::text INTO v;
  IF v = 'store_manager' THEN
    INSERT INTO g0_results VALUES ('T6','PASS','正常授权路径未被破坏');
  ELSE
    INSERT INTO g0_results VALUES ('T6','FAIL','更新成功但返回异常: '||COALESCE(v,'null'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO g0_results VALUES ('T6','FAIL','正常授权路径被误伤: '||SQLERRM);
END $$;
SELECT set_config('role','postgres', true);

-- ============================================================
-- T7 回归（应为真）：员工可修改自己的非特权字段（如 name）
-- ============================================================
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000003","role":"authenticated"}', true);
DO $$
BEGIN
  UPDATE public.profiles SET name = 'G0A回归测试' , role = role
   WHERE id = '99999999-0000-0000-0000-000000000003';
  IF NOT FOUND THEN
    INSERT INTO g0_results VALUES ('T7','FAIL','员工无法更新自己的资料(0行)');
  ELSE
    INSERT INTO g0_results VALUES ('T7','PASS','普通资料自更新未被破坏');
  END IF;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO g0_results VALUES ('T7','FAIL','普通资料自更新被误伤: '||SQLERRM);
END $$;
SELECT set_config('role','postgres', true);

-- ============================================================
-- T8 回归（应为真）：无租户员工首次加入租户（NULL -> A，role 保持 employee）
-- ============================================================
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000006","role":"authenticated"}', true);
DO $$
BEGIN
  UPDATE public.profiles SET tenant_id = '11111111-1111-1111-1111-111111111111'
   WHERE id = '99999999-0000-0000-0000-000000000006';
  IF NOT FOUND THEN
    INSERT INTO g0_results VALUES ('T8','FAIL','首次加入租户被拒(0行)');
  ELSE
    INSERT INTO g0_results VALUES ('T8','PASS','首次加入租户路径保留');
  END IF;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO g0_results VALUES ('T8','FAIL','首次加入租户路径被误伤: '||SQLERRM);
END $$;
SELECT set_config('role','postgres', true);

-- ============================================================
-- T9 宪法条款：租户 B 管理员触碰不到租户 A 的成员（RLS 不可见）
-- ============================================================
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000004","role":"authenticated"}', true);
DO $$
BEGIN
  UPDATE public.profiles SET role = 'store_manager'
   WHERE id = '99999999-0000-0000-0000-000000000003';  -- 租户A的员工
  IF FOUND THEN
    INSERT INTO g0_results VALUES ('T9','FAIL','跨租户成员竟然可见/可改');
  ELSE
    INSERT INTO g0_results VALUES ('T9','PASS','跨租户成员不可见（0行）');
  END IF;
END $$;
SELECT set_config('role','postgres', true);

-- ============================================================
-- T10 回归（应为真）：系统上下文（无JWT/SQL运维）不受守卫限制
-- ============================================================
DO $$
DECLARE v text;
BEGIN
  -- 当前为 postgres、无 JWT：模拟后台运维/GoTrue 触发器上下文
  UPDATE public.profiles SET role = 'tenant_admin'
   WHERE id = '99999999-0000-0000-0000-000000000003'  -- T6 已改为 store_manager
   RETURNING role::text INTO v;
  IF v = 'tenant_admin' THEN
    INSERT INTO g0_results VALUES ('T10','PASS','系统上下文不受限（运维路径保留）');
  ELSE
    INSERT INTO g0_results VALUES ('T10','FAIL','系统上下文被误伤');
  END IF;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO g0_results VALUES ('T10','FAIL','系统上下文被误伤: '||SQLERRM);
END $$;

-- ---------- 汇总 ----------
DO $$
DECLARE v_fails int; r record;
BEGIN
  FOR r IN SELECT * FROM g0_results ORDER BY test_id LOOP
    RAISE NOTICE '[%] %  %', r.test_id, r.status, r.detail;
  END LOOP;
  SELECT count(*) INTO v_fails FROM g0_results WHERE status <> 'PASS';
  IF v_fails > 0 THEN
    RAISE EXCEPTION 'G0-A 安全不变量验证失败：共 % 项未通过', v_fails;
  END IF;
  RAISE NOTICE '=== G0-A 全部不变量通过（% 项） ===', (SELECT count(*) FROM g0_results);
END $$;

ROLLBACK;  -- 夹具与全部变更不落库
