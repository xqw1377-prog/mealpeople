#!/bin/bash

# 回滚到2.0版本脚本
# 用途：当3.0版本出现问题时，快速回滚到2.0稳定版本

set -e  # 遇到错误立即退出

echo "=================================="
echo "回滚到2.0版本"
echo "=================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 确认回滚操作
echo -e "${YELLOW}警告：此操作将回滚到2.0版本，所有3.0版本的代码和数据库更改将被撤销！${NC}"
echo ""
read -p "确定要继续吗？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${RED}回滚操作已取消${NC}"
    exit 1
fi

echo ""
echo "=================================="
echo "步骤1：检查Git状态"
echo "=================================="

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}检测到未提交的更改${NC}"
    echo ""
    read -p "是否要保存当前更改？(yes/no): " save_changes
    
    if [ "$save_changes" = "yes" ]; then
        echo "保存当前更改到临时分支..."
        timestamp=$(date +%Y%m%d_%H%M%S)
        git checkout -b backup/before-rollback-$timestamp
        git add .
        git commit -m "backup: 回滚前的备份 - $timestamp"
        echo -e "${GREEN}✓ 更改已保存到分支: backup/before-rollback-$timestamp${NC}"
    else
        echo -e "${YELLOW}警告：未保存的更改将丢失${NC}"
        read -p "确定继续吗？(yes/no): " confirm_discard
        if [ "$confirm_discard" != "yes" ]; then
            echo -e "${RED}回滚操作已取消${NC}"
            exit 1
        fi
    fi
fi

echo ""
echo "=================================="
echo "步骤2：回滚代码到2.0版本"
echo "=================================="

# 检查是否存在v2.0.0标签
if git rev-parse v2.0.0 >/dev/null 2>&1; then
    echo "使用v2.0.0标签回滚..."
    git checkout v2.0.0
    echo -e "${GREEN}✓ 代码已回滚到v2.0.0标签${NC}"
elif git rev-parse release/v2.0 >/dev/null 2>&1; then
    echo "使用release/v2.0分支回滚..."
    git checkout release/v2.0
    echo -e "${GREEN}✓ 代码已回滚到release/v2.0分支${NC}"
else
    echo -e "${RED}错误：找不到v2.0.0标签或release/v2.0分支${NC}"
    echo "请手动指定回滚点"
    exit 1
fi

echo ""
echo "=================================="
echo "步骤3：清理和重新安装依赖"
echo "=================================="

echo "清理node_modules和dist..."
rm -rf node_modules dist

echo "重新安装依赖..."
pnpm install

echo -e "${GREEN}✓ 依赖安装完成${NC}"

echo ""
echo "=================================="
echo "步骤4：数据库回滚（可选）"
echo "=================================="

read -p "是否需要回滚数据库到2.0版本？(yes/no): " rollback_db

if [ "$rollback_db" = "yes" ]; then
    echo ""
    echo "数据库回滚选项："
    echo "1. 使用Supabase CLI回滚（推荐）"
    echo "2. 手动回滚（需要手动执行SQL）"
    echo "3. 跳过数据库回滚"
    echo ""
    read -p "请选择 (1/2/3): " db_option
    
    case $db_option in
        1)
            echo "使用Supabase CLI回滚到迁移32（2.0最后一个迁移）..."
            if command -v supabase &> /dev/null; then
                supabase migration down --to 32
                echo -e "${GREEN}✓ 数据库已回滚到2.0版本${NC}"
            else
                echo -e "${RED}错误：未找到Supabase CLI${NC}"
                echo "请手动回滚数据库或安装Supabase CLI"
            fi
            ;;
        2)
            echo ""
            echo "手动回滚步骤："
            echo "1. 登录Supabase Dashboard"
            echo "2. 进入SQL Editor"
            echo "3. 执行以下SQL："
            echo ""
            echo "   -- 查看3.0版本添加的表"
            echo "   SELECT table_name FROM information_schema.tables"
            echo "   WHERE table_schema = 'public' AND table_name LIKE '%v3%';"
            echo ""
            echo "   -- 删除3.0版本的表（根据实际情况）"
            echo "   -- DROP TABLE IF EXISTS v3_table_name;"
            echo ""
            echo "   -- 记录回滚操作"
            echo "   INSERT INTO system_versions (version, description)"
            echo "   VALUES ('3.0.0-rollback', '从3.0版本回滚到2.0版本');"
            echo ""
            read -p "按Enter键继续..."
            ;;
        3)
            echo "跳过数据库回滚"
            ;;
        *)
            echo -e "${YELLOW}无效选项，跳过数据库回滚${NC}"
            ;;
    esac
fi

echo ""
echo "=================================="
echo "步骤5：验证回滚结果"
echo "=================================="

echo "当前Git分支/标签："
git describe --tags --always

echo ""
echo "package.json版本："
if [ -f package.json ]; then
    grep '"version"' package.json | head -1
fi

echo ""
echo "=================================="
echo "回滚完成！"
echo "=================================="
echo ""
echo -e "${GREEN}✓ 代码已回滚到2.0版本${NC}"
echo ""
echo "下一步操作："
echo "1. 运行 'pnpm run dev:weapp' 启动开发服务器"
echo "2. 测试所有核心功能是否正常"
echo "3. 参考 TEST_BASELINE_V2.0.md 进行完整测试"
echo ""
echo "如果需要恢复到3.0版本："
if [ "$save_changes" = "yes" ]; then
    echo "  git checkout backup/before-rollback-$timestamp"
else
    echo "  git checkout feature/v3.0"
fi
echo ""
echo "=================================="
