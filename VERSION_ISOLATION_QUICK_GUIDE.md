# 版本隔离快速指南

## 📋 一分钟了解版本隔离

### 为什么需要版本隔离？
- ✅ 3.0开发过程中出现问题可以快速回滚到2.0
- ✅ 保护2.0稳定版本不被破坏
- ✅ 支持并行开发和测试
- ✅ 降低开发风险

### 已完成的准备工作
- ✅ 创建版本控制文档（4个文档）
- ✅ 创建数据库版本标记（迁移文件33）
- ✅ 创建快速回滚脚本（rollback-to-v2.0.sh）
- ✅ 建立测试基准（76项测试用例）

---

## 🚀 快速开始3.0开发

### 三步开始开发

#### 步骤1：创建Git分支（5分钟）

```bash
# 1. 创建2.0版本标签
git tag -a v2.0.0 -m "Release version 2.0.0"

# 2. 创建release分支
git checkout -b release/v2.0
git checkout main

# 3. 创建develop分支
git checkout -b develop

# 4. 创建feature分支
git checkout -b feature/v3.0
```

#### 步骤2：应用数据库版本标记（2分钟）

```bash
# 使用Supabase CLI
supabase db push

# 或手动执行
# 登录Supabase Dashboard → SQL Editor
# 执行 supabase/migrations/33_v3_0_start_marker.sql
```

#### 步骤3：开始开发（立即）

```bash
# 确认在feature/v3.0分支
git checkout feature/v3.0

# 启动开发服务器
pnpm run dev:weapp

# 开始开发！
```

---

## 🔙 快速回滚到2.0

### 一键回滚（推荐）

```bash
# 执行回滚脚本，按提示操作
./rollback-to-v2.0.sh
```

### 手动回滚（3步）

```bash
# 1. 回滚代码
git checkout v2.0.0

# 2. 重新安装依赖
rm -rf node_modules dist && pnpm install

# 3. 启动服务器
pnpm run dev:weapp
```

---

## 📚 文档索引

### 核心文档（必读）
| 文档 | 用途 | 阅读时间 |
|------|------|---------|
| `START_V3_DEVELOPMENT.md` | 开始3.0开发的完整指南 | 10分钟 |
| `VERSION_ISOLATION_SUMMARY.md` | 版本隔离实施总结 | 5分钟 |
| `VERSION_CONTROL_PLAN.md` | 详细的版本控制方案 | 15分钟 |

### 参考文档
| 文档 | 用途 |
|------|------|
| `TEST_BASELINE_V2.0.md` | 2.0版本测试基准 |
| `FIXES_SUMMARY.md` | 2.0版本修复总结 |
| `rollback-to-v2.0.sh` | 快速回滚脚本 |

---

## ✅ 开发前检查清单

### 必须完成（5项）
- [ ] 创建Git标签和分支
- [ ] 应用数据库版本标记
- [ ] 备份当前数据库
- [ ] 运行2.0版本测试
- [ ] 阅读开发规范

### 推荐完成（3项）
- [ ] 制定3.0开发计划
- [ ] 团队成员培训
- [ ] 设置CI/CD

---

## 🚨 紧急情况处理

### 场景1：3.0出现严重BUG
```bash
# 立即回滚
./rollback-to-v2.0.sh
```

### 场景2：数据库迁移失败
```bash
# 回滚迁移
supabase migration down
```

### 场景3：不确定当前版本
```bash
# 查看版本
git describe --tags --always

# 查看数据库版本
# SELECT * FROM system_versions ORDER BY applied_at DESC LIMIT 1;
```

---

## 💡 开发规范速查

### 提交信息格式
```
feat(v3.0): 添加新功能
fix(v3.0): 修复BUG
docs(v3.0): 更新文档
```

### 分支命名
```
feature/v3.0-<功能名>
fix/v3.0-<问题描述>
```

### 迁移文件命名
```
34_v3_0_<功能描述>.sql
35_v3_0_<功能描述>.sql
```

---

## 📊 版本对比

| 项目 | 2.0版本 | 3.0版本 |
|------|---------|---------|
| 状态 | ✅ 稳定 | 🔄 开发中 |
| 功能 | 8个模块 | 待定 |
| 测试 | 76项通过 | 待测试 |
| 迁移 | 32个文件 | 33+个文件 |

---

## 🎯 关键命令速查

### Git操作
```bash
# 查看当前分支
git branch

# 查看标签
git tag

# 切换到2.0
git checkout v2.0.0

# 切换到3.0
git checkout feature/v3.0
```

### 数据库操作
```bash
# 应用迁移
supabase db push

# 回滚迁移
supabase migration down --to 32

# 查看迁移状态
supabase migration list
```

### 开发操作
```bash
# 安装依赖
pnpm install

# 启动开发
pnpm run dev:weapp

# 代码检查
pnpm run lint
```

---

## 📞 获取帮助

### 遇到问题？

1. **查看文档**
   - 先查看 `START_V3_DEVELOPMENT.md`
   - 再查看 `VERSION_ISOLATION_SUMMARY.md`

2. **使用回滚脚本**
   - 执行 `./rollback-to-v2.0.sh`
   - 按提示操作

3. **查看应急预案**
   - 参考 `VERSION_CONTROL_PLAN.md` 的应急预案部分

---

## 🎉 准备就绪？

### 确认以下条件：
- ✅ 已创建Git分支
- ✅ 已应用数据库标记
- ✅ 已备份数据库
- ✅ 已运行测试
- ✅ 已阅读文档

### 开始开发！
```bash
git checkout feature/v3.0
pnpm run dev:weapp
```

---

**快速指南版本**：1.0
**创建时间**：2025-11-06
**适用版本**：2.0.0 → 3.0.0
