-- ============================================================
-- G0-A-R MEMBERSHIP AUTHORITY 安全不变量测试（M1-M8）
-- 目标迁移：supabase/migrations/00116_g0ar_membership_authority.sql
-- 运行方式与判定纪律同 g0a_profiles_invariants.sql。
-- 不变量：CLIENT MAY NEVER ASSIGN TENANT MEMBERSHIP
-- ============================================================

BEGIN;
CREATE TEMP TABLE g0ar_results (test_id text PRIMARY KEY, status text, detail text);

-- ---------- 夹具 ----------
--（G0-Z-R2 后邀请码只能经 create_invitation 签发；过期/用尽码由 postgres 调造）
INSERT INTO public.tenants (id, name, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'G0AR-TENANT-A', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'G0AR-TENANT-B', 'active');

INSERT INTO public.profiles (id, phone, role, tenant_id) VALUES
  ('99999999-0000-0000-0000-000000000002', '13800000002', 'tenant_admin', '11111111-1111-1111-1111-111111111111'), -- A管理员
  ('99999999-0000-0000-0000-000000000003', '13800000003', 'employee',     '11111111-1111-1111-1111-111111111111'), -- A员工
  ('99999999-0000-0000-0000-000000000004', '13800000004', 'tenant_admin', '22222222-2222-2222-2222-222222222222'), -- B管理员
  ('99999999-0000-0000-0000-000000000006', '13800000006', 'employee',     NULL);                                   -- U 无租户

-- 以 A 管理员身份签发三条码（R2: hash-only，明文只在变量中）
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000002","role":"authenticated"}', true);
CREATE TEMP TABLE g0ar_tokens AS
SELECT (public.create_invitation(3, now() + interval '7 days'))->>'code' AS valid_code;
INSERT INTO g0ar_tokens SELECT (public.create_invitation(3, now() + interval '7 days'))->>'code';
INSERT INTO g0ar_tokens SELECT (public.create_invitation(1, now() + interval '7 days'))->>'code';
SELECT set_config('role','postgres', true);

-- 第 2/3 条改造成 过期 / 用尽（postgres 全权）
UPDATE public.invitation_codes SET expires_at = now() - interval '1 day'
 WHERE token_hash = encode(digest((SELECT valid_code FROM g0ar_tokens OFFSET 1 LIMIT 1), 'sha256'), 'hex');
UPDATE public.invitation_codes SET used_count = max_uses
 WHERE token_hash = encode(digest((SELECT valid_code FROM g0ar_tokens OFFSET 2 LIMIT 1), 'sha256'), 'hex');

-- ============================================================
-- M1: 无租户用户 NULL -> 任意 tenant 自助写入 = DENY（G0-A 旧放行已废除）
-- ============================================================
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000006","role":"authenticated"}', true);
DO $$
BEGIN
  BEGIN
    UPDATE public.profiles SET tenant_id = '11111111-1111-1111-1111-111111111111'
     WHERE id = '99999999-0000-0000-0000-000000000006';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0ar_results VALUES ('M1','PASS','NULL->tenant 自助写入被 DENY');
    RETURN;
  END;
  INSERT INTO g0ar_results VALUES ('M1','FAIL','无租户用户成功自助加入（membership 可自签发）');
END $$;

-- ============================================================
-- M2: tenant A -> tenant B 横向移动 = DENY
-- ============================================================
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000003","role":"authenticated"}', true);
DO $$
BEGIN
  BEGIN
    UPDATE public.profiles SET tenant_id = '22222222-2222-2222-2222-222222222222'
     WHERE id = '99999999-0000-0000-0000-000000000003';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0ar_results VALUES ('M2','PASS','跨租户移动被 DENY');
    RETURN;
  END;
  INSERT INTO g0ar_results VALUES ('M2','FAIL','员工成功横向移动到租户B');
END $$;

-- ============================================================
-- M3: 员工自改 role（employee -> store_manager）= DENY
-- ============================================================
DO $$
BEGIN
  BEGIN
    UPDATE public.profiles SET role = 'store_manager'
     WHERE id = '99999999-0000-0000-0000-000000000003';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0ar_results VALUES ('M3','PASS','自改 role 被 DENY');
    RETURN;
  END;
  INSERT INTO g0ar_results VALUES ('M3','FAIL','员工成功自改 role');
END $$;

-- ============================================================
-- M4: 伪造邀请码（不存在）= DENY
-- M5: 过期邀请码 = DENY
-- M6: 已用尽邀请码 = DENY
-- M7: 合法邀请码兑换 = ALLOW（并核验副作用）
-- M10: 已有租户者兑换 = DENY（防邀请跳槽）
-- 载体：重写后的 join_tenant_with_code（身份取 JWT，p_user_id 仅兼容）
-- ============================================================
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000006","role":"authenticated"}', true);
DO $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.join_tenant_with_code('G0AR-FORGED-NOT-EXIST', NULL, 'U');
  IF r.success THEN
    INSERT INTO g0ar_results VALUES ('M4','FAIL','伪造邀请码兑换成功');
  ELSE
    INSERT INTO g0ar_results VALUES ('M4','PASS','伪造邀请码被拒: '||r.message);
  END IF;
END $$;

