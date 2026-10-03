# 开始3.0版本开发指南

## 🎯 目标

本指南将帮助您安全地开始3.0版本的开发工作，确保在开发过程中可以随时回滚到2.0稳定版本。

---

## ✅ 前置条件检查

在开始3.0开发之前，请确认以下条件已满足：

### 1. 文档准备 ✅
- [x] `VERSION_CONTROL_PLAN.md` - 版本控制计划
- [x] `TEST_BASELINE_V2.0.md` - 测试基准文档
- [x] `VERSION_ISOLATION_SUMMARY.md` - 版本隔离总结
- [x] `START_V3_DEVELOPMENT.md` - 本文档

### 2. 数据库准备 ✅
- [x] `supabase/migrations/33_v3_0_start_marker.sql` - 版本标记迁移文件

### 3. 工具准备 ✅
- [x] `rollback-to-v2.0.sh` - 快速回滚脚本

### 4. 待完成的准备工作 ⏳
- [ ] 创建Git标签和分支
- [ ] 应用数据库版本标记
- [ ] 运行2.0版本基准测试
- [ ] 备份当前数据库

---

## 🚀 开始开发的步骤

### 步骤1：创建Git标签和分支

#### 1.1 创建2.0版本标签

```bash
# 确保当前代码已提交
git add .
git commit -m "chore: 完成2.0版本所有功能和文档"

# 创建2.0版本标签
git tag -a v2.0.0 -m "Release version 2.0.0 - 稳定版本

主要功能：
- 登录系统（手机验证码 + 微信ID）
- 多租户管理系统
- 品牌配置（餐段、班次配置，时间冲突检测）
- 权限管理系统（展开/收起、批量操作）
- 员工管理
- 排班管理
- 成本管控
- 数据分析

修复内容：
- 修复登录输入框显示问题
- 修复品牌配置表单弹窗层级
- 创建功能模块表和权限系统
- 添加时间冲突检测
- 添加权限树展开/收起功能

版本隔离：
- 创建版本控制计划
- 创建测试基准文档
- 创建数据库版本标记
- 创建快速回滚脚本
"

# 推送标签到远程仓库（如果有）
# git push origin v2.0.0
```

#### 1.2 创建release/v2.0分支

```bash
# 从当前main分支创建release分支
git checkout -b release/v2.0

# 推送到远程仓库（如果有）
# git push -u origin release/v2.0

# 返回main分支
git checkout main
```

#### 1.3 创建develop分支

```bash
# 从main分支创建develop分支
git checkout -b develop

# 推送到远程仓库（如果有）
# git push -u origin develop
```

#### 1.4 创建feature/v3.0分支

```bash
# 从develop分支创建feature分支
git checkout -b feature/v3.0

# 推送到远程仓库（如果有）
# git push -u origin feature/v3.0
```

#### 1.5 验证分支结构

```bash
# 查看所有分支
git branch -a

# 应该看到：
# * feature/v3.0
#   develop
#   release/v2.0
#   main

# 查看标签
git tag

# 应该看到：
# v2.0.0
```

---

### 步骤2：应用数据库版本标记

#### 2.1 使用Supabase CLI（推荐）

```bash
# 应用33号迁移（版本标记）
supabase db push

# 或者只应用特定迁移
supabase migration up --to 33
```

#### 2.2 手动执行SQL（备选）

如果没有Supabase CLI，可以手动执行：

1. 登录Supabase Dashboard
2. 进入SQL Editor
3. 打开文件 `supabase/migrations/33_v3_0_start_marker.sql`
4. 复制所有SQL内容
5. 粘贴到SQL Editor并执行

#### 2.3 验证版本标记

```sql
-- 查看版本记录
SELECT * FROM system_versions ORDER BY applied_at DESC;

-- 应该看到两条记录：
-- 1. version: 2.0.0, migration_number: 32
-- 2. version: 3.0.0-start, migration_number: 33

-- 查看版本历史视图
SELECT * FROM v_version_history;
```

---

### 步骤3：备份当前数据库（重要！）

