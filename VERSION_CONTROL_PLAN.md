# 版本控制和隔离方案

## 📋 当前状态

### 当前版本：2.0（稳定版）
- **状态**：已完成基础功能修复和增强
- **主要功能**：
  - ✅ 登录系统（手机验证码 + 微信ID）
  - ✅ 多租户管理系统
  - ✅ 品牌配置（餐段、班次）
  - ✅ 权限管理系统
  - ✅ 员工管理
  - ✅ 排班管理
  - ✅ 成本管控
  - ✅ 数据分析

### 下一版本：3.0（开发中）
- **目标**：新功能开发和系统优化
- **风险**：可能引入新的BUG或破坏现有功能

---

## 🛡️ 版本隔离策略

### 策略1：Git分支管理（推荐）

#### 分支结构
```
main (生产环境)
  ├── release/v2.0 (2.0稳定版本)
  ├── develop (开发分支)
  │   └── feature/v3.0 (3.0新功能开发)
  └── hotfix/* (紧急修复分支)
```

#### 分支说明
1. **main分支**
   - 始终保持可部署状态
   - 只接受经过测试的代码
   - 受保护，需要审核才能合并

2. **release/v2.0分支**
   - 2.0版本的稳定快照
   - 只接受紧急修复
   - 作为回滚参考点

3. **develop分支**
   - 日常开发分支
   - 集成各个功能分支
   - 定期合并到main

4. **feature/v3.0分支**
   - 3.0版本新功能开发
   - 从develop分支创建
   - 完成后合并回develop

5. **hotfix分支**
   - 紧急修复分支
   - 从main创建
   - 修复后同时合并到main和develop

---

## 🔄 版本隔离实施步骤

### 步骤1：创建2.0稳定版本标签

```bash
# 1. 确保当前代码已提交
git add .
git commit -m "chore: 完成2.0版本所有功能"

# 2. 创建2.0版本标签
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
"

# 3. 推送标签到远程仓库（如果有）
git push origin v2.0.0
```

### 步骤2：创建release/v2.0分支

```bash
# 1. 从当前main分支创建release分支
git checkout -b release/v2.0

# 2. 推送到远程仓库
git push -u origin release/v2.0

# 3. 设置分支保护（在Git平台上操作）
# - 禁止强制推送
# - 需要代码审核
# - 只允许紧急修复
```

### 步骤3：创建develop分支

```bash
# 1. 从main分支创建develop分支
git checkout main
git checkout -b develop

# 2. 推送到远程仓库
git push -u origin develop
```

### 步骤4：创建feature/v3.0分支

```bash
# 1. 从develop分支创建feature分支
git checkout develop
git checkout -b feature/v3.0

# 2. 推送到远程仓库
git push -u origin feature/v3.0

# 3. 开始3.0版本开发
# 所有3.0的新功能都在这个分支上开发
```

---

## 📦 数据库版本隔离

### 策略：数据库迁移版本管理

#### 当前迁移文件（2.0版本）
```
supabase/migrations/
├── 01_create_multi_tenant_schema.sql
├── 02_add_test_data.sql
├── ...
├── 31_create_work_shifts_table.sql
└── 32_create_function_modules.sql  ← 2.0最后一个迁移
```

#### 3.0版本迁移文件命名规范
```
supabase/migrations/
├── ... (2.0版本迁移文件)
├── 32_create_function_modules.sql  ← 2.0最后一个迁移
├── 33_v3_0_start_marker.sql        ← 3.0版本开始标记
├── 34_v3_0_new_feature_1.sql       ← 3.0新功能1
├── 35_v3_0_new_feature_2.sql       ← 3.0新功能2
└── ...
```

#### 创建3.0版本开始标记

```sql
-- supabase/migrations/33_v3_0_start_marker.sql
/*
# 3.0版本开始标记

## 说明
这是3.0版本的开始标记。
如果需要回滚到2.0版本，只需要回滚到这个迁移之前的状态。

## 版本信息
- 版本号：3.0.0
- 开始时间：2025-11-06
- 基于版本：2.0.0

## 回滚说明
如果需要回滚到2.0版本：
1. 记录当前数据库状态
2. 回滚所有33号之后的迁移
3. 恢复到32_create_function_modules.sql状态
*/

-- 创建版本记录表（如果不存在）
CREATE TABLE IF NOT EXISTS system_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  description text,
  applied_at timestamptz DEFAULT now()
);

-- 记录3.0版本开始
INSERT INTO system_versions (version, description)
VALUES ('3.0.0-start', '3.0版本开发开始，基于2.0.0稳定版本');
```