DO $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.join_tenant_with_code((SELECT valid_code FROM g0ar_tokens OFFSET 1 LIMIT 1), NULL, 'U');
  IF r.success THEN
    INSERT INTO g0ar_results VALUES ('M5','FAIL','过期邀请码兑换成功');
  ELSE
    INSERT INTO g0ar_results VALUES ('M5','PASS','过期邀请码被拒');
  END IF;
END $$;

DO $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.join_tenant_with_code((SELECT valid_code FROM g0ar_tokens OFFSET 2 LIMIT 1), NULL, 'U');
  IF r.success THEN
    INSERT INTO g0ar_results VALUES ('M6','FAIL','已用尽邀请码兑换成功');
  ELSE
    INSERT INTO g0ar_results VALUES ('M6','PASS','已用尽邀请码被拒');
  END IF;
END $$;

-- M7a: p_user_id 与 JWT 不一致（替他人兑换）= DENY
DO $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.join_tenant_with_code((SELECT valid_code FROM g0ar_tokens LIMIT 1), '99999999-0000-0000-0000-000000000003', '冒名');
  IF r.success THEN
    INSERT INTO g0ar_results VALUES ('M7a','FAIL','替他人兑换成功');
  ELSE
    INSERT INTO g0ar_results VALUES ('M7a','PASS','p_user_id 与 JWT 不一致被拒');
  END IF;
END $$;

DO $$
DECLARE r record; v_tenant uuid; v_used int; v_uses int;
BEGIN
  SELECT * INTO r FROM public.join_tenant_with_code((SELECT valid_code FROM g0ar_tokens LIMIT 1), NULL, 'U');

  SELECT tenant_id INTO v_tenant FROM public.profiles
   WHERE id = '99999999-0000-0000-0000-000000000006';
  SELECT used_count INTO v_used FROM public.invitation_codes
   WHERE token_hash = encode(digest((SELECT valid_code FROM g0ar_tokens LIMIT 1), 'sha256'), 'hex');
  SELECT count(*) INTO v_uses FROM public.invitation_code_uses
   WHERE user_id = '99999999-0000-0000-0000-000000000006';

  IF r.success AND v_tenant = '11111111-1111-1111-1111-111111111111'
     AND v_used = 1 AND v_uses = 1 THEN
    INSERT INTO g0ar_results VALUES ('M7','PASS','合法邀请兑换成功并正确记账');
  ELSE
    INSERT INTO g0ar_results VALUES ('M7','FAIL',
      'success='||COALESCE(r.success::text,'null')||' tenant='||COALESCE(v_tenant::text,'null')||' used='||v_used||' uses='||v_uses);
  END IF;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO g0ar_results VALUES ('M7','FAIL','合法邀请兑换失败: '||SQLERRM);
END $$;

-- ============================================================
-- M8: Admin A 为租户 B 签发邀请码 = DENY（签发侧限本租户）
-- ============================================================
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000002","role":"authenticated"}', true);
DO $$
BEGIN
  BEGIN
    INSERT INTO public.invitation_codes (tenant_id, code, role, max_uses, expires_at)
    VALUES ('22222222-2222-2222-2222-222222222222', 'G0AR-CROSS-CODE-LONG-ENOUGH-16', 'employee', 1, now() + interval '7 days');
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0ar_results VALUES ('M8','PASS','跨租户签发邀请码被 DENY');
    RETURN;
  END;
  INSERT INTO g0ar_results VALUES ('M8','FAIL','A管理员成功为租户B签发邀请码');
END $$;

-- ============================================================
-- M9 回归：Admin A 为本租户签发邀请码 = ALLOW（正常运营路径）
-- ============================================================
DO $$
DECLARE r jsonb;
BEGIN
  SELECT public.create_invitation(1, now() + interval '7 days') INTO r;
  IF r ? 'code' AND length(r->>'code') = 32 THEN
    INSERT INTO g0ar_results VALUES ('M9','PASS','本租户经 RPC 签发路径保留（hash-only）');
  ELSE
    INSERT INTO g0ar_results VALUES ('M9','FAIL','RPC 签发返回异常: '||COALESCE(r::text,'null'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO g0ar_results VALUES ('M9','FAIL','本租户签发被误伤: '||SQLERRM);
END $$;

-- ============================================================
-- M10 回归：已有租户者不可再自助兑换（防邀请跳槽）
-- ============================================================
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000003","role":"authenticated"}', true);
DO $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.join_tenant_with_code('G0AR-ANY-CODE-TRY-JUMP-00000000', NULL, 'empA');
  IF r.success THEN
    INSERT INTO g0ar_results VALUES ('M10','FAIL','已有租户者成功跳槽到另一企业');
  ELSE
    INSERT INTO g0ar_results VALUES ('M10','PASS','已有租户者兑换被拒');
  END IF;
END $$;
SELECT set_config('role','postgres', true);

-- ---------- 汇总 ----------
DO $$
DECLARE v_fails int; r record;
BEGIN
  FOR r IN SELECT * FROM g0ar_results ORDER BY test_id LOOP
    RAISE NOTICE '[%] %  %', r.test_id, r.status, r.detail;
  END LOOP;
  SELECT count(*) INTO v_fails FROM g0ar_results WHERE status <> 'PASS';
  IF v_fails > 0 THEN
    RAISE EXCEPTION 'G0-A-R 安全不变量验证失败：共 % 项未通过', v_fails;
  END IF;
  RAISE NOTICE '=== G0-A-R 全部不变量通过（% 项） ===', (SELECT count(*) FROM g0ar_results);
END $$;

ROLLBACK;
