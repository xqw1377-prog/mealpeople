/*
# 添加微信登录支持

## 1. 表结构变更
- 在 `profiles` 表中添加以下字段：
  - `wechat_openid` (text, unique) - 微信小程序的 openid，用于唯一标识用户
  - `wechat_unionid` (text, unique) - 微信开放平台的 unionid，用于跨应用识别（可选）
  - `wechat_nickname` (text) - 微信昵称
  - `wechat_avatar` (text) - 微信头像URL

## 2. 索引优化
- 为 `wechat_openid` 创建唯一索引，提高查询性能

## 3. 安全说明
- openid 和 unionid 都是唯一的，用于防止重复注册
- 这些字段允许为 NULL，因为用户也可以通过手机号登录
*/

-- 添加微信相关字段
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS wechat_openid text UNIQUE,
ADD COLUMN IF NOT EXISTS wechat_unionid text UNIQUE,
ADD COLUMN IF NOT EXISTS wechat_nickname text,
ADD COLUMN IF NOT EXISTS wechat_avatar text;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_openid ON profiles(wechat_openid);
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_unionid ON profiles(wechat_unionid);

-- 添加注释
COMMENT ON COLUMN profiles.wechat_openid IS '微信小程序 openid，用于微信登录';
COMMENT ON COLUMN profiles.wechat_unionid IS '微信开放平台 unionid，用于跨应用识别';
COMMENT ON COLUMN profiles.wechat_nickname IS '微信昵称';
COMMENT ON COLUMN profiles.wechat_avatar IS '微信头像URL';