---

## 🔙 快速回滚方案

### 方案1：Git代码回滚

#### 回滚到2.0版本
```bash
# 方法1：使用标签回滚
git checkout v2.0.0

# 方法2：使用分支回滚
git checkout release/v2.0

# 方法3：创建新分支从2.0版本开始
git checkout -b hotfix/rollback-from-v3.0 v2.0.0
```

#### 回滚后重新部署
```bash
# 1. 清理缓存
rm -rf dist node_modules

# 2. 重新安装依赖
pnpm install

# 3. 重新编译
pnpm run dev:weapp
```

### 方案2：数据库回滚

#### 回滚到2.0版本数据库状态
```bash
# 1. 查看当前迁移状态
supabase migration list

# 2. 回滚到32号迁移（2.0最后一个迁移）
supabase migration down --to 32

# 3. 验证数据库状态
supabase db diff
```

#### 手动回滚SQL
```sql
-- 如果需要手动回滚，执行以下SQL

-- 1. 删除3.0版本的表（示例）
-- DROP TABLE IF EXISTS v3_new_table_1;
-- DROP TABLE IF EXISTS v3_new_table_2;

-- 2. 恢复2.0版本的表结构（如果有修改）
-- ALTER TABLE existing_table DROP COLUMN IF EXISTS v3_new_column;

-- 3. 记录回滚操作
INSERT INTO system_versions (version, description)
VALUES ('3.0.0-rollback', '从3.0版本回滚到2.0版本');
```

---

## 📊 版本对比和测试

### 对比清单

#### 功能对比
| 功能模块 | 2.0版本 | 3.0版本 | 状态 |
|---------|---------|---------|------|
| 登录系统 | ✅ 完整 | 🔄 待定 | - |
| 多租户管理 | ✅ 完整 | 🔄 待定 | - |
| 品牌配置 | ✅ 完整 | 🔄 待定 | - |
| 权限管理 | ✅ 完整 | 🔄 待定 | - |
| 员工管理 | ✅ 完整 | 🔄 待定 | - |
| 排班管理 | ✅ 完整 | 🔄 待定 | - |
| 成本管控 | ✅ 完整 | 🔄 待定 | - |
| 数据分析 | ✅ 完整 | 🔄 待定 | - |

#### 数据库对比
| 表名 | 2.0版本 | 3.0版本 | 变更说明 |
|------|---------|---------|---------|
| tenants | ✅ 存在 | 🔄 待定 | - |
| employees | ✅ 存在 | 🔄 待定 | - |
| function_modules | ✅ 存在 | 🔄 待定 | - |
| employee_permissions | ✅ 存在 | 🔄 待定 | - |
| position_templates | ✅ 存在 | 🔄 待定 | - |

---

## 🧪 测试策略

### 2.0版本基准测试

#### 创建测试基准
```bash
# 1. 在2.0版本上运行完整测试
pnpm run test

# 2. 记录测试结果
# - 所有功能正常工作
# - 所有页面可以访问
# - 所有API调用成功
# - 数据库操作正常

# 3. 创建测试报告
# 保存到 TEST_BASELINE_V2.0.md
```

#### 测试清单（2.0版本）
- [ ] 登录功能测试
  - [ ] 手机验证码登录
  - [ ] 微信ID登录
  - [ ] 登录输入框显示正常
- [ ] 品牌配置测试
  - [ ] 餐段配置（添加、编辑、删除）
  - [ ] 餐段时间冲突检测
  - [ ] 班次配置（添加、编辑、删除）
  - [ ] 班次时间冲突检测
  - [ ] 跨天班次支持
- [ ] 权限管理测试
  - [ ] 功能模块树显示
  - [ ] 展开/收起功能
  - [ ] 全选/清空功能
  - [ ] 员工权限配置
  - [ ] 岗位模板配置
- [ ] 其他功能测试
  - [ ] 员工管理
  - [ ] 排班管理
  - [ ] 成本管控
  - [ ] 数据分析

### 3.0版本回归测试

#### 测试流程
```bash
# 1. 在3.0版本上运行相同的测试
pnpm run test

# 2. 对比测试结果
# - 2.0版本的所有功能必须正常工作
# - 新增功能需要通过测试
# - 性能不能明显下降

# 3. 如果测试失败
# - 记录失败原因
# - 评估是否需要回滚
# - 修复问题后重新测试
```

