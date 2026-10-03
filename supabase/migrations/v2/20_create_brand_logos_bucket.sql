/*
# 创建品牌Logo存储桶

## 功能说明
创建用于存储租户品牌Logo的Supabase Storage桶，支持管理员上传和管理品牌Logo图片。

## 创建内容
1. 创建brand_logos存储桶
2. 设置桶为公开访问（Logo需要公开展示）
3. 配置文件大小限制（最大1MB）
4. 配置允许的文件类型（图片格式）
5. 设置访问权限策略

## 权限说明
- 管理员（store_manager、tenant_admin、super_admin）可以上传、更新、删除Logo
- 所有用户可以查看Logo（公开访问）
*/

-- ============================================
-- 1. 创建品牌Logo存储桶
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'app-7daop8q0sxdt_brand_logos',
    'app-7daop8q0sxdt_brand_logos',
    true,  -- 公开访问
    1048576,  -- 1MB = 1024 * 1024 bytes
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']  -- 允许的图片格式
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. 设置存储桶访问权限策略
-- ============================================

-- 允许管理员上传Logo
CREATE POLICY "管理员可上传品牌Logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'app-7daop8q0sxdt_brand_logos'
    AND auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);

-- 允许管理员更新Logo
CREATE POLICY "管理员可更新品牌Logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'app-7daop8q0sxdt_brand_logos'
    AND auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);

-- 允许管理员删除Logo
CREATE POLICY "管理员可删除品牌Logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'app-7daop8q0sxdt_brand_logos'
    AND auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);

-- 允许所有人查看Logo（公开访问）
CREATE POLICY "所有人可查看品牌Logo"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-7daop8q0sxdt_brand_logos');

-- ============================================
-- 3. 添加说明注释
-- ============================================

COMMENT ON POLICY "管理员可上传品牌Logo" ON storage.objects IS '管理员可以上传品牌Logo图片';
COMMENT ON POLICY "管理员可更新品牌Logo" ON storage.objects IS '管理员可以更新品牌Logo图片';
COMMENT ON POLICY "管理员可删除品牌Logo" ON storage.objects IS '管理员可以删除品牌Logo图片';
COMMENT ON POLICY "所有人可查看品牌Logo" ON storage.objects IS '所有人都可以查看品牌Logo（公开访问）';
