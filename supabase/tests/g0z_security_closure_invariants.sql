-- ============================================================
-- G0-Z SECURITY CLOSURE 安全不变量测试（Z1-Z4 数据库层）
-- 目标迁移：00117（issuer authority）/ 00118（invite credential）/
--           00119（provisioning + storage）
-- 运行方式与判定纪律同 g0a_profiles_invariants.sql。
-- Z5 真实 JWT 黑盒矩阵见 g0z_blackbox_matrix.sh（G0 PASS 的最终证据）。
-- ============================================================

BEGIN;
CREATE TEMP TABLE g0z_results (test_id text PRIMARY KEY, status text, detail text);

-- ---------- 夹具 ----------
INSERT INTO public.tenants (id, name, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'G0Z-TENANT-A', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'G0Z-TENANT-B', 'active');

INSERT INTO public.profiles (id, phone, role, tenant_id) VALUES
  ('99999999-0000-0000-0000-000000000002', '13800000002', 'tenant_admin', '11111111-1111-1111-1111-111111111111'),
  ('99999999-0000-0000-0000-000000000003', '13800000003', 'employee',     '11111111-1111-1111-1111-111111111111'),
  ('99999999-0000-0000-0000-000000000004', '13800000004', 'tenant_admin', '22222222-2222-2222-2222-222222222222'),
  ('99999999-0000-0000-0000-000000000006', '13800000006', 'employee',     NULL);

-- R2: 邀请码只能经 create_invitation 签发（hash-only）；调造由 postgres 完成
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000002","role":"authenticated"}', true);
CREATE TEMP TABLE g0z_tokens AS
SELECT (public.create_invitation(3, now() + interval '7 days'))->>'code' AS valid_code;
INSERT INTO g0z_tokens SELECT (public.create_invitation(3, now() + interval '7 days'))->>'code'; -- -> 过期
INSERT INTO g0z_tokens SELECT (public.create_invitation(3, now() + interval '7 days'))->>'code'; -- -> store_manager
INSERT INTO g0z_tokens SELECT (public.create_invitation(1, now() + interval '7 days'))->>'code'; -- -> 用尽
SELECT set_config('role','postgres', true);

UPDATE public.invitation_codes SET expires_at = now() - interval '1 day'
 WHERE token_hash = encode(digest((SELECT valid_code FROM g0z_tokens OFFSET 1 LIMIT 1), 'sha256'), 'hex');
UPDATE public.invitation_codes SET role = 'store_manager'
 WHERE token_hash = encode(digest((SELECT valid_code FROM g0z_tokens OFFSET 2 LIMIT 1), 'sha256'), 'hex');
UPDATE public.invitation_codes SET used_count = max_uses
 WHERE token_hash = encode(digest((SELECT valid_code FROM g0z_tokens OFFSET 3 LIMIT 1), 'sha256'), 'hex');

-- ============================================================
-- Z1-1/Z1-2: authenticated 直写 protected columns（含同值写）= DENY
-- ============================================================
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000003","role":"authenticated"}', true);
DO $$
BEGIN
  BEGIN
    UPDATE public.profiles SET role = role
     WHERE id = '99999999-0000-0000-0000-000000000003';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0z_results VALUES ('Z1-1','PASS','SET role=role 同值写被列级权限 DENY');
    RETURN;
  END;
  INSERT INTO g0z_results VALUES ('Z1-1','FAIL','role 列仍可直写');
END $$;

DO $$
BEGIN
  BEGIN
    UPDATE public.profiles SET tenant_id = tenant_id
     WHERE id = '99999999-0000-0000-0000-000000000003';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0z_results VALUES ('Z1-2','PASS','SET tenant_id=tenant_id 同值写被列级权限 DENY');
    RETURN;
  END;
  INSERT INTO g0z_results VALUES ('Z1-2','FAIL','tenant_id 列仍可直写');
END $$;

