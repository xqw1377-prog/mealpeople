-- ============================================================
-- G0 CLOSING RUN ④: After-state Evidence（黑盒攻击后核验）
--（只取证，不整改）
--
-- 用途：每轮黑盒攻击（B1-B5/E2/E4/D1-D3/F1-F3）之后执行，
--       证明数据库真实状态未因攻击改变——HTTP 状态码不是完整证据。
-- 运行：postgres/service 身份执行；攻击窗口前后各一次，输出成对存档。
--       psql "$SUPABASE_DB_URL" -f g0_close_02_after_state.sql \
--         -v emp_a="'<EMP_A_ID>'" -v emp_b="'<EMP_B_ID>'"
--       （或 SQL Editor 执行前替换下方两个 :emp 占位为真实 UUID）
-- ============================================================

\echo ============ G0 CLOSING ④ AFTER-STATE ============

-- ---------- S1. profiles 关键字段未变 ----------
-- 期望：role/tenant_id 与攻击前快照一致（攻击者仍为 employee / 原租户）
SELECT id, role, tenant_id, wechat_openid IS NOT NULL AS has_openid
  FROM public.profiles
 WHERE id IN ('<EMP_A_ID>'::uuid, '<EMP_B_ID>'::uuid);

-- ---------- S2. membership_audit：无未授权签发事件 ----------
-- 期望：只有预期来源（admin_assign 的合法操作）；
--       黑盒攻击窗口内不应出现 actor=测试员工 的新行
SELECT granted_at, actor, target_user, old_role, new_role, source
  FROM public.membership_audit
 WHERE granted_at > now() - interval '30 minutes'
 ORDER BY granted_at;

-- ---------- S3. 邀请码：used_count 与兑换记录一致 ----------
-- 期望：每条 uses 对应一次合法兑换；非法尝试不产生 uses、不增加 used_count
SELECT ic.token_hint, ic.used_count, ic.max_uses,
       (SELECT count(*) FROM public.invitation_code_uses u
         WHERE u.invitation_code_id = ic.id) AS uses_rows
  FROM public.invitation_codes ic
 WHERE ic.status = 'active'
 ORDER BY ic.created_at DESC LIMIT 10;

-- ---------- S4. 无未授权 membership 产生 ----------
-- 期望：无租户用户 U 的 tenant_id 仍为 NULL（除非执行过合法兑换 ALLOW 用例）
SELECT id, role, tenant_id
  FROM public.profiles
 WHERE tenant_id IS NULL AND role = 'employee';

-- ---------- S5. 断言（黑盒 DENY 用例全部执行后） ----------
DO $$
DECLARE
  v_changed int;
BEGIN
  -- 若已完成合法兑换（valid invite ALLOW）用例，此断言按 RUNBOOK 记录豁免
  SELECT count(*) INTO v_changed
    FROM public.profiles
   WHERE tenant_id IS NOT NULL
     AND id NOT IN (SELECT coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid)
                      FROM public.invitation_code_uses)
     -- g0bb 黑盒夹具用户（平台置备的测试身份，run-logs/blackbox-env.sh 留档；非攻击产物）
     AND id NOT IN ('c57cb78e-027b-4303-a5b1-942a55c5bc53','65dce022-39b8-4d84-9d7c-20bbbdb97516',
                    '10d855a3-254d-4c4f-83a7-cebe388ab713','dedd631b-4b3a-47e0-99e4-ea96e3947c33');
  IF v_changed > 0 THEN
    RAISE EXCEPTION 'S5 FAIL: 存在无兑换记录却拥有租户的 profile（% 行）——疑似未授权 membership', v_changed;
  END IF;
  RAISE NOTICE '=== S5. 无未授权 membership（黑盒 DENY 用例后） ===';
END $$;

\echo ============ G0 CLOSING ④ END ============
\echo Storage after-state（人工）: 对被攻击对象用旧/新 signed URL 各下载一次，
\echo sha256sum 对比字节一致（E4 overwrite 用例）：期望相同。
