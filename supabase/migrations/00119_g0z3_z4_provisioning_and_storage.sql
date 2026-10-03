-- ============================================================
-- G0-Z3: TENANT_CREATION_POLICY = CONTROLLED_PROVISIONING（冻结）
--   公开 self-service 暂停（裁定 2026-10-03）。企业开通仅经：
--   a) super_admin（super-admin-create-tenant 管理端流程）
--   b) 平台 provisioning 通道（edge function + PROVISIONING_TOKEN，Z3 代码侧）
--   23 号迁移的 "认证用户可以创建租户 WITH CHECK(true)" 同步收回——
--   这是客户端直建租户（db/modules/tenant.ts createTenantWithAdmin）的真正闸门。
--
-- G0-Z4: 合同签名 Storage 写/删授权
--   INSERT：路径 {tenant_id}/{contract_id}/… 必须指向调用者有权的真实合同
--   DELETE：owner 本人 或 该租户管理角色（不再按 role 全局放行）
-- ============================================================

-- ---------- Z3: tenants 收回自助创建 ----------
DROP POLICY IF EXISTS "认证用户可以创建租户" ON tenants;
CREATE POLICY "超级管理员可创建租户" ON tenants
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));
-- 说明：service_role（平台 provisioning）不受 RLS 限制，通道保留在 edge function 层

-- ---------- Z4: 签名上传必须落到调用者有权的合同路径 ----------
DROP POLICY IF EXISTS "Authenticated users can upload signatures" ON storage.objects;
CREATE POLICY "合同相关方可上传签名" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'contract_signatures'
    AND owner = auth.uid()
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND EXISTS (
      SELECT 1
        FROM public.employment_contracts ec
       WHERE ec.id = (storage.foldername(name))[2]::uuid
         AND ec.tenant_id = (storage.foldername(name))[1]::uuid
         AND public.can_access_tenant(auth.uid(), ec.tenant_id)
         AND (
           EXISTS (
             SELECT 1 FROM public.employees e
              WHERE e.id = ec.employee_id AND e.user_id = auth.uid()
           )
           OR EXISTS (
             SELECT 1 FROM public.profiles p
              WHERE p.id = auth.uid()
                AND p.role IN ('store_manager','tenant_admin','super_admin')
           )
         )
    )
  );

-- ---------- Z4: 删除收紧为 owner 或同租户管理角色（原策略按 role 全局放行） ----------
DROP POLICY IF EXISTS "Users can delete their own signatures" ON storage.objects;
CREATE POLICY "合同相关方可删除签名" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'contract_signatures'
    AND (
      owner = auth.uid()
      OR (
        (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND EXISTS (
          SELECT 1 FROM public.employment_contracts ec
           WHERE ec.id = (storage.foldername(name))[2]::uuid
             AND ec.tenant_id = (storage.foldername(name))[1]::uuid
             AND public.can_access_tenant(auth.uid(), ec.tenant_id)
             AND EXISTS (
               SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid()
                  AND p.role IN ('store_manager','tenant_admin','super_admin')
             )
        )
      )
    )
  );
