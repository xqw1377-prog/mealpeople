# 快速参考卡片

## 🚀 5秒钟了解项目

```
项目名称：餐时间日人力成本管控助手
当前版本：2.0.0（稳定）
开发版本：3.0.0（规划中）
核心理念：员工视角、容易学做管、餐饮特色
```

---

## 📖 我应该看什么？

### 🆕 新手（第一次接触）
👉 [START_HERE.md](./START_HERE.md) - 5分钟快速了解

### 👨‍💻 开发人员
👉 [V3.0_DATABASE_DESIGN_REVISED.md](./V3.0_DATABASE_DESIGN_REVISED.md) - 数据库设计
👉 [V3.0_DEVELOPMENT_PLAN_REVISED.md](./V3.0_DEVELOPMENT_PLAN_REVISED.md) - 开发计划

### 📱 产品经理
👉 [V3.0_SUMMARY.md](./V3.0_SUMMARY.md) - 版本总结
👉 [V3.0_REQUIREMENTS_REVISED.md](./V3.0_REQUIREMENTS_REVISED.md) - 需求文档

### 🎨 设计师
👉 [CATERING_INDUSTRY_FEATURES.md](./CATERING_INDUSTRY_FEATURES.md) - 餐饮特色
👉 [V3.0_REQUIREMENTS_REVISED.md](./V3.0_REQUIREMENTS_REVISED.md) - 需求文档

### 📊 项目经理
👉 [V3.0_DEVELOPMENT_PLAN_REVISED.md](./V3.0_DEVELOPMENT_PLAN_REVISED.md) - 开发计划
👉 [V3.0_LAUNCH_CHECKLIST.md](./V3.0_LAUNCH_CHECKLIST.md) - 启动清单

### 🔍 查找文档
👉 [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) - 文档索引

---

## 🎯 核心理念（时刻记住）

```
✅ 员工是主角 - 从员工视角设计
✅ 容易学 - 10分钟上手
✅ 容易做 - 3步完成操作
✅ 容易管 - 自动化智能化
✅ 餐饮特色 - 更懂餐饮人

❌ 不要复杂
❌ 不要专业术语
❌ 不要通用设计
❌ 不要管理导向
```

---

## 📱 核心功能（员工视角）

```
1. 我的工作台 - 今日概览
2. 我的排班 - 排班管理
3. 我的任务 - 任务管理
4. 我的收入 - 收入管理
5. 我的成长 - 成长管理
6. 学习中心 - 学习管理
7. 我的团队 - 团队管理
8. 求职助手 - 求职管理
```

---

## 🚀 如何开始？

### 3步开始开发

#### 步骤1：创建Git分支
```bash
git tag -a v2.0.0 -m "Release version 2.0.0"
git checkout -b release/v2.0
git checkout main
git checkout -b develop
git checkout -b feature/v3.0
```

#### 步骤2：应用数据库版本标记
```bash
supabase db push
```

#### 步骤3：开始开发
```bash
git checkout feature/v3.0
pnpm run dev:weapp
```

详细步骤：[V3.0_LAUNCH_CHECKLIST.md](./V3.0_LAUNCH_CHECKLIST.md)

---

## 🔙 如何回滚？

### 一键回滚
```bash
./rollback-to-v2.0.sh
```

### 手动回滚
```bash
git checkout v2.0.0
rm -rf node_modules dist && pnpm install
pnpm run dev:weapp
```

---

## 🎨 设计检查（每个功能）

```
1. 员工能10分钟学会吗？
2. 操作能3步完成吗？
3. 界面够简单直观吗？
4. 符合餐饮行业吗？
5. 员工会喜欢用吗？
```

---

## 📊 开发进度

### 第一阶段（2个月）
```
Week 1-2: 我的工作台
Week 3:   我的排班
Week 4:   我的任务
Week 5:   我的收入
Week 6:   简单管理
Week 7-8: 测试优化
```

### 第二阶段（1.5个月）
```
Week 1-2: 我的成长
Week 3-4: 学习中心
Week 5-6: 我的团队
```

### 第三阶段（2个月）
```
Week 1-2: 数据收集
Week 3-4: AI评估
Week 5-6: 员工画像
```

### 第四阶段（1.5个月）
```
Week 1-2: 简历管理
Week 3-4: 职位推荐
Week 5-6: 求职管理
```

**总计**：7个月

---

## 🔗 重要链接

### 最重要的3个
1. [START_HERE.md](./START_HERE.md) ⭐⭐⭐⭐⭐
2. [V3.0_SUMMARY.md](./V3.0_SUMMARY.md) ⭐⭐⭐⭐⭐
3. [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) ⭐⭐⭐⭐⭐

### 开发必读
- [V3.0_DATABASE_DESIGN_REVISED.md](./V3.0_DATABASE_DESIGN_REVISED.md)
- [V3.0_DEVELOPMENT_PLAN_REVISED.md](./V3.0_DEVELOPMENT_PLAN_REVISED.md)
- [START_V3_DEVELOPMENT.md](./START_V3_DEVELOPMENT.md)

### 版本控制
- [VERSION_ISOLATION_QUICK_GUIDE.md](./VERSION_ISOLATION_QUICK_GUIDE.md)
- [rollback-to-v2.0.sh](./rollback-to-v2.0.sh)

---

## 💡 一句话总结

**一个从员工视角出发、专为餐饮行业打造、容易学做管的工作成长助手**

---

**文档创建时间**：2025-11-06
**文档类型**：快速参考
**文档状态**：✅ 已完成
