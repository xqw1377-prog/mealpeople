-- ============================================================
-- G0-CLOSURE-R2（B-LINE，第二次静态预审 2 个确定性 blocker）
--
-- R2-1 membership_issuer_owner 的 RLS authority 补全
--   问题：三个 SECURITY DEFINER issuer 函数以该角色为 current_user
--   执行，其访问的 profiles/invitation_codes/invitation_code_uses/
--   invitation_redemption_attempts/employees/membership_audit/stores
--   均启用 RLS；该角色非 superuser/表owner/BYPASSRLS，也无适用于它
--   的 policy -> 默认拒绝 -> 合法 ALLOW 路径（签发/兑换/指派）全部
--   无法执行。此前 GRANT 只解决了 table privilege，未解决 RLS。
--
--   最小修复（不扩权限边界）：
--     NOLOGIN + BYPASSRLS + 仅既有最小列级 GRANT + 只能经受控
--     SECURITY DEFINER 函数使用。
--
--   附：create_invitation 的 R1-4 门店校验需要 stores 读取。
--
-- R2-2 Closing SQL 语法修复（tests 两个文件 ?> -> ?）不在本迁移，
--   见提交内文件变更。
-- ============================================================

-- R2-1a: 补 BYPASSRLS（保持 NOLOGIN；迁移由 postgres 执行，有权 ALTER ROLE）
ALTER ROLE membership_issuer_owner NOLOGIN BYPASSRLS;

-- R2-1b: 门店归属校验所需最小列读取
GRANT SELECT (id, tenant_id) ON public.stores TO membership_issuer_owner;

COMMENT ON ROLE membership_issuer_owner IS
  'G0-CLOSURE-R2: issuer 专用主体。NOLOGIN + BYPASSRLS + 最小列级 table privileges；仅可经 SECURITY DEFINER 函数（join_tenant_with_code / admin_assign_member_role / create_invitation）行使；不变量：rolcanlogin=false, rolbypassrls=true';
