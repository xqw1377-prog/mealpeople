# 小程序分包配置说明

## 分包概述

为了优化小程序的启动速度和用户体验，本项目采用了分包加载策略。将功能模块按照业务逻辑划分为6个分包，实现按需加载。

## 分包结构

### 主包（Main Package）
**路径**: `src/pages/`  
**大小目标**: < 2MB  
**包含页面**:
- 登录页 (`login`)
- 首页 (`home`) - TabBar
- 排班日志 (`schedule-logs`) - TabBar
- 管理中心 (`management`) - TabBar
- 我的 (`profile`) - TabBar
- 租户选择 (`tenant-select`)
- 启动中心 (`startup-center`)
- 设置向导 (`setup-wizard`)
- 绑定微信 (`bind-wechat`)
- 通知 (`notifications`)

**说明**: 主包包含核心功能和所有 TabBar 页面，确保用户首次启动时能快速看到主要界面。

---

### 分包A：员工与门店管理
**路径**: `src/packageA/pages/`  
**包名**: `employee-store`  
**功能**: 员工管理、门店管理、品牌管理

**包含页面**:
- `employees` - 员工管理
- `employee-form` - 员工表单
- `employee-import` - 员工导入
- `temp-workers` - 兼职员工
- `temp-worker-form` - 兼职员工表单
- `stores` - 门店管理
- `store-form` - 门店表单
- `brand-management` - 品牌管理
- `brand-add` - 添加品牌
- `brand-edit` - 编辑品牌
- `position-management` - 岗位管理

**预下载时机**: 
- 用户进入首页时
- 用户进入管理中心时

---

### 分包B：营收与数据分析
**路径**: `src/packageB/pages/`  
**包名**: `revenue-analytics`  
**功能**: 营收管理、数据分析、成本管控

**包含页面**:
- `revenue-management` - 营收管理
- `revenue-prediction` - 营收预测
- `revenue-weekly-calendar` - 营收周历
- `revenue-detail` - 营收详情
- `revenue-detail-form` - 营收详情表单
- `revenue-detail-list` - 营收详情列表
- `revenue-excel-import` - Excel导入
- `revenue-import` - 营收导入
- `revenue-history-import` - 历史营收导入
- `impact-factors` - 影响因子
- `analytics` - 数据分析
- `data-analytics` - 数据分析（详细）
- `cost-control` - 成本管控
- `data-export` - 数据导出
- `operation-adjustment` - 运营调整
- `operation-review` - 运营复盘

**预下载时机**: 
- 用户进入首页时

---

### 分包C：排班管理
**路径**: `src/packageC/pages/`  
**包名**: `schedule`  
**功能**: 排班管理、排班优化、班次管理

**包含页面**:
- `schedules` - 排班管理
- `schedule-form` - 排班表单
- `schedule-log-form` - 排班日志表单
- `schedule-planning` - 排班规划
- `schedule-optimization` - 排班优化
- `monthly-schedule` - 月度排班
- `work-shifts` - 班次管理
- `debug-work-shifts` - 班次调试
- `leave-request` - 休假申请

**预下载时机**: 
- 用户进入排班日志页时

---

### 分包D：业务配置
**路径**: `src/packageD/pages/`  
**包名**: `config`  
**功能**: 系统配置、业务规则配置

**包含页面**:
- `efficiency-config` - 效能配置
- `min-revenue-config` - 低营收配置
- `business-area-config` - 业务区域配置
- `business-areas` - 业务区域
- `rest-day-rules` - 排休规则
- `brand-config` - 品牌配置
- `meal-periods` - 餐段配置
- `tenant-settings` - 租户设置
- `quick-reference` - 快速参考

**预下载时机**: 
- 用户进入管理中心时

---

### 分包E：租户与权限管理
**路径**: `src/packageE/pages/`  
**包名**: `tenant-admin`  
**功能**: 租户管理、权限管理、用户管理

**包含页面**:
- `super-admin-tenants` - 超级管理员租户
- `tenant-management` - 租户管理
- `tenant-applications` - 租户申请
- `create-tenant` - 创建租户
- `my-applications` - 我的申请
- `invite-employee` - 邀请员工
- `join-tenant` - 加入租户
- `user-management` - 用户管理
- `permission-management` - 权限管理
- `admin` - 管理员

**预下载时机**: 按需加载（用户点击相关功能时）

---

### 分包F：高级功能
**路径**: `src/packageF/pages/`  
**包名**: `advanced`  
**功能**: 连锁管理、风险预警、教程

