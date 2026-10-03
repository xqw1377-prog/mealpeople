/*
# 创建邀请码生成函数

## 功能说明
创建一个数据库函数用于生成唯一的邀请码，格式为8位随机字符串（大写字母和数字）

## 函数详情
- **函数名**: generate_invitation_code
- **返回类型**: text
- **功能**: 生成8位随机邀请码，确保唯一性

## 实现逻辑
1. 生成8位随机字符串（使用大写字母A-Z和数字0-9）
2. 检查是否已存在
3. 如果存在则重新生成，最多尝试10次
4. 返回唯一的邀请码

## 安全性
- 使用 SECURITY DEFINER 确保函数以定义者权限执行
- 设置 search_path 防止注入攻击
*/

-- 创建邀请码生成函数
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code text;
  exists_count int;
  attempt int := 0;
  max_attempts int := 10;
BEGIN
  LOOP
    -- 生成8位随机邀请码（大写字母和数字）
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- 检查是否已存在
    SELECT COUNT(*) INTO exists_count
    FROM invitation_codes
    WHERE invitation_code = code;
    
    -- 如果不存在，返回该邀请码
    IF exists_count = 0 THEN
      RETURN code;
    END IF;
    
    -- 增加尝试次数
    attempt := attempt + 1;
    
    -- 如果尝试次数超过最大值，抛出异常
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION '无法生成唯一邀请码，请稍后重试';
    END IF;
  END LOOP;
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION generate_invitation_code() IS '生成唯一的8位邀请码';
