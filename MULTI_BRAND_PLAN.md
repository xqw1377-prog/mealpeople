# 多品牌架构改造计划

## 1. 架构调整概述

### 1.1 当前架构问题
- 租户（tenant）和品牌（brand）概念混淆
- 一个租户只能管理一个品牌
- 无法支持连锁企业管理多个品牌的场景

### 1.2 目标架构
```
租户（Tenant）- 公司/组织
  └── 品牌1（Brand）
      ├── 门店1（Store）
      ├── 门店2（Store）
      └── 员工（Employees）
  └── 品牌2（Brand）
      ├── 门店3（Store）
      └── 员工（Employees）
```

### 1.3 核心改动
- 新增brands表
- 现有业务表添加brand_id字段
- 数据隔离从tenant级别细化到brand级别
- 租户管理员可以管理多个品牌

## 2. 数据库改造

### 2.1 新增brands表
```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  logo_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 需要添加brand_id的表
- stores（门店）
- employees（员工）
- schedules（排班）
- schedule_logs（排班日志）
- efficiency_standards（效能标准）
- cost_controls（成本管控）
- 其他业务表

### 2.3 数据迁移策略
- 为每个现有租户创建一个默认品牌
- 将现有数据关联到默认品牌
- 保留tenant_id字段，同时添加brand_id字段

## 3. 功能改造

### 3.1 系统引导流程
1. 创建租户信息
2. 创建第一个品牌（必填）
3. 设置品牌下的门店
4. 设置品牌下的员工
5. 配置排班规则

### 3.2 品牌管理功能
- 品牌列表页面
- 新增品牌
- 编辑品牌信息
- 切换当前品牌
- 删除品牌（需确认）

### 3.3 全局状态管理
- 当前租户ID
- 当前品牌ID
- 当前门店ID
- 品牌列表缓存

### 3.4 页面调整
- 首页：添加品牌选择器
- 管理中心：添加品牌管理入口
- 所有业务页面：使用brand_id过滤数据

## 4. 实施步骤

### 阶段1：数据库改造 ✅
- [ ] 创建brands表
- [ ] 为现有表添加brand_id字段
- [ ] 创建数据迁移脚本
- [ ] 更新RLS策略

### 阶段2：API改造
- [ ] 创建品牌管理API
- [ ] 修改现有API，支持brand_id过滤
- [ ] 更新类型定义

### 阶段3：前端改造
- [ ] 创建品牌管理页面
- [ ] 添加品牌选择器组件
- [ ] 修改系统引导流程
- [ ] 更新全局状态管理

### 阶段4：测试验证
- [ ] 多品牌数据隔离测试
- [ ] 品牌切换功能测试
- [ ] 数据迁移验证

## 5. 注意事项

### 5.1 数据隔离
- 确保不同品牌的数据完全隔离
- RLS策略需要同时检查tenant_id和brand_id

### 5.2 向后兼容
- 保留tenant_id字段
- 现有功能不受影响
- 逐步迁移到品牌维度

### 5.3 性能优化
- 为brand_id创建索引
- 优化多表关联查询
- 缓存品牌信息

## 6. 时间估算
- 数据库改造：2小时
- API改造：3小时
- 前端改造：4小时
- 测试验证：2小时
- 总计：11小时