---

## 📝 开发规范

### 3.0版本开发规范

#### 代码提交规范
```bash
# 提交信息格式
<type>(<scope>): <subject>

# type类型
feat: 新功能
fix: 修复BUG
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关

# 示例
feat(v3.0): 添加新的数据导出功能
fix(v3.0): 修复权限管理的展开问题
docs(v3.0): 更新3.0版本开发文档
```

#### 分支命名规范
```bash
# 功能分支
feature/v3.0-<功能名称>
例如：feature/v3.0-data-export

# 修复分支
fix/v3.0-<问题描述>
例如：fix/v3.0-permission-bug

# 重构分支
refactor/v3.0-<重构内容>
例如：refactor/v3.0-api-structure
```

#### 代码审查规范
1. **必须审查的内容**
   - 数据库迁移文件
   - 权限相关代码
   - API接口变更
   - 核心业务逻辑

2. **审查检查点**
   - 代码是否符合规范
   - 是否有潜在的BUG
   - 是否影响现有功能
   - 是否有足够的错误处理
   - 是否有必要的注释

---

## 🚨 应急预案

### 场景1：3.0版本出现严重BUG

#### 应急步骤
```bash
# 1. 立即停止3.0版本部署
# 2. 评估BUG影响范围
# 3. 决定是修复还是回滚

# 如果决定回滚：
git checkout release/v2.0
pnpm install
pnpm run dev:weapp

# 如果决定修复：
git checkout -b hotfix/v3.0-critical-bug
# 修复BUG
git commit -m "fix(v3.0): 修复严重BUG"
git checkout feature/v3.0
git merge hotfix/v3.0-critical-bug
```

### 场景2：数据库迁移失败

#### 应急步骤
```bash
# 1. 停止应用
# 2. 检查迁移错误日志
supabase migration list

# 3. 回滚失败的迁移
supabase migration down

# 4. 修复迁移文件
# 5. 重新应用迁移
supabase migration up

# 6. 验证数据库状态
supabase db diff
```

### 场景3：功能冲突

#### 应急步骤
```bash
# 1. 识别冲突的功能
# 2. 评估影响范围
# 3. 创建隔离分支测试

git checkout -b test/conflict-resolution
# 测试和修复冲突
# 确认无问题后合并
```

---

## 📋 检查清单

### 开始3.0开发前的检查

- [ ] 已创建v2.0.0标签
- [ ] 已创建release/v2.0分支
- [ ] 已创建develop分支
- [ ] 已创建feature/v3.0分支
- [ ] 已创建数据库版本标记
- [ ] 已完成2.0版本基准测试
- [ ] 已备份当前数据库
- [ ] 已记录当前系统状态
- [ ] 已准备回滚方案
- [ ] 团队成员已了解版本控制流程

### 3.0开发过程中的检查

- [ ] 每天提交代码到feature/v3.0分支
- [ ] 定期运行回归测试
- [ ] 记录所有数据库变更
- [ ] 更新版本对比文档
- [ ] 及时处理发现的问题
- [ ] 保持与2.0版本的兼容性

### 3.0版本发布前的检查

- [ ] 所有功能测试通过
- [ ] 回归测试通过
- [ ] 性能测试通过
- [ ] 安全测试通过
- [ ] 文档已更新
- [ ] 回滚方案已验证
- [ ] 团队成员已培训
- [ ] 用户已通知

---

## 📚 相关文档

- `FIXES_SUMMARY.md` - 2.0版本修复总结
- `TODO.md` - 功能完善任务清单
- `BRAND_CONFIG_PERMISSION_FIX.md` - 品牌配置和权限管理修复文档
- `LOGIN_INPUT_FIX.md` - 登录输入框修复文档

---

## 🎯 下一步行动

### 立即执行
1. ✅ 创建版本控制计划文档（本文档）
2. ⏳ 创建v2.0.0标签
3. ⏳ 创建分支结构
4. ⏳ 创建数据库版本标记
5. ⏳ 运行2.0版本基准测试

### 后续执行
1. 开始3.0版本需求分析
2. 制定3.0版本开发计划
3. 分配开发任务
4. 开始3.0版本开发

---

**文档创建时间**：2025-11-06
**当前版本**：2.0.0（稳定版）
**目标版本**：3.0.0（开发中）
**文档状态**：✅ 已完成
