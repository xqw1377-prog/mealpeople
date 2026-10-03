#!/bin/bash

echo "🔧 微信登录功能配置脚本"
echo "================================"
echo ""

# 检查是否安装了Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ 错误：未安装Supabase CLI"
    echo ""
    echo "请先安装Supabase CLI："
    echo "  npm install -g supabase"
    echo ""
    echo "或访问：https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI 已安装"
echo ""

# 1. 输入微信配置
echo "📝 步骤1：输入微信小程序配置"
echo "--------------------------------"
echo "请登录微信公众平台获取AppID和AppSecret："
echo "https://mp.weixin.qq.com/"
echo ""

read -p "请输入微信小程序AppID（例如：wx1234567890abcdef）: " WECHAT_APPID
read -p "请输入微信小程序AppSecret: " WECHAT_APPSECRET

if [ -z "$WECHAT_APPID" ] || [ -z "$WECHAT_APPSECRET" ]; then
    echo "❌ 错误：AppID和AppSecret不能为空"
    exit 1
fi

echo ""
echo "✅ 已收到配置信息"
echo ""

# 2. 配置Supabase环境变量
echo "🔑 步骤2：配置Supabase环境变量"
echo "--------------------------------"

echo "正在配置WECHAT_APPID..."
if supabase secrets set WECHAT_APPID="$WECHAT_APPID"; then
    echo "✅ WECHAT_APPID 配置成功"
else
    echo "❌ WECHAT_APPID 配置失败"
    exit 1
fi

echo "正在配置WECHAT_APPSECRET..."
if supabase secrets set WECHAT_APPSECRET="$WECHAT_APPSECRET"; then
    echo "✅ WECHAT_APPSECRET 配置成功"
else
    echo "❌ WECHAT_APPSECRET 配置失败"
    exit 1
fi

echo ""
echo "✅ 环境变量配置完成"
echo ""

# 3. 部署Edge Function
echo "📦 步骤3：部署Edge Function"
echo "--------------------------------"

echo "正在部署wechat-quick-login..."
if supabase functions deploy wechat-quick-login; then
    echo "✅ wechat-quick-login 部署成功"
else
    echo "❌ wechat-quick-login 部署失败"
    exit 1
fi

echo ""
echo "正在部署bind-wechat..."
if supabase functions deploy bind-wechat; then
    echo "✅ bind-wechat 部署成功"
else
    echo "❌ bind-wechat 部署失败"
    exit 1
fi

echo ""
echo "✅ Edge Function部署完成"
echo ""

# 4. 验证部署
echo "🔍 步骤4：验证部署"
echo "--------------------------------"

echo "已部署的Edge Function："
supabase functions list

echo ""
echo "已配置的环境变量："
supabase secrets list

echo ""
echo "================================"
echo "✅ 配置完成！"
echo "================================"
echo ""
echo "⚠️  重要提示："
echo ""
echo "1. 请在微信公众平台配置服务器域名："
echo "   - 登录：https://mp.weixin.qq.com/"
echo "   - 进入：开发 → 开发管理 → 开发设置"
echo "   - 在 request合法域名 中添加："
echo "     * https://你的Supabase项目URL"
echo "     * https://api.weixin.qq.com"
echo ""
echo "2. 获取Supabase项目URL："
echo "   - 登录Supabase Dashboard"
echo "   - 进入项目设置"
echo "   - 复制API URL"
echo ""
echo "3. 配置完成后，请等待几分钟让域名配置生效"
echo ""
echo "4. 测试微信登录功能："
echo "   - 打开小程序"
echo "   - 点击"微信一键登录""
echo "   - 查看控制台日志"
echo ""
echo "📚 详细文档："
echo "   - 配置指南：WECHAT_CONFIG_GUIDE.md"
echo "   - 故障排查：WECHAT_BIND_TROUBLESHOOTING.md"
echo ""
echo "🎉 祝你使用愉快！"