**包含页面**:
- `chain-management` - 连锁管理
- `store-hierarchy` - 门店层级
- `core-position-backup` - 核心岗位备份
- `risk-alerts` - 风险预警
- `tutorial` - 教程

**预下载时机**: 按需加载（用户点击相关功能时）

---

## 预下载配置

为了优化用户体验，配置了智能预下载策略：

```typescript
preloadRule: {
  'pages/home/index': {
    network: 'all',
    packages: ['employee-store', 'revenue-analytics']
  },
  'pages/management/index': {
    network: 'all',
    packages: ['employee-store', 'config']
  },
  'pages/schedule-logs/index': {
    network: 'all',
    packages: ['schedule']
  }
}
```

**说明**:
- `network: 'all'` - 在所有网络环境下都预下载（包括 WiFi 和移动网络）
- 预下载在后台进行，不影响当前页面的使用
- 预下载的分包会被缓存，下次访问时直接使用

---

## 页面跳转规则

### 跳转到主包页面
```typescript
// TabBar 页面使用 switchTab
Taro.switchTab({ url: '/pages/home/index' })

// 非 TabBar 页面使用 navigateTo
Taro.navigateTo({ url: '/pages/notifications/index' })
```

### 跳转到分包页面
```typescript
// 分包A - 员工管理
Taro.navigateTo({ url: '/packageA/pages/employees/index' })

// 分包B - 营收管理
Taro.navigateTo({ url: '/packageB/pages/revenue-management/index' })

// 分包C - 排班管理
Taro.navigateTo({ url: '/packageC/pages/schedules/index' })

// 分包D - 业务配置
Taro.navigateTo({ url: '/packageD/pages/efficiency-config/index' })

// 分包E - 租户管理
Taro.navigateTo({ url: '/packageE/pages/tenant-management/index' })

// 分包F - 高级功能
Taro.navigateTo({ url: '/packageF/pages/chain-management/index' })
```

**注意**: 
- 分包页面的路径必须包含分包根目录（如 `/packageA/`）
- 分包页面不能作为 TabBar 页面
- 分包之间可以相互跳转

---

## 分包大小限制

根据微信小程序官方规定：
- **主包大小**: 不超过 2MB
- **单个分包大小**: 不超过 2MB
- **所有分包总大小**: 不超过 20MB（普通小程序）/ 24MB（使用分包异步化）

**当前配置**:
- 主包：10个页面（核心功能）
- 分包A：11个页面
- 分包B：16个页面
- 分包C：9个页面
- 分包D：9个页面
- 分包E：10个页面
- 分包F：5个页面

**总计**: 70个页面

---

## 分包优化建议

### 1. 图片资源优化
- 使用 WebP 格式
- 压缩图片大小
- 大图片使用 CDN

### 2. 代码优化
- 移除未使用的代码
- 使用代码压缩
- 避免重复引入相同的库

### 3. 分包策略优化
- 高频使用的功能放在主包或预下载分包
- 低频功能放在独立分包
- 相关功能放在同一分包

### 4. 监控分包大小
```bash
# 构建后查看分包大小
npm run build:weapp
du -sh dist/packageA dist/packageB dist/packageC dist/packageD dist/packageE dist/packageF
```

---

## 常见问题

### Q1: 分包页面跳转失败？
**A**: 检查路径是否正确，分包页面路径必须包含分包根目录（如 `/packageA/pages/...`）

### Q2: 分包加载慢？
**A**: 
1. 检查分包大小是否过大
2. 使用预下载配置
3. 优化分包内的资源

### Q3: 如何查看分包加载情况？
**A**: 在微信开发者工具中，打开"调试器" -> "Network"，可以看到分包的加载情况

### Q4: 分包页面能否使用主包的组件？
**A**: 可以。分包可以引用主包的公共资源（如组件、工具函数等）

### Q5: 主包能否引用分包的资源？
**A**: 不可以。主包不能引用分包的资源，这是单向依赖关系

---

## 版本历史

- **v1.0** (2025-11-06): 初始分包配置，划分6个功能分包
  - 主包：10个核心页面
  - 分包A：员工与门店管理（11个页面）
  - 分包B：营收与数据分析（14个页面）
  - 分包C：排班管理（8个页面）
  - 分包D：业务配置（9个页面）
  - 分包E：租户与权限管理（10个页面）
  - 分包F：高级功能（5个页面）

---

*最后更新：2025-11-06*
