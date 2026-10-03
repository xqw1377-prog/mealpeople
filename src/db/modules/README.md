# 业务模块目录

## 📁 目录结构

```
modules/
├── index.ts           # 模块统一导出
├── tenant.ts          # 租户管理模块
├── user.ts            # 用户管理模块
└── brand-store.ts     # 品牌和门店管理模块
```

## 📦 已实现的模块

### 1. 租户管理模块 (`tenant.ts`)
- 租户基础 API
- 租户设置 API
- 租户申请 API
- 邀请码管理 API

### 2. 用户管理模块 (`user.ts`)
- 用户基础 API
- 员工管理 API
- 权限管理 API

### 3. 品牌和门店管理模块 (`brand-store.ts`)
- 品牌管理 API
- 门店管理 API

## 🔜 待实现的模块

- `schedule.ts` - 排班管理模块
- `cost.ts` - 成本管理模块
- `operations.ts` - 运营数据模块
- `parttime.ts` - 兼职管理模块
- `config.ts` - 配置管理模块
- `wechat.ts` - 微信集成模块

## 📝 使用方式

### 从统一入口导入（推荐）
```typescript
import {getTenants, getCurrentUser} from '@/db/api'
```

### 从模块直接导入
```typescript
import {getTenants} from '@/db/modules/tenant'
import {getCurrentUser} from '@/db/modules/user'
```

### 从模块索引导入
```typescript
import {getTenants, getCurrentUser} from '@/db/modules'
```

## 🎯 设计原则

- **单一职责**：每个模块只负责一个业务领域
- **高内聚**：相关功能放在同一模块
- **低耦合**：模块间依赖最小化
- **向后兼容**：保持原有 API 导出方式不变

## 📚 详细文档

参见项目根目录的 `代码分包重构说明.md`
