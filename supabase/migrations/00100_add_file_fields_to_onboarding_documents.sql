/*
# 为入职文档表添加文件相关字段

## 1. 功能说明
为 onboarding_documents 表添加文件存储相关字段，支持文档上传功能

## 2. 新增字段
- file_url: 文档文件URL（存储在 Supabase Storage 中的路径）
- file_type: 文件类型（image/pdf）
- file_size: 文件大小（字节）
- file_name: 原始文件名
- uploaded_at: 上传时间

## 3. 字段说明
- file_url 为空表示文档未上传
- file_url 不为空表示文档已上传
- 上传文档后自动更新 status 为 'uploaded'
*/

-- 添加文件相关字段
ALTER TABLE onboarding_documents
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;

-- 添加注释
COMMENT ON COLUMN onboarding_documents.file_url IS '文档文件URL（Supabase Storage路径）';
COMMENT ON COLUMN onboarding_documents.file_type IS '文件类型（image/jpeg, image/png, application/pdf）';
COMMENT ON COLUMN onboarding_documents.file_size IS '文件大小（字节）';
COMMENT ON COLUMN onboarding_documents.file_name IS '原始文件名';
COMMENT ON COLUMN onboarding_documents.uploaded_at IS '上传时间';