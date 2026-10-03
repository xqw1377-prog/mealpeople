/*
# 修复邀请码生成函数

## 问题描述
原函数中使用了错误的字段名 `invitation_code`，实际表中的字段名是 `code`

## 修复内容
1. 修正字段名：将 `invitation_code` 改为 `code`
2. 确保函数正确检查邀请码的唯一性

## 函数详情
- **函数名**: generate_invitation_code
- **返回类型**: text
- **功能**: 生成8位随机邀请码，确保唯一性
*/

-- 重新创建邀请码生成函数（修复字段名）
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_value text;
  exists_count int;
  attempt int := 0;
  max_attempts int := 10;
BEGIN
  LOOP
    -- 生成8位随机邀请码（大写字母和数字）
    code_value := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- 检查是否已存在（使用正确的字段名 code）
    SELECT COUNT(*) INTO exists_count
    FROM invitation_codes
    WHERE code = code_value;
    
    -- 如果不存在，返回该邀请码
    IF exists_count = 0 THEN
      RETURN code_value;
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
