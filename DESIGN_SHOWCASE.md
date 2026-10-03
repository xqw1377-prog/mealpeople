# 餐时间日人力成本管控助手 - 设计展示

## 🎨 设计系统概览

### 核心设计理念
**容易学、容易做、容易管理**

git config --global user.name miaoda
1. **简洁直观**：清晰的视觉层次，一目了然的信息架构
2. **统一规范**：全局统一的设计语言和交互模式
3. **用户友好**：贴心的提示和反馈，降低学习成本

---

## 🌈 视觉设计系统

### 配色方案

#### 主题色 - Indigo（靛蓝色）
```
git config --global user.name miaoda#6366f1 (Indigo-500)
git config --global user.name miaoda#eef2ff (Indigo-50)
git config --global user.name miaoda#4338ca (Indigo-700)
```

**使用场景**：
- 主要操作按钮
- 重要信息高亮
- 选中状态标识
- 品牌识别元素

#### 背景渐变 - 温暖黄色
```
git config --global user.name miaoda#fef3c7 (Amber-100)
git config --global user.name miaoda#fde68a (Amber-200)
```

**设计意图**：
- 营造温暖、积极的氛围
- 与餐饮行业特性契合
- 提升用户情感体验

#### 功能色彩
```
git config --global user.name miaoda#10b981 (Green-500)
git config --global user.name miaoda#f59e0b (Amber-500)
git config --global user.name miaoda#ef4444 (Red-500)


#### 字体层级
```
git config --global user.name miaodatext-2xl (24px) - 页面主标题
git config --global user.name miaodatext-xl (20px) - 区块标题
git config --global user.name miaodatext-lg (18px) - 卡片标题
#
git config --global user.name miaodatext-base (16px) - 主要内容
git config --global user.name miaodatext-sm (14px) - 辅助信息
git config --global user.name miaodatext-xs (12px) - 次要提示
```

#### 字重规范
```
t-bold (700) - 标题和强调
git config --global user.name miaodafont-semibold (600) - 次级标题
git config --global user.name miaodafont-normal (400) - 正文内容
```

### 间距系统

#### 组件间距
```
git config --global user.name miaodagap-1 (4px) - 紧密相关元素
git config --global user.name miaodagap-2 (8px) - 相关元素
--------：gap-3 (12px) - 一般元素
git config --global user.name miaodagap-4 (16px) - 区块间距
```

#### 内边距
```
git config --global user.name miaodap-2 (8px) - 小组件
git config --global user.name miaodap-4 (16px) - 卡片内容
git config --global user.name miaodap-6 (24px) - 大容器
```

### 圆角规范
```
git config --global user.name miaodarounded-lg (8px) - 按钮、输入框
--------圆角：rounded-xl (12px) - 卡片
git config --global user.name miaodarounded-2xl (16px) - 对话框
ded-full - 头像、标签
```

---

## 📱 页面设计展示

### 1. 启动中心（配置入口）

**设计特点**：
- 🎯 **网格布局**：2列卡片式设计，清晰展示8个配置项
- 🎨 **黄色渐变背景**：温暖的品牌色调
- 🔷 **图标化设计**：每个配置项都有专属MDI图标
- 📝 **简洁描述**：一句话说明功能用途

**配置项列表**：
```
1. 效能配置 (i-mdi-chart-line)
2. 影响因子配置 (i-mdi-weather-partly-cloudy)
3. 营收预测 (i-mdi-crystal-ball)
4. 经营区域管理 (i-mdi-floor-plan)
5. 历史营收导入 (i-mdi-database-import)
6. 核心岗位顶岗 (i-mdi-account-switch)
7. 门店组织架构 (i-mdi-sitemap)
8. 最低营收配置 (i-mdi-account-hard-hat)
9. 排休规则配置 (i-mdi-calendar-clock)
```

### 2. 效能配置页面

**界面结构**：
```

 📊 效能配置                      │
 配置营收-效能标准                │

                                 │
 [营收区间配置卡片]               │
 • 区间范围设置                   │
 • 效能标准配置                   │
 • 可视化展示                     │
                                 │
 [新增区间按钮]                   │
                                 │

```

**设计亮点**：
- ✨ 渐变背景营造专业氛围
- 📊 数据可视化展示效能标准
- 🎯 清晰的区间范围标识
- 🔧 便捷的编辑和删除操作

### 3. 经营区域管理页面

**卡片设计**：
```

 🍽️ 餐饮区 A区                   │
 ─────────────────────────────   │
 楼层：1F  |  容量：50人          │
 营收权重：30%                    │
 状态：● 启用中                   │
                                 │
 [编辑] [删除]                    │

```

**区域类型标签**：
- 🍽️ 餐饮区 - 蓝色标签
- 👨‍🍳 厨房 - 橙色标签
- 🍺 吧台 - 紫色标签
- 📦 外卖区 - 绿色标签
- 📋 其他 - 灰色标签

### 4. 历史营收数据导入页面

**时段展示**：
```

 📅 2025年1月                     │

 2025-01-01 (周三)               │
 ─────────────────────────────   │
 🌅 早餐：¥5,000                  │
 🌞 午餐：¥15,000                 │
 🌙 晚餐：¥20,000                 │
 ⭐ 其他：¥3,000                  │
 ─────────────────────────────   │
 💰 总计：¥43,000                 │

