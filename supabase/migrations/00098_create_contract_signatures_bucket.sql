/*
# 创建劳动合同签名存储桶

## 1. 功能说明
创建用于存储劳动合同电子签名图片的 Storage Bucket

## 2. Bucket 配置
- Bucket 名称：contract_signatures
- 公开访问：是（签名图片需要在合同预览中显示）
- 文件大小限制：1MB（签名图片通常很小）
- 允许的文件类型：image/png, image/jpeg, image/jpg

## 3. 安全策略
- 只有认证用户可以上传签名
- 所有人可以查看签名（用于合同预览）
- 签名文件命名规则：{tenant_id}/{contract_id}/{timestamp}_{type}.png
  - type: employee（员工签名）或 company（公司签名）
*/

-- 创建 contract_signatures bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contract_signatures',
  'contract_signatures',
  true,
  1048576, -- 1MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 允许认证用户上传签名
CREATE POLICY "Authenticated users can upload signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contract_signatures');

-- 允许所有人查看签名（用于合同预览）
CREATE POLICY "Anyone can view signatures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contract_signatures');

-- 允许用户删除自己上传的签名
CREATE POLICY "Users can delete their own signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contract_signatures');