-- ============================================================
-- Z1-3: admin_assign_member_role——Admin A 升本租户成员 = ALLOW
-- Z1-4: Admin A 指派租户 B 成员 = DENY
-- Z1-5: Admin A 改自己 = DENY
-- Z1-6: Admin A 授 super_admin = DENY（白名单外）
-- ============================================================
DO $$
DECLARE r jsonb;
BEGIN
  SELECT public.admin_assign_member_role('99999999-0000-0000-0000-000000000003', 'store_manager') INTO r;
  IF r->>'role' = 'store_manager' THEN
    INSERT INTO g0z_results VALUES ('Z1-3','PASS','本租户指派路径保留');
  ELSE
    INSERT INTO g0z_results VALUES ('Z1-3','FAIL','返回异常: '||COALESCE(r::text,'null'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO g0z_results VALUES ('Z1-3','FAIL','本租户指派被误伤: '||SQLERRM);
END $$;

DO $$
BEGIN
  BEGIN
    PERFORM public.admin_assign_member_role('99999999-0000-0000-0000-000000000004', 'employee');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO g0z_results VALUES ('Z1-4','PASS','跨租户指派被 DENY');
    RETURN;
  END;
  INSERT INTO g0z_results VALUES ('Z1-4','FAIL','Admin A 成功指派租户 B 成员');
END $$;

DO $$
BEGIN
  BEGIN
    PERFORM public.admin_assign_member_role('99999999-0000-0000-0000-000000000002', 'tenant_admin');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO g0z_results VALUES ('Z1-5','PASS','自改角色被 DENY');
    RETURN;
  END;
  INSERT INTO g0z_results VALUES ('Z1-5','FAIL','Admin A 成功修改自己角色');
END $$;

DO $$
BEGIN
  BEGIN
    PERFORM public.admin_assign_member_role('99999999-0000-0000-0000-000000000003', 'super_admin');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO g0z_results VALUES ('Z1-6','PASS','授 super_admin 被白名单 DENY');
    RETURN;
  END;
  INSERT INTO g0z_results VALUES ('Z1-6','FAIL','super_admin 可经指派 RPC 授予');
END $$;

-- ============================================================
-- Z1-7: 审计账本 append-only——Admin A 改/删 membership_audit = DENY
-- ============================================================
DO $$
BEGIN
  BEGIN
    UPDATE public.membership_audit SET new_role = 'super_admin';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0z_results VALUES ('Z1-7','PASS','审计账本 UPDATE 被 DENY');
    RETURN;
  END;
  INSERT INTO g0z_results VALUES ('Z1-7','FAIL','审计账本可被篡改');
END $$;

-- ============================================================
-- Z2-1: 兑换错误文案统一（invalid/expired/exhausted/mgr-role 同文案）
-- Z2-3: store_manager 邀请码自助兑换 = DENY（bearer 只发 employee）
-- ============================================================
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000006","role":"authenticated"}', true);
DO $$
DECLARE m1 text; m2 text; m3 text; m4 text; r record;
BEGIN
  SELECT * INTO r FROM public.join_tenant_with_code('G0Z-NOT-EXIST-0000000000000', NULL, 'U'); m1 := r.message;
  SELECT * INTO r FROM public.join_tenant_with_code((SELECT valid_code FROM g0z_tokens OFFSET 1 LIMIT 1), NULL, 'U'); m2 := r.message;
  SELECT * INTO r FROM public.join_tenant_with_code((SELECT valid_code FROM g0z_tokens OFFSET 3 LIMIT 1), NULL, 'U'); m3 := r.message;
  SELECT * INTO r FROM public.join_tenant_with_code((SELECT valid_code FROM g0z_tokens OFFSET 2 LIMIT 1), NULL, 'U'); m4 := r.message;

  IF m1 IS NOT DISTINCT FROM m2 AND m2 IS NOT DISTINCT FROM m3 AND m3 IS NOT DISTINCT FROM m4
     AND m1 = '邀请码无效或不可用' THEN
    INSERT INTO g0z_results VALUES ('Z2-1','PASS','四类拒绝统一文案（无 oracle）');
  ELSE
    INSERT INTO g0z_results VALUES ('Z2-1','FAIL',
      '文案不一致: '||COALESCE(m1,'?')||'/'||COALESCE(m2,'?')||'/'||COALESCE(m3,'?')||'/'||COALESCE(m4,'?'));
  END IF;
END $$;

-- ============================================================
-- Z2-2: 限流——连续失败达到阈值后，合法码也被暂时拒绝
-- ============================================================
DO $$
DECLARE i int; r record; blocked boolean := false;
BEGIN
  -- 已累计 4 次失败（Z2-1），再补 6 次到 10
  FOR i IN 1..6 LOOP
    SELECT * INTO r FROM public.join_tenant_with_code('G0Z-NOT-EXIST-0000000000000', NULL, 'U');
  END LOOP;
  SELECT * INTO r FROM public.join_tenant_with_code((SELECT valid_code FROM g0z_tokens LIMIT 1), NULL, 'U');
  IF NOT r.success AND r.message LIKE '%频繁%' THEN
    blocked := true;
  END IF;
  IF blocked THEN
    INSERT INTO g0z_results VALUES ('Z2-2','PASS','限流生效（合法码在窗口内也被暂拒）');
  ELSE
    INSERT INTO g0z_results VALUES ('Z2-2','FAIL','限流未生效: '||COALESCE(r.message,'?'));
  END IF;
END $$;

-- ============================================================
-- Z2-4: 管理员不可篡改兑换历史 / used_count
-- ============================================================
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000002","role":"authenticated"}', true);
DO $$
BEGIN
  BEGIN
    UPDATE public.invitation_code_uses SET role_granted = 'super_admin';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0z_results VALUES ('Z2-4','PASS','兑换历史 UPDATE 被 DENY');
    RETURN;
  END;
  INSERT INTO g0z_results VALUES ('Z2-4','FAIL','兑换历史可被篡改');
END $$;

DO $$
BEGIN
  BEGIN
    UPDATE public.invitation_codes SET used_count = 0
     WHERE token_hash = encode(digest((SELECT valid_code FROM g0z_tokens LIMIT 1), 'sha256'), 'hex');
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0z_results VALUES ('Z2-5','PASS','used_count 手改被 DENY');
    RETURN;
  END;
  INSERT INTO g0z_results VALUES ('Z2-5','FAIL','used_count 可被管理员手改');
END $$;

-- ============================================================
-- Z2-6: 新签发邀请码必须高熵（<16 位 INSERT 被 DENY）
-- ============================================================
DO $$
BEGIN
  BEGIN
    INSERT INTO public.invitation_codes (tenant_id, code, role, max_uses, expires_at)
    VALUES ('11111111-1111-1111-1111-111111111111', 'EVEN32CHARSERVERLOOKINGCODE1234', NULL, 'employee', 1, now() + interval '7 days');
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0z_results VALUES ('Z2-6','PASS','authenticated 直插邀请码被 DENY（仅服务端签发）');
    RETURN;
  END;
  INSERT INTO g0z_results VALUES ('Z2-6','FAIL','仍可签发可猜短码');
END $$;

-- ============================================================
-- Z3-1: 普通认证用户创建租户 = DENY（CONTROLLED_PROVISIONING）
-- ============================================================
DO $$
BEGIN
  BEGIN
    INSERT INTO public.tenants (name, status) VALUES ('G0Z-攻击租户', 'active');
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0z_results VALUES ('Z3-1','PASS','自助创建租户被 DENY');
    RETURN;
  END;
  INSERT INTO g0z_results VALUES ('Z3-1','FAIL','普通用户仍可自建企业');
END $$;

-- ============================================================
-- Z2-7 回归: 清空限流后，合法 employee 邀请兑换 = ALLOW（issuer 路径未被列权限误伤）
--（attempts 表对 authenticated 全撤权，清理须以 postgres 身份）
-- ============================================================
SELECT set_config('role','postgres', true);
DELETE FROM public.invitation_redemption_attempts
 WHERE user_id = '99999999-0000-0000-0000-000000000006';
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000006","role":"authenticated"}', true);
DO $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.join_tenant_with_code((SELECT valid_code FROM g0z_tokens LIMIT 1), NULL, 'U');
  IF r.success AND r.role = 'employee' THEN
    INSERT INTO g0z_results VALUES ('Z2-7','PASS','合法邀请兑换成功（employee）');
  ELSE
    INSERT INTO g0z_results VALUES ('Z2-7','FAIL','合法兑换失败: '||COALESCE(r.message,'?'));
  END IF;
END $$;
SELECT set_config('role','postgres', true);

-- ============================================================
-- R2-1a 回归: 白名单列 name 可自助更新（ALLOW）
-- ============================================================
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000003","role":"authenticated"}', true);
DO $$
BEGIN
  UPDATE public.profiles SET name = 'G0Z白名单回归'
   WHERE id = '99999999-0000-0000-0000-000000000003';
  IF NOT FOUND THEN
    INSERT INTO g0z_results VALUES ('R2-1a','FAIL','白名单列更新 0 行');
  ELSE
    INSERT INTO g0z_results VALUES ('R2-1a','PASS','白名单列(name)自助更新保留');
  END IF;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO g0z_results VALUES ('R2-1a','FAIL','白名单列被误伤: '||SQLERRM);
END $$;

-- ============================================================
-- R2-1b: 白名单外身份列 wechat_openid 直写（解绑路径）= DENY
-- ============================================================
DO $$
BEGIN
  BEGIN
    UPDATE public.profiles SET wechat_openid = NULL
     WHERE id = '99999999-0000-0000-0000-000000000003';
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO g0z_results VALUES ('R2-1b','PASS','身份列直写被 DENY');
    RETURN;
  END;
  INSERT INTO g0z_results VALUES ('R2-1b','FAIL','wechat_openid 仍可客户端直写');
END $$;

-- ============================================================
-- R2-2a: create_invitation 一次性明文，DB 只存 hash/hint
-- ============================================================
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000002","role":"authenticated"}', true);
DO $$
DECLARE r jsonb; v_row record; v_token text;
BEGIN
  SELECT public.create_invitation(1, now() + interval '1 day') INTO r;
  v_token := r->>'code';
  SELECT code, token_hash, token_hint INTO v_row FROM public.invitation_codes
   WHERE token_hash = encode(digest(v_token, 'sha256'), 'hex');
  IF length(v_token) = 32 AND v_row.code IS NULL
     AND v_row.token_hint = right(v_token, 4) THEN
    INSERT INTO g0z_results VALUES ('R2-2a','PASS','hash-only 落库 + 一次性明文');
  ELSE
    INSERT INTO g0z_results VALUES ('R2-2a','FAIL','落库形态不符');
  END IF;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO g0z_results VALUES ('R2-2a','FAIL','签发异常: '||SQLERRM);
END $$;

-- ============================================================
-- R2-2b: employee 调 create_invitation = DENY
-- ============================================================
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000003","role":"authenticated"}', true);
DO $$
BEGIN
  BEGIN
    PERFORM public.create_invitation(1, now() + interval '1 day');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO g0z_results VALUES ('R2-2b','PASS','非管理员签发被 DENY');
    RETURN;
  END;
  INSERT INTO g0z_results VALUES ('R2-2b','FAIL','employee 成功签发邀请码');
END $$;

-- ============================================================
-- R2-3: 明文 code 列不再是凭证（postgres 造 active 明文码 -> 兑换 DENY）
-- ============================================================
SELECT set_config('role','postgres', true);
INSERT INTO public.invitation_codes (tenant_id, code, role, max_uses, expires_at, status)
VALUES ('11111111-1111-1111-1111-111111111111', 'LEGACYPLAIN8', 'employee', 1, now() + interval '7 days', 'active');
SELECT set_config('role','authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000006","role":"authenticated"}', true);
DO $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.join_tenant_with_code('LEGACYPLAIN8', NULL, 'U');
  IF r.success THEN
    INSERT INTO g0z_results VALUES ('R2-3','FAIL','明文 code 列仍可兑换');
  ELSE
    INSERT INTO g0z_results VALUES ('R2-3','PASS','明文 code 列不再是凭证');
  END IF;
END $$;
SELECT set_config('role','postgres', true);

-- ---------- 汇总 ----------
DO $$
DECLARE v_fails int; r record;
BEGIN
  FOR r IN SELECT * FROM g0z_results ORDER BY test_id LOOP
    RAISE NOTICE '[%] %  %', r.test_id, r.status, r.detail;
  END LOOP;
  SELECT count(*) INTO v_fails FROM g0z_results WHERE status <> 'PASS';
  IF v_fails > 0 THEN
    RAISE EXCEPTION 'G0-Z 安全不变量验证失败：共 % 项未通过', v_fails;
  END IF;
  RAISE NOTICE '=== G0-Z 数据库层不变量全部通过（% 项） ===', (SELECT count(*) FROM g0z_results);
END $$;

ROLLBACK;
