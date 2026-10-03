/*
# 修复OTP登录时Profile创建问题

## 问题描述
用户使用OTP（电话验证码）登录时，提示"无法获取用户信息"。
原因是触发器只在confirmed_at从NULL变为非NULL时触发，但OTP登录可能不会触发这个条件。

## 解决方案
1. 修改触发器，支持多种触发条件
2. 添加INSERT触发器，确保新用户创建时自动创建profile
3. 优化触发器逻辑，避免重复插入

## 变更内容
1. 修改handle_new_user函数，支持INSERT和UPDATE触发
2. 添加INSERT触发器
3. 添加错误处理，避免重复插入导致的错误
*/

-- 删除旧的触发器
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 重新创建handle_new_user函数，支持INSERT和UPDATE
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_count int;
    profile_exists boolean;
BEGIN
    -- 检查profile是否已存在
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = NEW.id) INTO profile_exists;
    
    -- 如果profile已存在，直接返回
    IF profile_exists THEN
        RETURN NEW;
    END IF;
    
    -- 判断profiles表里有多少用户
    SELECT COUNT(*) INTO user_count FROM profiles;
    
    -- 插入profiles，首位用户给 super_admin 角色
    BEGIN
        INSERT INTO profiles (id, phone, email, role)
        VALUES (
            NEW.id,
            NEW.phone,
            NEW.email,
            CASE WHEN user_count = 0 THEN 'super_admin'::user_role ELSE 'employee'::user_role END
        )
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION
        WHEN OTHERS THEN
            -- 忽略重复插入错误
            NULL;
    END;
    
    RETURN NEW;
END;
$$;

-- 创建INSERT触发器（新用户注册时）
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 创建UPDATE触发器（用户确认时）
CREATE TRIGGER on_auth_user_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
    EXECUTE FUNCTION handle_new_user();
