/*
# 添加微信ID字段到 profiles 表

## 功能说明
支持用户首次使用电话号码授权登录后，绑定微信ID，后续可以使用微信ID一键登录。

## 新增字段
- `wechat_openid` (text, unique): 微信小程序 OpenID，用于微信登录
- `wechat_unionid` (text, unique): 微信 UnionID，用于跨应用识别用户

## 索引
- 为 wechat_openid 创建唯一索引
- 为 wechat_unionid 创建唯一索引

## 使用场景
1. 首次登录：电话号码 + 验证码 → 自动绑定微信ID
2. 后续登录：微信ID一键登录（更便捷）

## 注意事项
- OpenID 和 UnionID 都是唯一的
- 一个微信账号只能绑定一个系统账号
- 绑定后不可更改（除非解绑）
*/

-- 添加微信ID字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_openid text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_unionid text UNIQUE;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_openid ON profiles(wechat_openid);
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_unionid ON profiles(wechat_unionid);

-- 添加注释
COMMENT ON COLUMN profiles.wechat_openid IS '微信小程序 OpenID，用于微信登录';
COMMENT ON COLUMN profiles.wechat_unionid IS '微信 UnionID，用于跨应用识别用户';
