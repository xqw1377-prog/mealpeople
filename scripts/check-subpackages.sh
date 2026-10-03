#!/bin/bash

# 分包检查脚本
# 用于验证分包配置的完整性和正确性

echo "======================================"
echo "  小程序分包配置检查"
echo "======================================"
echo ""

# 检查主包页面
echo "📦 主包页面 (src/pages/):"
MAIN_COUNT=$(ls -1 src/pages/ | wc -l)
echo "   共 $MAIN_COUNT 个页面"
ls -1 src/pages/ | sed 's/^/   - /'
echo ""

# 检查分包A
echo "📦 分包A - 员工与门店管理 (src/packageA/pages/):"
PKG_A_COUNT=$(ls -1 src/packageA/pages/ | wc -l)
echo "   共 $PKG_A_COUNT 个页面"
ls -1 src/packageA/pages/ | sed 's/^/   - /'
echo ""

# 检查分包B
echo "📦 分包B - 营收与数据分析 (src/packageB/pages/):"
PKG_B_COUNT=$(ls -1 src/packageB/pages/ | wc -l)
echo "   共 $PKG_B_COUNT 个页面"
ls -1 src/packageB/pages/ | sed 's/^/   - /'
echo ""

# 检查分包C
echo "📦 分包C - 排班管理 (src/packageC/pages/):"
PKG_C_COUNT=$(ls -1 src/packageC/pages/ | wc -l)
echo "   共 $PKG_C_COUNT 个页面"
ls -1 src/packageC/pages/ | sed 's/^/   - /'
echo ""

# 检查分包D
echo "📦 分包D - 业务配置 (src/packageD/pages/):"
PKG_D_COUNT=$(ls -1 src/packageD/pages/ | wc -l)
echo "   共 $PKG_D_COUNT 个页面"
ls -1 src/packageD/pages/ | sed 's/^/   - /'
echo ""

# 检查分包E
echo "📦 分包E - 租户与权限管理 (src/packageE/pages/):"
PKG_E_COUNT=$(ls -1 src/packageE/pages/ | wc -l)
echo "   共 $PKG_E_COUNT 个页面"
ls -1 src/packageE/pages/ | sed 's/^/   - /'
echo ""

# 检查分包F
echo "📦 分包F - 高级功能 (src/packageF/pages/):"
PKG_F_COUNT=$(ls -1 src/packageF/pages/ | wc -l)
echo "   共 $PKG_F_COUNT 个页面"
ls -1 src/packageF/pages/ | sed 's/^/   - /'
echo ""

# 统计总数
TOTAL=$((MAIN_COUNT + PKG_A_COUNT + PKG_B_COUNT + PKG_C_COUNT + PKG_D_COUNT + PKG_E_COUNT + PKG_F_COUNT))
echo "======================================"
echo "📊 统计汇总:"
echo "   主包: $MAIN_COUNT 个页面"
echo "   分包A: $PKG_A_COUNT 个页面"
echo "   分包B: $PKG_B_COUNT 个页面"
echo "   分包C: $PKG_C_COUNT 个页面"
echo "   分包D: $PKG_D_COUNT 个页面"
echo "   分包E: $PKG_E_COUNT 个页面"
echo "   分包F: $PKG_F_COUNT 个页面"
echo "   -------------------------"
echo "   总计: $TOTAL 个页面"
echo "======================================"
echo ""

# 检查是否有旧路径引用
echo "🔍 检查旧路径引用..."
OLD_PATHS=$(grep -r "navigateTo.*'/pages/\(employees\|stores\|revenue-management\|schedules\|efficiency-config\|tenant-management\|chain-management\)" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "packageA\|packageB\|packageC\|packageD\|packageE\|packageF" | wc -l)

if [ "$OLD_PATHS" -eq 0 ]; then
    echo "✅ 未发现旧路径引用"
else
    echo "⚠️  发现 $OLD_PATHS 处旧路径引用，需要更新"
    grep -r "navigateTo.*'/pages/\(employees\|stores\|revenue-management\|schedules\|efficiency-config\|tenant-management\|chain-management\)" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "packageA\|packageB\|packageC\|packageD\|packageE\|packageF" | head -10
fi
echo ""

echo "✅ 分包检查完成！"
