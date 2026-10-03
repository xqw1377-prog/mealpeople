/*
# 修复OTP登录时的Profile创建问题

## 问题描述
当前的触发器只在 confirmed_at 从 NULL → 非 NULL 时创建 profile
但是 OTP 登录时，用户可能已经存在但没有 profile 记录

## 解决方案
1. 修改触发器，支持 INSERT 和 UPDATE 两种情况
2. 使用 INSERT ON CONFLICT 避免重复插入
3. 确保每次 OTP 登录都能正确创建或更新 profile

## 修改内容
- 修改 handle_new_user 函数，支持 INSERT 操作
- 修改触发器，同时监听 INSERT 和 UPDATE 事件
*/

-- 删除旧触发器
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- 重新创建函数，支持 INSERT 和 UPDATE
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_count int;
    user_role user_role;
BEGIN
    -- 判断 profiles 表里有多少用户
    SELECT COUNT(*) INTO user_count FROM profiles;
    
    -- 确定用户角色：首位用户为 super_admin，其他为 employee
    IF user_count = 0 THEN
        user_role := 'super_admin'::user_role;
    ELSE
        user_role := 'employee'::user_role;
    END IF;
    
    -- 插入或更新 profiles
    -- 使用 ON CONFLICT 避免重复插入
    INSERT INTO profiles (id, phone, email, role)
    VALUES (
        NEW.id,
        NEW.phone,
        NEW.email,
        user_role
    )
    ON CONFLICT (id) DO UPDATE SET
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        email = COALESCE(EXCLUDED.email, profiles.email),
        updated_at = now();
    
    RETURN NEW;
END;
$$;

-- 创建新触发器，同时监听 INSERT 和 UPDATE
CREATE TRIGGER on_auth_user_created_or_confirmed
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    WHEN (NEW.phone IS NOT NULL OR NEW.email IS NOT NULL)
    EXECUTE FUNCTION handle_new_user();
