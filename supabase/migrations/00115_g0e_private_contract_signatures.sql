-- ============================================================
-- G0-E: 合同签名 Storage 私有化（P0-SEC-07）
-- 背景：contract_signatures bucket 为 public（00098 建立，生产快照
--       schema.sql:29780 仍为 public=true），配合"Anyone can view
--       signatures"（SELECT TO PUBLIC）策略，员工手写签名图片
--       对全网匿名可下载（ Legal PII / 手写签名）。
--
-- 修复：
--   1. bucket 置为 private
--   2. 删除匿名查看策略；改为"系统内认证用户可查看"（保住合同
--      双方与管理端的显示链路，配合前端 useSignatureViewUrl
--      以签名 URL 方式访问；匿名网络直连一律 DENY）
--   3. 上传仍限认证用户；删除限本人（owner）或管理角色
--
-- 已知残留（记录在 docs/G0_SECURITY_REMEDIATION.md）：
--   * contract-pdf-generator.ts 引用了不存在的 bucket
--     app-7daop8q0sxdt_contract_signatures（更名前遗留缺陷，
--     与本迁移无关，LEGACY FREEZE 下不顺带修）
-- ============================================================

-- 1) bucket 私有化（幂等：已存在则更新）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('contract_signatures', 'contract_signatures', false, 1048576,
        ARRAY['image/png','image/jpeg','image/jpg'])
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2) 删除匿名查看策略
DROP POLICY IF EXISTS "Anyone can view signatures" ON storage.objects;

-- 3) 认证用户可查看（原公开能力的最小收窄：系统内仍可见，匿名不可见）
DROP POLICY IF EXISTS "Authenticated users can view signatures" ON storage.objects;
CREATE POLICY "Authenticated users can view signatures" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'contract_signatures');

-- 4) 上传：仅认证用户、仅本 bucket（保持 00098 行为）
DROP POLICY IF EXISTS "Authenticated users can upload signatures" ON storage.objects;
CREATE POLICY "Authenticated users can upload signatures" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contract_signatures');

-- 5) 删除：本人或管理角色（原策略缺 owner 判定则一并收紧）
DROP POLICY IF EXISTS "Users can delete their own signatures" ON storage.objects;
CREATE POLICY "Users can delete their own signatures" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'contract_signatures'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('store_manager', 'tenant_admin', 'super_admin')
      )
    )
  );