```

**交互特点**：
- 📆 月份选择器快速切换
- 📊 四时段分类展示
- 💰 自动计算总营收
- 🏷️ 周末自动标记

### 5. 门店组织架构页面

**排班原则选择**：
```

 ⚪ 排上不排下                    │
 ─────────────────────────────   │
 上级可以排班，下级不能排班       │
                                 │
 示例：                          │
 • 店长 → 主管 ✓                 │
 • 主管 → 员工 ✓                 │
 • 员工 → 任何人 ✗               │



 ⚪ 排上可排下                    │
 ─────────────────────────────   │
 上级可以排班，下级也可以排班     │
                                 │
 示例：                          │
 • 店长 → 所有人 ✓               │
 • 主管 → 员工 ✓                 │
 • 员工 → 自己 ✓                 │

```

### 6. 排休规则配置页面

**规则详情展示**：
```

 📋 标准排休规则                  │
 ─────────────────────────────   │
 月休天数：4天                    │
 指定日期申请：最多2次            │
                                 │
 ✓ 允许存休 (最多2天)             │
 ✓ 允许连休 (最多2天)             │
                                 │
 [编辑] [删除]                    │

```

---

## 🎯 交互设计规范

### 按钮状态

#### 主要按钮
```
git config --global user.name miaodabg-indigo-500 text-white
git config --global user.name miaodabg-indigo-600
git config --global user.name miaodabg-indigo-700
git config --global user.name miaodabg-gray-300 text-gray-500
```

#### 次要按钮
```
git config --global user.name miaodabg-gray-100 text-gray-700
git config --global user.name miaodabg-gray-200
git config --global user.name miaodabg-gray-300
```

#### 危险按钮
```
git config --global user.name miaodabg-red-50 text-red-600
git config --global user.name miaodabg-red-100
git config --global user.name miaodabg-red-200
```

### 表单输入

#### 输入框
```
git config --global user.name miaodaborder-gray-300 bg-gray-50
git config --global user.name miaodaborder-indigo-500 bg-white
git config --global user.name miaodaborder-red-500 bg-red-50
```

#### 开关组件
```
git config --global user.name miaodabg-gray-300
git config --global user.name miaodabg-indigo-500
sition-all duration-300
```

### 反馈机制

#### 加载状态
```
git config --global user.name miaodai-mdi-loading
git config --global user.name miaodaanimate-spin
git config --global user.name miaodatext-indigo-500
```

#### 空状态
```
git config --global user.name miaodatext-6xl text-gray-300
git config --global user.name miaodatext-gray-600
git config --global user.name miaodatext-gray-400
```

#### Toast提示
```
git config --global user.name miaodaicon-success + 绿色
git config --global user.name miaodaicon-error + 红色
git config --global user.name miaodaicon-none + 橙色
```

---

## 📐 布局规范

### 页面结构
```

 头部说明卡片                     │ ← 固定高度

                                 │
 主内容区域                       │ ← 可滚动
 (ScrollView)                    │
                                 │
                                 │

```

### 卡片间距
```
git config --global user.name miaodap-4 (16px)
git config --global user.name miaodaspace-y-3 (12px)
git config --global user.name miaodap-4 (16px)
```

### 响应式设计
```
git --no-pager config --global user.
git config --global user.name miaoda@md:grid-cols-2
git config --global user.name miaoda@lg:grid-cols-3
```

---

## 🎨 图标系统

### MDI图标库

 Icons (MDI)作为统一的图标系统：

#### 配置类图标
```
i-mdi-chart-line - 效能配置
i-mdi-weather-partly-cloudy - 影响因子
i-mdi-crystal-ball - 营收预测
i-mdi-floor-plan - 经营区域
i-mdi-database-import - 数据导入
```

#### 操作类图标
```
i-mdi-plus - 新增
i-mdi-pencil - 编辑
i-mdi-delete - 删除
i-mdi-check - 确认
i-mdi-close - 取消
```

#### 状态类图标
```
i-mdi-loading - 加载中
i-mdi-alert-circle - 警告
i-mdi-information - 信息
i-mdi-check-circle - 成功
```

### 图标使用规范
```
git config --global user.name miaodatext-base (16px)
--------图标：text-xl (20px)
git config --global user.name miaodatext-2xl (24px)
git config --global user.name miaodatext-4xl (36px)
git config --global user.name miaodatext-6xl (60px)
```

---

## 🌟 设计亮点总结

### 1. 统一的视觉语言
- ✅ 全局统一的黄色渐变背景
- ✅ 一致的Indigo主题色
- ✅ 规范的圆角和间距
- ✅ 统一的图标风格

### 2. 清晰的信息架构
- ✅ 头部说明卡片
- ✅ 分类清晰的内容区
- ✅ 明确的操作按钮
- ✅ 友好的空状态提示

### 3. 贴心的用户体验
- ✅ 加载状态反馈
- ✅ 操作成功/失败提示
- ✅ 确认对话框保护
- ✅ 表单验证提示

### 4. 专业的视觉效果
- ✅ 柔和的阴影效果
- ✅ 流畅的过渡动画
- ✅ 彩色的状态标签
- ✅ 清晰的视觉层次

---

## 📱 移动端优化

### 触控友好
- 按钮最小高度：44px
- 点击区域充足
- 防止误触设计

### 滚动优化
- 流畅的滚动体验
- 合理的内容分页
- 下拉刷新支持

### 性能优化
- 图片懒加载
- 虚拟列表渲染
- 防抖节流处理

---

**设计团队**：秒哒AI助手
**设计系统版本**：v2.0
**最后更新**：2025-11-06

---

> 💡 **设计理念**：我们相信好的设计应该是无形的，用户在使用过程中感受到的是流畅和自然，而不是复杂和困惑。