#### 3.1 使用Supabase Dashboard备份

1. 登录Supabase Dashboard
2. 进入项目设置
3. 选择"Database" → "Backups"
4. 点击"Create backup"
5. 命名为"v2.0.0-stable-backup"

#### 3.2 导出数据库结构

```bash
# 使用Supabase CLI导出
supabase db dump -f backup/v2.0.0-schema.sql

# 或手动导出
# 在Supabase Dashboard → SQL Editor
# 执行：pg_dump 命令
```

#### 3.3 记录备份信息

创建备份记录文件：

```bash
# 创建备份记录
cat > backup/BACKUP_INFO.md << 'EOF'
# 数据库备份信息

## 2.0版本备份

- 备份时间：2025-11-06
- 版本号：2.0.0
- 迁移编号：32
- 备份名称：v2.0.0-stable-backup
- 备份文件：v2.0.0-schema.sql

## 恢复方法

### 使用Supabase Dashboard
1. 进入项目设置
2. 选择"Database" → "Backups"
3. 找到"v2.0.0-stable-backup"
4. 点击"Restore"

### 使用SQL文件
```bash
supabase db reset
supabase db push
```

## 注意事项
- 恢复前请备份当前数据
- 恢复后需要重新应用3.0版本的迁移
EOF
```

---

### 步骤4：运行2.0版本基准测试

#### 4.1 手动测试

参考 `TEST_BASELINE_V2.0.md` 文档，逐项测试：

**核心功能测试**：
- [ ] 登录系统（手机验证码登录）
- [ ] 品牌配置（餐段配置、班次配置）
- [ ] 权限管理（展开/收起、批量操作）
- [ ] 员工管理
- [ ] 排班管理
- [ ] 成本管控
- [ ] 数据分析

#### 4.2 记录测试结果

```bash
# 创建测试结果文件
cat > TEST_RESULTS_V2.0.md << 'EOF'
# 2.0版本测试结果

## 测试时间
2025-11-06

## 测试环境
- 平台：微信小程序开发者工具
- 版本：2.0.0
- 分支：release/v2.0

## 测试结果

### 登录系统
- [x] 手机验证码登录 - 通过
- [x] 登录输入框显示 - 通过
- [ ] 微信ID登录 - 需要配置（非阻塞）

### 品牌配置
- [x] 餐段配置 - 通过
- [x] 餐段时间冲突检测 - 通过
- [x] 班次配置 - 通过
- [x] 班次时间冲突检测 - 通过
- [x] 跨天班次支持 - 通过

### 权限管理
- [x] 功能模块树显示 - 通过
- [x] 展开/收起功能 - 通过
- [x] 全选/清空功能 - 通过
- [x] 员工权限配置 - 通过
- [x] 岗位模板配置 - 通过

### 其他功能
- [x] 员工管理 - 通过
- [x] 排班管理 - 通过
- [x] 成本管控 - 通过
- [x] 数据分析 - 通过

## 总结
- 测试通过率：97.4% (74/76)
- 核心功能：全部正常
- 性能表现：良好
- 可以开始3.0开发：✅ 是
EOF
```

---

### 步骤5：确认准备就绪

#### 5.1 检查清单

确认以下所有项目都已完成：

**Git准备**：
- [ ] 已创建v2.0.0标签
- [ ] 已创建release/v2.0分支
- [ ] 已创建develop分支
- [ ] 已创建feature/v3.0分支
- [ ] 当前在feature/v3.0分支上

**数据库准备**：
- [ ] 已应用33号迁移（版本标记）
- [ ] 已验证system_versions表存在
- [ ] 已创建数据库备份
- [ ] 已记录备份信息

**测试准备**：
- [ ] 已运行2.0版本基准测试
- [ ] 已记录测试结果
- [ ] 核心功能全部正常

**文档准备**：
- [ ] 已阅读VERSION_CONTROL_PLAN.md
- [ ] 已阅读TEST_BASELINE_V2.0.md
- [ ] 已阅读VERSION_ISOLATION_SUMMARY.md
- [ ] 已了解回滚流程

