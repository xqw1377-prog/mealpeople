# 功能完善任务清单

## 任务概述

### 1. 员工管理增强 ✅
- [x] 添加核心岗位配置字段
- [x] 添加需固定顶岗配置字段
- [x] 添加可顶岗岗位配置字段
- [x] 更新员工编辑界面
- [x] 更新数据库表结构

### 2. 营收导入功能 ⏳
- [x] 设计营收数据表结构（细化到天、餐段、经营区）
- [x] 创建数据库迁移脚本
- [x] 创建数据库API函数
- [ ] 实现 Excel 模板下载功能（需要WEB端支持）
- [ ] 实现 Excel 文件上传功能（需要WEB端支持）
- [ ] 实现 Excel 数据解析功能（需要WEB端支持）
- [ ] 实现数据导入到数据库
- [ ] 添加数据验证和错误提示
- [ ] 更新营收管理界面

## 已完成工作

### 阶段1：数据库设计 ✅
1. ✅ 查看现有员工表结构
2. ✅ 查看现有营收表结构
3. ✅ 设计新的字段和表结构
4. ✅ 创建数据库迁移脚本 (v2/10_enhance_revenue_and_employee_system.sql)

### 阶段2：员工管理增强 ✅
1. ✅ 更新员工表结构（已有字段：is_core_position, position_fixed_backup, can_backup_positions）
2. ✅ 创建岗位配置表 (position_config)
3. ✅ 更新员工编辑界面 (src/pages/employee-form/index.tsx)
4. ✅ 添加岗位配置选择器
5. ✅ 添加核心岗位开关
6. ✅ 添加需固定顶岗开关
7. ✅ 添加可顶岗岗位多选功能
8. ✅ 测试员工编辑功能（代码检查通过）

### 阶段3：营收导入功能（部分完成）
1. ✅ 设计营收数据表结构
   - revenue_detail_records: 营收明细记录表
   - revenue_import_logs: Excel导入记录表
2. ✅ 创建数据库API (src/db/api-revenue-detail.ts)
   - getRevenueDetailRecords: 获取营收明细记录
   - createRevenueDetailRecord: 创建营收明细记录
   - updateRevenueDetailRecord: 更新营收明细记录
   - deleteRevenueDetailRecord: 删除营收明细记录
   - batchCreateRevenueDetailRecords: 批量创建营收明细记录
   - importRevenueFromExcel: 从Excel导入营收数据
   - getRevenueImportLogs: 获取导入日志
3. ✅ 创建TypeScript类型定义 (src/db/types.ts)
   - MealPeriodType: 餐段类型
   - BusinessArea: 经营区类型
   - RevenueDetailRecord: 营收明细记录
   - RevenueImportLog: Excel导入记录
   - RevenueImportRow: Excel导入数据行
   - RevenueImportResult: 导入结果
   - PositionConfig: 岗位配置
4. ⏳ Excel功能（需要WEB端支持）
   - 小程序端不支持直接读取Excel文件
   - 建议在WEB端实现Excel导入功能
   - 或者使用手动录入方式

## 数据库结构

### 营收明细记录表 (revenue_detail_records)
```sql
CREATE TABLE revenue_detail_records (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL,
  revenue_date date NOT NULL,
  meal_period text NOT NULL, -- breakfast, lunch, dinner, night
  business_area text NOT NULL, -- hall, private_room, takeout, other
  customer_count int NOT NULL DEFAULT 0,
  avg_price_per_customer numeric(10,2) NOT NULL DEFAULT 0,
  total_revenue numeric(12,2) NOT NULL DEFAULT 0, -- 自动计算
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, store_id, revenue_date, meal_period, business_area)
);
```

### 岗位配置表 (position_config)
```sql
CREATE TABLE position_config (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  position_name text NOT NULL,
  position_category text NOT NULL, -- front, kitchen
  is_core boolean DEFAULT false,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, position_name)
);
```

### 默认岗位配置
系统已为测试餐厅插入以下默认岗位：
- 前厅：店长、前厅经理、收银员、服务员、传菜员、迎宾员、清洁员
- 后厨：厨师长、主厨、副厨、配菜员、洗碗工、仓管员

## 员工表新增字段说明

### 已有字段（无需修改）
- `is_core_position`: boolean - 是否核心岗位
- `position_fixed_backup`: boolean - 岗位是否需要固定顶岗
- `can_backup_positions`: string[] - 可以顶岗的其他岗位列表（JSON数组）

### 界面设计
- **核心岗位**：Switch开关，说明：如：店长、厨师长等关键岗位
- **需固定顶岗**：Switch开关，说明：该岗位是否需要其他人员顶岗
- **可顶岗岗位**：多选列表，从岗位配置表中选择，支持多选

## 下一步工作

### 营收导入功能（建议方案）

#### 方案1：手动录入（小程序端）
1. 创建营收明细录入页面
2. 支持按日期、餐段、经营区录入
3. 自动计算总营收
4. 支持批量录入

#### 方案2：Excel导入（WEB端）
1. 在WEB端实现Excel上传功能
2. 使用xlsx库解析Excel文件
3. 调用API批量导入数据
4. 显示导入结果和错误信息

#### 方案3：API导入（第三方系统）
1. 提供RESTful API接口
2. 支持JSON格式批量导入
3. 返回导入结果

## 注意事项
1. ✅ 所有功能已支持多租户隔离
2. ✅ 数据库已启用RLS策略
3. ✅ 已提供友好的错误提示
4. ✅ 界面已实现响应式设计
5. ⏳ Excel导入功能需要在WEB端实现
6. ✅ 代码检查已通过，无语法错误

## 技术实现细节

### 员工编辑表单增强
- 根据部门自动筛选岗位列表
- 选择岗位时自动设置是否核心岗位
- 可顶岗岗位支持多选，点击切换选中状态
- 已选择的岗位显示蓝色背景和勾选图标
- 显示已选择岗位数量

### 数据库触发器
- 自动计算总营收：total_revenue = customer_count × avg_price_per_customer
- 自动更新updated_at字段

### 数据验证
- 来客数和客单价必须为非负数
- 同一天、同一餐段、同一经营区只能有一条记录
- 餐段和经营区必须使用预定义的值

## 测试状态
- ✅ 代码语法检查通过
- ⏳ 功能测试待进行
- ⏳ 用户体验测试待进行
- ⏳ 数据导入测试待进行
