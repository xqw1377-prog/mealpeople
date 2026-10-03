#!/bin/bash

# 版本隔离设置脚本
# 用途：快速设置1.0和2.0版本隔离环境

set -e

echo "========================================="
echo "  餐时间日人力成本管控助手"
echo "  版本隔离设置脚本"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查当前分支
current_branch=$(git branch --show-current)
echo -e "${YELLOW}当前分支: ${current_branch}${NC}"
echo ""

# 菜单选择
echo "请选择操作："
echo "1. 创建1.0发布分支和标签"
echo "2. 创建2.0开发分支"
echo "3. 重组数据库迁移文件"
echo "4. 应用审计日志系统"
echo "5. 创建数据快照"
echo "6. 查看版本信息"
echo "7. 执行完整设置（推荐）"
echo "0. 退出"
echo ""

read -p "请输入选项 [0-7]: " choice

case $choice in
  1)
    echo -e "${GREEN}创建1.0发布分支和标签...${NC}"
    
    # 检查是否有未提交的更改
    if [[ -n $(git status -s) ]]; then
      echo -e "${RED}错误: 存在未提交的更改，请先提交或暂存${NC}"
      exit 1
    fi
    
    # 创建发布分支
    git checkout -b release/v1.0 2>/dev/null || git checkout release/v1.0
    
    # 创建标签
    git tag -a v1.0.0 -m "Release version 1.0.0 - 多租户管理版本" 2>/dev/null || echo "标签已存在"
    
    echo -e "${GREEN}✓ 1.0发布分支和标签创建完成${NC}"
    echo "  分支: release/v1.0"
    echo "  标签: v1.0.0"
    echo ""
    echo "提示: 使用以下命令推送到远程仓库："
    echo "  git push origin release/v1.0"
    echo "  git push origin v1.0.0"
    ;;
    
  2)
    echo -e "${GREEN}创建2.0开发分支...${NC}"
    
    # 回到主分支
    git checkout master
    
    # 创建开发分支
    git checkout -b develop/v2.0 2>/dev/null || git checkout develop/v2.0
    
    # 更新版本号
    if command -v jq &> /dev/null; then
      jq '.version = "2.0.0-dev"' package.json > package.json.tmp && mv package.json.tmp package.json
      echo -e "${GREEN}✓ package.json 版本已更新为 2.0.0-dev${NC}"
    else
      echo -e "${YELLOW}⚠ 请手动更新 package.json 中的版本号为 2.0.0-dev${NC}"
    fi
    
    # 更新环境变量
    if grep -q "TARO_APP_VERSION" .env; then
      sed -i.bak 's/TARO_APP_VERSION=.*/TARO_APP_VERSION=2.0.0-dev/' .env
    else
      echo "TARO_APP_VERSION=2.0.0-dev" >> .env
    fi
    
    if ! grep -q "TARO_APP_ENABLE_V2_FEATURES" .env; then
      echo "TARO_APP_ENABLE_V2_FEATURES=true" >> .env
    fi
    
    if ! grep -q "TARO_APP_ENABLE_AUDIT_LOG" .env; then
      echo "TARO_APP_ENABLE_AUDIT_LOG=true" >> .env
    fi
    
    echo -e "${GREEN}✓ 2.0开发分支创建完成${NC}"
    echo "  分支: develop/v2.0"
    echo "  版本: 2.0.0-dev"
    echo ""
    echo "提示: 使用以下命令推送到远程仓库："
    echo "  git add package.json .env"
    echo "  git commit -m 'chore: 初始化2.0版本开发分支'"
    echo "  git push origin develop/v2.0"
    ;;
    
  3)
    echo -e "${GREEN}重组数据库迁移文件...${NC}"
    
    # 创建版本化目录
    mkdir -p supabase/migrations/v1
    mkdir -p supabase/migrations/v2
    mkdir -p supabase/migrations/shared
    
    # 移动现有迁移文件到v1目录
    if ls supabase/migrations/*.sql 1> /dev/null 2>&1; then
      mv supabase/migrations/*.sql supabase/migrations/v1/ 2>/dev/null || true
      echo -e "${GREEN}✓ 现有迁移文件已移动到 v1 目录${NC}"
    fi
    
    # 创建README
    cat > supabase/migrations/README.md << 'EOF'
# 数据库迁移文件说明

## 目录结构

- `v1/` - 1.0版本迁移文件
- `v2/` - 2.0版本迁移文件
- `shared/` - 跨版本共享的迁移文件（如审计系统）

## 命名规范

- v1迁移文件: `v1/01_xxx.sql`, `v1/02_xxx.sql`
- v2迁移文件: `v2/01_xxx.sql`, `v2/02_xxx.sql`
- 共享文件: `shared/00_xxx.sql`

## 应用顺序

1. 先应用 shared 目录的文件
2. 再应用对应版本目录的文件
3. 按文件名数字顺序应用

## 注意事项

- 1.0版本只能修改 v1 目录的文件
- 2.0版本可以添加 v2 目录的新文件
- 共享文件需要保证向后兼容
EOF
    
    echo -e "${GREEN}✓ 数据库迁移文件重组完成${NC}"
    echo "  v1目录: supabase/migrations/v1/"
    echo "  v2目录: supabase/migrations/v2/"
    echo "  共享目录: supabase/migrations/shared/"
    ;;
    
  4)
    echo -e "${GREEN}应用审计日志系统...${NC}"
    echo -e "${YELLOW}⚠ 此操作需要手动执行 SQL 迁移${NC}"
    echo ""
    echo "请按照以下步骤操作："
    echo "1. 查看文档: docs/版本管理和隔离方案.md"
    echo "2. 复制审计系统SQL代码"
    echo "3. 使用 supabase_apply_migration 工具应用迁移"
    echo ""
    echo "或者使用以下命令查看SQL文件："
    echo "  cat docs/版本管理和隔离方案.md | grep -A 200 'CREATE TABLE IF NOT EXISTS audit_logs'"
    ;;
    
  5)
    echo -e "${GREEN}创建数据快照...${NC}"
    echo -e "${YELLOW}⚠ 此操作需要在应用中执行${NC}"
    echo ""
    echo "请按照以下步骤操作："
    echo "1. 登录系统"
    echo "2. 进入审计日志页面"
    echo "3. 点击创建快照按钮"
    echo ""
    echo "或者使用SQL直接创建："
    echo "  SELECT create_data_snapshot("
    echo "    'v1.0-backup-$(date +%Y%m%d)',"
    echo "    '1.0.0',"
    echo "    'manual',"
    echo "    ARRAY['tenants', 'profiles', 'employees', 'schedules'],"
    echo "    '<user_id>'"
    echo "  );"
    ;;
    
  6)
    echo -e "${GREEN}版本信息:${NC}"
    echo ""
    
    # 显示Git信息
    echo "Git分支:"
    git branch -a | grep -E "(release/v1.0|develop/v2.0|master)" || echo "  未找到版本分支"
    echo ""
    
    echo "Git标签:"
    git tag | grep -E "^v[0-9]" || echo "  未找到版本标签"
    echo ""
    
    # 显示package.json版本
    if command -v jq &> /dev/null; then
      version=$(jq -r '.version' package.json)
      echo "package.json版本: $version"
    fi
    
    # 显示环境变量
    if [ -f .env ]; then
      echo ""
      echo ".env配置:"
      grep "TARO_APP_VERSION" .env || echo "  未配置 TARO_APP_VERSION"
      grep "TARO_APP_ENABLE_V2_FEATURES" .env || echo "  未配置 TARO_APP_ENABLE_V2_FEATURES"
      grep "TARO_APP_ENABLE_AUDIT_LOG" .env || echo "  未配置 TARO_APP_ENABLE_AUDIT_LOG"
    fi
    ;;
    
  7)
    echo -e "${GREEN}执行完整设置...${NC}"
    echo ""
    
    # 检查是否有未提交的更改
    if [[ -n $(git status -s) ]]; then
      echo -e "${RED}错误: 存在未提交的更改，请先提交或暂存${NC}"
      exit 1
    fi
    
    # 1. 创建1.0发布分支
    echo "步骤 1/5: 创建1.0发布分支..."
    git checkout -b release/v1.0 2>/dev/null || git checkout release/v1.0
    git tag -a v1.0.0 -m "Release version 1.0.0 - 多租户管理版本" 2>/dev/null || echo "标签已存在"
    echo -e "${GREEN}✓ 完成${NC}"
    echo ""
    
    # 2. 回到主分支并创建2.0开发分支
    echo "步骤 2/5: 创建2.0开发分支..."
    git checkout master
    git checkout -b develop/v2.0 2>/dev/null || git checkout develop/v2.0
    
    # 更新版本号
    if command -v jq &> /dev/null; then
      jq '.version = "2.0.0-dev"' package.json > package.json.tmp && mv package.json.tmp package.json
    fi
    
    # 更新环境变量
    if grep -q "TARO_APP_VERSION" .env; then
      sed -i.bak 's/TARO_APP_VERSION=.*/TARO_APP_VERSION=2.0.0-dev/' .env
    else
      echo "TARO_APP_VERSION=2.0.0-dev" >> .env
    fi
    
    if ! grep -q "TARO_APP_ENABLE_V2_FEATURES" .env; then
      echo "TARO_APP_ENABLE_V2_FEATURES=true" >> .env
    fi
    
    if ! grep -q "TARO_APP_ENABLE_AUDIT_LOG" .env; then
      echo "TARO_APP_ENABLE_AUDIT_LOG=true" >> .env
    fi
    
    echo -e "${GREEN}✓ 完成${NC}"
    echo ""
    
    # 3. 重组迁移文件
    echo "步骤 3/5: 重组数据库迁移文件..."
    mkdir -p supabase/migrations/v1
    mkdir -p supabase/migrations/v2
    mkdir -p supabase/migrations/shared
    
    if ls supabase/migrations/*.sql 1> /dev/null 2>&1; then
      mv supabase/migrations/*.sql supabase/migrations/v1/ 2>/dev/null || true
    fi
    
    cat > supabase/migrations/README.md << 'EOF'
# 数据库迁移文件说明

## 目录结构

- `v1/` - 1.0版本迁移文件
- `v2/` - 2.0版本迁移文件
- `shared/` - 跨版本共享的迁移文件（如审计系统）

## 命名规范

- v1迁移文件: `v1/01_xxx.sql`, `v1/02_xxx.sql`
- v2迁移文件: `v2/01_xxx.sql`, `v2/02_xxx.sql`
- 共享文件: `shared/00_xxx.sql`
EOF
    
    echo -e "${GREEN}✓ 完成${NC}"
    echo ""
    
    # 4. 提交更改
    echo "步骤 4/5: 提交更改..."
    git add .
    git commit -m "chore: 初始化版本隔离环境

- 创建1.0发布分支和标签
- 创建2.0开发分支
- 重组数据库迁移文件
- 更新版本配置" 2>/dev/null || echo "没有需要提交的更改"
    
    echo -e "${GREEN}✓ 完成${NC}"
    echo ""
    
    # 5. 显示后续步骤
    echo "步骤 5/5: 后续操作提示"
    echo -e "${GREEN}✓ 版本隔离环境设置完成！${NC}"
    echo ""
    echo "========================================="
    echo "  后续操作"
    echo "========================================="
    echo ""
    echo "1. 推送分支和标签到远程仓库："
    echo "   git push origin release/v1.0"
    echo "   git push origin v1.0.0"
    echo "   git push origin develop/v2.0"
    echo ""
    echo "2. 应用审计日志系统："
    echo "   查看文档: docs/版本管理和隔离方案.md"
    echo "   使用 supabase_apply_migration 应用SQL迁移"
    echo ""
    echo "3. 创建初始数据快照："
    echo "   登录系统 → 审计日志页面 → 创建快照"
    echo ""
    echo "4. 开始2.0版本开发："
    echo "   git checkout develop/v2.0"
    echo "   # 开发新功能..."
    echo ""
    ;;
    
  0)
    echo "退出"
    exit 0
    ;;
    
  *)
    echo -e "${RED}无效选项${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}操作完成！${NC}"