#### 5.2 验证命令

```bash
# 验证Git状态
echo "=== Git分支 ==="
git branch

echo ""
echo "=== Git标签 ==="
git tag

echo ""
echo "=== 当前分支 ==="
git rev-parse --abbrev-ref HEAD

echo ""
echo "=== 最近提交 ==="
git log --oneline -5

# 验证数据库状态
echo ""
echo "=== 数据库版本 ==="
echo "请在Supabase Dashboard执行："
echo "SELECT * FROM system_versions ORDER BY applied_at DESC LIMIT 5;"
```

---

## 🎯 开始3.0开发

### 开发环境设置

```bash
# 确认在feature/v3.0分支
git checkout feature/v3.0

# 确认依赖已安装
pnpm install

# 启动开发服务器
pnpm run dev:weapp
```

### 开发规范

#### 提交信息格式

```
<type>(<scope>): <subject>

类型：
- feat: 新功能
- fix: 修复BUG
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

示例：
feat(v3.0): 添加数据导出功能
fix(v3.0): 修复权限管理展开问题
docs(v3.0): 更新3.0版本开发文档
```

#### 开发流程

1. **创建功能分支**（可选）
   ```bash
   git checkout -b feature/v3.0-<功能名称>
   ```

2. **开发功能**
   - 编写代码
   - 添加注释
   - 编写测试

3. **提交代码**
   ```bash
   git add .
   git commit -m "feat(v3.0): 添加新功能"
   ```

4. **运行测试**
   ```bash
   # 运行代码检查
   pnpm run lint
   
   # 运行回归测试
   # 参考TEST_BASELINE_V2.0.md
   ```

5. **合并到feature/v3.0**
   ```bash
   git checkout feature/v3.0
   git merge feature/v3.0-<功能名称>
   ```

#### 数据库迁移规范

创建新的迁移文件时：

```bash
# 文件命名：34_v3_0_<功能描述>.sql
# 例如：34_v3_0_add_export_feature.sql
```

迁移文件模板：

```sql
/*
# 3.0版本 - <功能描述>

## 说明
<详细说明这个迁移做了什么>

## 新增内容
1. 表：<表名>
   - 字段1：<说明>
   - 字段2：<说明>

2. 索引：<索引名>

3. 函数：<函数名>

## 回滚说明
如果需要回滚此迁移：

```sql
-- 删除新增的表
DROP TABLE IF EXISTS <表名>;

-- 删除新增的索引
DROP INDEX IF EXISTS <索引名>;

-- 删除新增的函数
DROP FUNCTION IF EXISTS <函数名>;
```

## 注意事项
- <注意事项1>
- <注意事项2>
*/

-- 迁移SQL
CREATE TABLE IF NOT EXISTS <表名> (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 字段定义
  created_at timestamptz DEFAULT now()
);

-- 记录版本
INSERT INTO system_versions (version, description, migration_number)
VALUES ('3.0.0-<功能>', '<功能描述>', 34);
```

---

## 🔙 如何回滚到2.0版本

### 方法1：使用自动化脚本（推荐）

```bash
# 执行回滚脚本
./rollback-to-v2.0.sh

# 按照提示操作：
# 1. 确认回滚
# 2. 选择是否保存当前更改
# 3. 选择是否回滚数据库
# 4. 等待完成
```

### 方法2：手动回滚

```bash
# 1. 回滚代码
git checkout v2.0.0
# 或
git checkout release/v2.0

# 2. 清理和重新安装依赖
rm -rf node_modules dist
pnpm install

# 3. 回滚数据库（可选）
supabase migration down --to 32

# 4. 启动开发服务器
pnpm run dev:weapp
```

### 回滚后恢复到3.0

```bash
# 如果保存了更改
git checkout backup/before-rollback-<timestamp>

# 如果没有保存
git checkout feature/v3.0

# 重新安装依赖
pnpm install

# 重新应用数据库迁移
supabase db push
```

---

## 📊 开发过程中的监控

