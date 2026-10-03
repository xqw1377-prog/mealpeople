# 排休规则配置优化文档

## 变更概述
将顶岗原则功能融合到排休规则配置中，实现统一管理，简化配置流程。

## 变更日期
2025-11-15

## 主要变更

### 1. 数据库结构变更

#### 1.1 rest_day_rules表新增字段
- **backup_rules** (jsonb): 顶岗规则配置，JSON数组格式
  - 存储核心岗位和顶岗人员的映射关系
  - 每个元素包含：
    - `core_employee_id`: 核心岗位员工ID
    - `core_position`: 核心岗位名称
    - `backup_employee_ids`: 顶岗人员ID列表
    - `no_same_day_off`: 是否禁止同休

- **enable_backup_check** (boolean): 是否启用顶岗检查
  - true表示在排休时检查核心岗位与顶岗人员不可同休
  - 默认值为false

#### 1.2 迁移文件
- `supabase/migrations/37_merge_backup_into_rest_rules.sql`

### 2. TypeScript类型定义更新

#### 2.1 新增BackupRule接口
```typescript
export interface BackupRule {
  core_employee_id: string // 核心岗位员工ID
  core_position: string // 核心岗位名称
  backup_employee_ids: string[] // 顶岗人员ID列表
  no_same_day_off: boolean // 是否禁止同休
}
```

#### 2.2 更新RestDayRule接口
添加字段：
- `backup_rules: BackupRule[]`
- `enable_backup_check: boolean`

#### 2.3 更新CreateRestDayRuleParams接口
添加可选字段：
- `backup_rules?: BackupRule[]`
- `enable_backup_check?: boolean`

### 3. 页面功能更新

#### 3.1 排休规则配置页面 (src/pages/rest-day-rules/index.tsx)

**新增功能：**
1. **两步配置流程**
   - 基础规则配置（第一步）
   - 顶岗原则配置（第二步）

2. **顶岗原则配置**
   - 启用/禁用顶岗检查开关
   - 核心岗位列表展示
   - 为每个核心岗位配置顶岗人员
   - 设置是否禁止同休规则

3. **顶岗人员选择对话框**
   - 显示所有非核心岗位员工
   - 多选顶岗人员
   - 设置不可同休规则

4. **规则列表展示优化**
   - 显示顶岗规则配置状态
   - 展示核心岗位与顶岗人员的映射关系

**UI改进：**
- 使用步骤指示器区分基础规则和顶岗原则
- 顶岗规则使用独立的配置区域
- 核心岗位卡片式展示
- 顶岗人员选择使用对话框模式

### 4. 管理中心更新

#### 4.1 业务配置项增加
在管理中心的业务配置部分添加"排休规则"入口：
- 标题：排休规则
- 图标：i-mdi-calendar-clock
- 描述：配置排休规则和顶岗原则
- 路径：/pages/rest-day-rules/index

#### 4.2 配置完成度统计更新
- 业务配置项从5项增加到6项
- 总配置项从8项增加到9项
- 新增hasRestDayRules检查函数

### 5. API更新

#### 5.1 新增函数
```typescript
export async function hasRestDayRules(tenantId: string): Promise<boolean>
```
检查租户是否配置了排休规则。

#### 5.2 更新函数
```typescript
export async function getConfigCompletionStats(tenantId: string)
```
- 增加排休规则检查
- 更新业务配置总数为6
- 更新总配置数为9

### 6. 配置状态接口更新

#### 6.1 ConfigStatus接口
添加字段：
```typescript
hasRestRules: boolean
```

## 功能优势

### 1. 统一管理
- 排休规则和顶岗原则在同一页面配置
- 减少配置页面数量，简化操作流程
- 规则和原则关联更紧密

### 2. 灵活配置
- 可选择是否启用顶岗检查
- 支持为每个核心岗位配置多个顶岗人员
- 灵活设置是否禁止同休规则

### 3. 清晰展示
- 规则列表清晰展示顶岗配置状态
- 核心岗位与顶岗人员映射关系一目了然
- 配置完成度实时反馈

