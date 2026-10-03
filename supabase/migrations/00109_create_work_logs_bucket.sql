/*
# 创建工作记录文件存储桶

## 1. 存储桶配置
- 桶名称：app-7daop8q0sxdt_work_logs
- 公开访问：是
- 文件大小限制：10MB
- 允许的文件类型：图片和视频

## 2. 安全策略
- 认证用户可以上传文件
- 所有人可以查看文件
*/

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-7daop8q0sxdt_work_logs',
  'app-7daop8q0sxdt_work_logs',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- 允许认证用户上传文件
CREATE POLICY "认证用户可以上传工作记录文件" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'app-7daop8q0sxdt_work_logs');

-- 允许所有人查看文件
CREATE POLICY "所有人可以查看工作记录文件" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'app-7daop8q0sxdt_work_logs');

-- 允许用户删除自己上传的文件
CREATE POLICY "用户可以删除自己的工作记录文件" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'app-7daop8q0sxdt_work_logs' AND owner = auth.uid());