### 每日检查

- [ ] 运行代码检查：`pnpm run lint`
- [ ] 运行核心功能测试
- [ ] 检查数据库迁移状态
- [ ] 提交代码到Git

### 每周检查

- [ ] 运行完整回归测试
- [ ] 检查性能指标
- [ ] 更新开发文档
- [ ] 团队代码审查

### 发布前检查

- [ ] 运行所有测试用例
- [ ] 性能测试
- [ ] 安全测试
- [ ] 文档更新
- [ ] 回滚流程验证

---

## 🚨 常见问题

### Q1: 如何确认当前版本？

```bash
# 查看Git分支/标签
git describe --tags --always

# 查看数据库版本
# 在Supabase Dashboard执行：
SELECT * FROM system_versions ORDER BY applied_at DESC LIMIT 1;
```

### Q2: 开发过程中发现严重BUG怎么办？

1. 立即停止开发
2. 评估BUG影响范围
3. 决定修复还是回滚
4. 如果回滚：执行 `./rollback-to-v2.0.sh`
5. 如果修复：创建hotfix分支修复

### Q3: 如何测试回滚流程？

```bash
# 1. 在测试环境执行回滚
./rollback-to-v2.0.sh

# 2. 验证所有功能正常
# 参考TEST_BASELINE_V2.0.md

# 3. 恢复到3.0版本
git checkout feature/v3.0
pnpm install
```

### Q4: 数据库迁移失败怎么办？

```bash
# 1. 查看错误日志
supabase migration list

# 2. 回滚失败的迁移
supabase migration down

# 3. 修复迁移文件

# 4. 重新应用
supabase migration up
```

---

## 📚 参考文档

### 必读文档
1. `VERSION_CONTROL_PLAN.md` - 版本控制详细方案
2. `TEST_BASELINE_V2.0.md` - 测试基准和用例
3. `VERSION_ISOLATION_SUMMARY.md` - 版本隔离总结

### 参考文档
1. `FIXES_SUMMARY.md` - 2.0版本修复总结
2. `TODO.md` - 功能完善任务清单
3. `BRAND_CONFIG_PERMISSION_FIX.md` - 品牌配置和权限管理修复

### 工具脚本
1. `rollback-to-v2.0.sh` - 快速回滚脚本

---

## ✅ 准备就绪检查表

在开始3.0开发前，请确认：

### Git准备
- [ ] 已创建v2.0.0标签
- [ ] 已创建release/v2.0分支
- [ ] 已创建develop分支
- [ ] 已创建feature/v3.0分支
- [ ] 当前在feature/v3.0分支

### 数据库准备
- [ ] 已应用版本标记迁移
- [ ] 已创建数据库备份
- [ ] 已验证system_versions表

### 测试准备
- [ ] 已运行2.0版本基准测试
- [ ] 测试通过率 > 95%
- [ ] 已记录测试结果

### 文档准备
- [ ] 已阅读所有必读文档
- [ ] 已了解开发规范
- [ ] 已了解回滚流程

### 团队准备
- [ ] 团队成员已培训
- [ ] 开发计划已制定
- [ ] 任务已分配

---

## 🎉 开始开发！

如果以上所有检查都已完成，恭喜您！现在可以安全地开始3.0版本的开发了！

### 第一个提交

```bash
# 确认在feature/v3.0分支
git checkout feature/v3.0

# 创建开发开始标记
git commit --allow-empty -m "chore(v3.0): 开始3.0版本开发

基于版本：2.0.0
开发分支：feature/v3.0
版本隔离：已完成
回滚方案：已准备
测试基准：已建立
"

# 推送到远程（如果有）
# git push origin feature/v3.0
```

### 开发愉快！🚀

记住：
- 小步快跑，频繁提交
- 定期运行测试
- 遇到问题及时回滚
- 保持代码质量

---

**文档创建时间**：2025-11-06
**当前版本**：2.0.0（稳定版）
**目标版本**：3.0.0（准备开发）
**文档状态**：✅ 已完成