## 使用指南

### 配置排休规则（含顶岗原则）

1. **进入配置页面**
   - 管理中心 → 业务配置 → 排休规则

2. **配置基础规则**
   - 点击"新增"按钮
   - 在"基础规则"步骤中配置：
     - 规则名称
     - 月休天数
     - 最多指定日期次数
     - 存休设置
     - 连休设置

3. **配置顶岗原则**
   - 切换到"顶岗原则"步骤
   - 启用"顶岗检查"开关
   - 为每个核心岗位配置顶岗人员：
     - 点击核心岗位的"配置"按钮
     - 选择顶岗人员（可多选）
     - 设置是否禁止同休
     - 点击"确定"保存

4. **保存规则**
   - 点击"保存"按钮完成配置

### 编辑现有规则

1. 在规则列表中点击"编辑"按钮
2. 修改基础规则或顶岗原则
3. 点击"保存"更新规则

### 删除规则

1. 在规则列表中点击"删除"按钮
2. 确认删除操作

## 数据迁移说明

### 现有core_position_backups表
如果系统中存在旧的`core_position_backups`表，建议：
1. 手动将数据迁移到对应的排休规则中
2. 迁移完成后可以删除旧表

### 迁移步骤
1. 导出现有顶岗配置数据
2. 在排休规则中启用顶岗检查
3. 按照核心岗位配置顶岗人员
4. 验证配置正确性
5. 删除旧的顶岗配置数据

## 技术细节

### 数据存储格式

backup_rules字段存储示例：
```json
[
  {
    "core_employee_id": "uuid-1",
    "core_position": "主厨",
    "backup_employee_ids": ["uuid-2", "uuid-3"],
    "no_same_day_off": true
  },
  {
    "core_employee_id": "uuid-4",
    "core_position": "店长",
    "backup_employee_ids": ["uuid-5"],
    "no_same_day_off": true
  }
]
```

### 数据验证
- 核心岗位员工ID必须存在
- 顶岗人员ID必须存在且不能与核心岗位相同
- 顶岗人员列表不能为空（如果启用顶岗检查）

## 后续优化建议

1. **自动迁移工具**
   - 开发自动迁移工具，将旧的顶岗配置迁移到新结构

2. **批量配置**
   - 支持批量为多个核心岗位配置相同的顶岗人员

3. **智能推荐**
   - 根据岗位类型和员工技能，智能推荐顶岗人员

4. **冲突检测**
   - 在排班时实时检测核心岗位与顶岗人员的休息冲突
   - 提供冲突解决建议

5. **统计分析**
   - 统计顶岗规则的使用情况
   - 分析顶岗人员的工作负荷

## 相关文件

### 数据库迁移
- `supabase/migrations/37_merge_backup_into_rest_rules.sql`

### 类型定义
- `src/db/types-v2.ts`

### API函数
- `src/db/api.ts`
- `src/db/api-v2.ts`

### 页面组件
- `src/pages/rest-day-rules/index.tsx`
- `src/pages/rest-day-rules/index.config.ts`
- `src/pages/management/index.tsx`

## 测试建议

### 功能测试
1. 创建排休规则（不启用顶岗检查）
2. 创建排休规则（启用顶岗检查）
3. 为核心岗位配置顶岗人员
4. 编辑现有规则的顶岗配置
5. 删除顶岗配置
6. 删除整个规则

### 数据验证测试
1. 验证backup_rules字段格式正确
2. 验证enable_backup_check字段保存正确
3. 验证配置完成度统计准确

### UI测试
1. 步骤切换流畅
2. 顶岗人员选择对话框正常显示
3. 规则列表正确展示顶岗配置
4. 响应式布局适配

## 总结

本次优化将顶岗原则功能融合到排休规则配置中，实现了：
- ✅ 统一的配置入口
- ✅ 简化的操作流程
- ✅ 清晰的数据结构
- ✅ 完整的功能覆盖
- ✅ 良好的用户体验

通过这次优化，用户可以更方便地管理排休规则和顶岗原则，提高了系统的易用性和可维护性。
