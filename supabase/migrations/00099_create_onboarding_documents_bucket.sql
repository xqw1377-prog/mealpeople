/*
# 创建入职文档存储桶

## 1. 功能说明
创建用于存储员工入职文档的 Storage Bucket，支持身份证、学历证明、健康证等各类文档

## 2. Bucket 配置
- Bucket 名称：onboarding_documents
- 公开访问：否（文档包含敏感信息，需要权限控制）
- 文件大小限制：5MB（支持扫描件和照片）
- 允许的文件类型：image/png, image/jpeg, image/jpg, application/pdf

## 3. 安全策略
- 只有认证用户可以上传文档
- 用户只能查看自己的文档
- 用户可以删除自己的文档
- 管理员可以查看所有文档

## 4. 文件命名规则
- {employee_id}/{document_type}/{timestamp}_{filename}
- 例如：123e4567-e89b-12d3-a456-426614174000/id_card/1699999999_front.jpg
*/

-- 创建 onboarding_documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'onboarding_documents',
  'onboarding_documents',
  false, -- 不公开，需要权限控制
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 允许认证用户上传文档
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'onboarding_documents');

-- 用户只能查看自己的文档（通过文件路径中的employee_id判断）
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'onboarding_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 用户可以删除自己的文档
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'onboarding_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 管理员可以查看所有文档
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'onboarding_documents' AND
  is_admin(auth.uid())
);