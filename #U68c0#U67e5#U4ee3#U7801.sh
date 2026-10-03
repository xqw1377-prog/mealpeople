#!/bin/bash

echo "=========================================="
echo "  排班管理系统代码检查脚本"
echo "=========================================="
echo ""

# 检查1：profile页面是否包含新代码
echo "✓ 检查1：profile页面是否包含排班管理系统代码"
if grep -q "排班管理系统" /workspace/app-7daop8q0sxdt/src/pages/profile/index.tsx; then
    echo "  ✅ 成功：找到'排班管理系统'代码"
    echo "  行号："
    grep -n "排班管理系统" /workspace/app-7daop8q0sxdt/src/pages/profile/index.tsx | head -3
else
    echo "  ❌ 失败：未找到'排班管理系统'代码"
fi
echo ""

# 检查2：是否有蓝色渐变背景
echo "✓ 检查2：是否有蓝色渐变背景样式"
if grep -q "bg-gradient-to-br from-blue-500 to-blue-600" /workspace/app-7daop8q0sxdt/src/pages/profile/index.tsx; then
    echo "  ✅ 成功：找到蓝色渐变背景代码"
else
    echo "  ❌ 失败：未找到蓝色渐变背景代码"
fi
echo ""

# 检查3：是否有NEW标签
echo "✓ 检查3：是否有NEW标签"
if grep -q "NEW" /workspace/app-7daop8q0sxdt/src/pages/profile/index.tsx; then
    echo "  ✅ 成功：找到NEW标签代码"
else
    echo "  ❌ 失败：未找到NEW标签代码"
fi
echo ""

# 检查4：是否有4个快速入口
echo "✓ 检查4：是否有4个快速入口按钮"
count=$(grep -c "schedule-config\|schedule-records\|schedule-stats\|work-log-ranking" /workspace/app-7daop8q0sxdt/src/pages/profile/index.tsx)
if [ "$count" -ge 4 ]; then
    echo "  ✅ 成功：找到 $count 个快速入口"
else
    echo "  ❌ 失败：只找到 $count 个快速入口（应该有4个）"
fi
echo ""

# 检查5：TabBar配置
echo "✓ 检查5：TabBar配置是否正确"
if grep -q "pages/profile/index" /workspace/app-7daop8q0sxdt/src/app.config.ts; then
    echo "  ✅ 成功：TabBar配置包含profile页面"
else
    echo "  ❌ 失败：TabBar配置缺少profile页面"
fi
echo ""

# 检查6：图标文件
echo "✓ 检查6：TabBar图标文件是否存在"
if [ -f "/workspace/app-7daop8q0sxdt/src/assets/images/selected/profile.png" ] && \
   [ -f "/workspace/app-7daop8q0sxdt/src/assets/images/unselected/profile.png" ]; then
    echo "  ✅ 成功：profile图标文件存在"
else
    echo "  ❌ 失败：profile图标文件缺失"
fi
echo ""

# 检查7：代码语法
echo "✓ 检查7：代码语法检查"
cd /workspace/app-7daop8q0sxdt
if npx biome check --diagnostic-level=error src/pages/profile/index.tsx 2>&1 | grep -q "No fixes applied"; then
    echo "  ✅ 成功：代码没有语法错误"
else
    echo "  ⚠️  警告：代码可能有语法错误"
fi
echo ""

# 总结
echo "=========================================="
echo "  检查完成！"
echo "=========================================="
echo ""
echo "📋 下一步操作："
echo ""
echo "1. 如果所有检查都通过（✅），说明代码已正确添加"
echo "2. 您需要重新启动开发服务器才能看到新功能"
echo "3. 请按照以下步骤操作："
echo ""
echo "   # 停止当前服务器（按 Ctrl+C）"
echo "   # 清除缓存"
echo "   rm -rf dist"
echo "   rm -rf .taro_cache"
echo "   # 重新启动"
echo "   pnpm run dev:weapp"
echo ""
echo "4. 启动后，打开小程序，点击底部'我的'标签"
echo "5. 向下滚动，查找蓝色渐变卡片"
echo ""
echo "📖 详细说明请查看："
echo "   - 重新启动指南.md"
echo "   - 如何查看新功能.md"
echo "   - 功能使用指南.md"
echo ""
