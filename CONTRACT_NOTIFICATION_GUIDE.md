# 劳动合同签名通知功能指南

## 功能概述

本功能实现了劳动合同签署流程中的自动通知提醒系统。当合同创建、签署或即将到期时，系统会自动向相关人员发送通知，确保合同签署流程的及时性和完整性。

## 核心功能

### 1. 通知类型

#### 1.1 新合同待签署通知（contract_created）
- **触发时机**：HR创建新劳动合同后
- **接收人**：员工
- **通知标题**：新合同待签署
- **通知内容**：您有一份新的劳动合同待签署，合同编号：XXX，请及时查看并签署
- **操作建议**：点击通知跳转到合同签署页面

#### 1.2 员工已签署通知（employee_signed）
- **触发时机**：员工完成合同签署后
- **接收人**：HR管理员（预留功能）
- **通知标题**：合同待签署提醒
- **通知内容**：员工已完成合同签署，合同编号：XXX，请尽快完成公司签署
- **操作建议**：点击通知跳转到合同管理页面
- **注意**：此功能需要实现获取租户HR用户列表的功能

#### 1.3 合同签署完成通知（company_signed）
- **触发时机**：HR完成公司签署后
- **接收人**：员工
- **通知标题**：合同签署完成
- **通知内容**：您的劳动合同已完成签署，合同编号：XXX，合同已生效
- **操作建议**：点击通知查看合同详情和下载PDF

#### 1.4 合同即将到期提醒（contract_expiring）
- **触发时机**：定时任务检测到合同即将到期（默认提前30天）
- **接收人**：员工和HR
- **通知标题**：合同即将到期提醒
- **通知内容**：您的劳动合同即将到期，合同编号：XXX，到期日期：YYYY-MM-DD，请及时处理续签事宜
- **操作建议**：联系HR处理合同续签

### 2. 通知展示

#### 2.1 通知中心
- **位置**：应用底部导航栏"通知"标签页
- **功能**：
  - 查看所有通知
  - 筛选未读通知
  - 标记已读/全部已读
  - 删除通知
  - 清空已读通知

#### 2.2 通知样式
- **图标**：文档编辑图标（i-mdi-file-document-edit）
- **颜色**：主题色（蓝色）
- **背景**：主题色半透明背景
- **未读标识**：左侧蓝色边框 + 右上角蓝点

#### 2.3 通知交互
- **点击通知**：自动跳转到相关页面并标记为已读
- **标记已读**：点击"标记已读"按钮
- **删除通知**：点击"删除"按钮

## 技术实现

### 1. 数据库设计

#### 1.1 通知表（notifications）
```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL,  -- 'contract' 为合同通知
  title text NOT NULL,
  content text NOT NULL,
  related_id uuid,  -- 关联的合同ID
  related_type text,  -- 'employment_contract'
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### 2. API函数

#### 2.1 发送合同通知
```typescript
/**
 * 发送合同签署通知
 * @param contract 合同信息
 * @param recipientUserId 接收通知的用户ID
 * @param notificationType 通知类型
 */
export async function sendContractNotification(
  contract: EmploymentContract,
  recipientUserId: string,
  notificationType: 'employee_signed' | 'company_signed' | 'contract_created' | 'contract_expiring'
): Promise<boolean>
```

#### 2.2 批量发送到期提醒
```typescript
/**
 * 批量发送合同到期提醒
 * @param tenantId 租户ID
 * @param daysBeforeExpiry 提前多少天提醒（默认30天）
 */
export async function sendExpiringContractNotifications(
  tenantId: string,
  daysBeforeExpiry = 30
): Promise<number>
```

### 3. 集成点

#### 3.1 创建合同时
```typescript
// src/db/api-employment.ts - createEmploymentContract
const contract = await createEmploymentContract(input)
if (contract) {
  await sendContractNotification(contract, contract.employee_id, 'contract_created')
}
```

#### 3.2 员工签署时
```typescript
// src/db/api-employment.ts - signContractByEmployee
const success = await signContractByEmployee(contractId, signatureUrl, signatureIp)
if (success) {
  // 预留：通知HR
  // await sendContractNotification(contract, hrUserId, 'employee_signed')
}
```

#### 3.3 公司签署时
```typescript
// src/db/api-employment.ts - signContractByCompanyWithSignature
const success = await signContractByCompanyWithSignature(...)
if (success) {
  await sendContractNotification(contract, contract.employee_id, 'company_signed')
}
```

### 4. 通知中心页面

#### 4.1 通知类型样式
```typescript
function getNotificationStyle(type: string) {
  switch (type) {
    case 'contract':
      return {
        icon: 'i-mdi-file-document-edit',
        color: 'text-primary',
        bgColor: 'bg-primary/10'
      }
    // ... 其他类型
  }
}
```

#### 4.2 通知点击处理
```typescript
const handleNotificationClick = async (notification: Notification) => {
  // 标记为已读
  if (!notification.is_read) {
    await markNotificationAsRead(notification.id)
  }

  // 跳转到相关页面
  if (notification.related_type === 'employment_contract') {
    Taro.navigateTo({
      url: '/packageH/pages/my-contract-sign/index'
    })
  }
}
```

## 使用流程

### 员工端流程

1. **接收新合同通知**
   - HR创建合同后，员工收到"新合同待签署"通知
   - 点击通知跳转到"我的合同签署"页面
   - 查看合同详情并完成签署

2. **接收签署完成通知**
   - HR完成公司签署后，员工收到"合同签署完成"通知
   - 点击通知查看合同详情
   - 可以下载合同PDF

3. **接收到期提醒**
   - 合同即将到期时，员工收到"合同即将到期提醒"
   - 联系HR处理续签事宜

### HR端流程

1. **创建合同**
   - 在"劳动合同管理"页面创建新合同
   - 系统自动发送通知给员工

2. **接收员工签署通知（预留）**
   - 员工完成签署后，HR收到"合同待签署提醒"
   - 点击通知跳转到合同管理页面
   - 完成公司签署

3. **接收到期提醒**
   - 合同即将到期时，HR收到"合同即将到期提醒"
   - 及时处理合同续签

## 配置说明

### 1. 到期提醒配置

#### 1.1 提醒时间
- **默认值**：提前30天
- **可配置**：通过`daysBeforeExpiry`参数调整
- **建议值**：
  - 正式合同：30天
  - 试用期合同：7天
  - 临时合同：3天

#### 1.2 定时任务
- **执行频率**：建议每天执行一次
- **执行时间**：建议在每天早上8点执行
- **实现方式**：
  - 使用Supabase Edge Functions + Cron Jobs
  - 或使用第三方定时任务服务

### 2. 通知权限配置

#### 2.1 员工权限
- 可以查看自己的通知
- 可以标记已读和删除自己的通知
- 不能查看其他员工的通知

#### 2.2 HR权限
- 可以查看自己的通知
- 可以查看租户内所有合同相关通知（可选）
- 可以管理通知设置

## 扩展功能建议

### 1. 短期优化

#### 1.1 实现HR用户列表功能
```typescript
/**
 * 获取租户的HR用户列表
 */
export async function getTenantHRUsers(tenantId: string): Promise<User[]> {
  // 查询profiles表，筛选role为'admin'或'hr'的用户
  // 返回用户列表
}
```

#### 1.2 添加通知偏好设置
- 允许用户选择接收哪些类型的通知
- 允许用户设置通知方式（站内通知、邮件、短信）
- 允许用户设置免打扰时间

#### 1.3 添加通知统计
- 显示各类型通知的数量
- 显示未读通知的数量
- 在首页显示通知红点提示

### 2. 长期优化

#### 2.1 多渠道通知
- **站内通知**：当前已实现
- **邮件通知**：发送邮件到员工邮箱
- **短信通知**：发送短信到员工手机
- **微信通知**：通过微信服务号发送模板消息

#### 2.2 智能提醒
- 根据用户行为调整提醒频率
- 对重要通知进行多次提醒
- 对已处理的通知自动归档

#### 2.3 通知分组
- 按时间分组（今天、昨天、更早）
- 按类型分组（合同、任务、培训、系统）
- 按重要性分组（重要、普通）

#### 2.4 通知搜索
- 支持按标题搜索
- 支持按内容搜索
- 支持按时间范围筛选

## 常见问题

### Q1: 为什么员工签署后HR没有收到通知？
A: 这是预留功能，需要先实现`getTenantHRUsers`函数来获取租户的HR用户列表。目前代码中已经预留了相关逻辑，只需要实现该函数即可。

### Q2: 如何设置合同到期提醒的时间？
A: 调用`sendExpiringContractNotifications`函数时，传入`daysBeforeExpiry`参数即可。例如：
```typescript
// 提前7天提醒
await sendExpiringContractNotifications(tenantId, 7)
```

### Q3: 如何实现定时发送到期提醒？
A: 建议使用Supabase Edge Functions + Cron Jobs实现定时任务。创建一个Edge Function，在其中调用`sendExpiringContractNotifications`函数，然后配置Cron表达式定时执行。

### Q4: 通知会保存多久？
A: 通知会永久保存，除非用户手动删除。建议添加定时清理功能，自动删除超过一定时间（如90天）的已读通知。

### Q5: 如何自定义通知内容？
A: 修改`sendContractNotification`函数中的`title`和`content`变量即可。可以根据业务需求添加更多信息，如员工姓名、部门、职位等。

## 相关文档

- [劳动合同电子签名功能指南](./CONTRACT_ESIGNATURE_GUIDE.md)
- [劳动合同PDF生成功能说明](./CONTRACT_PDF_GENERATION.md)
- [入职离职管理指南](./ONBOARDING_OFFBOARDING_GUIDE.md)
- [TODO任务清单](./TODO.md)

## 更新日志

### 2025-11-07
- ✅ 初始版本发布
- ✅ 实现合同创建通知
- ✅ 实现合同签署完成通知
- ✅ 实现合同到期提醒（批量）
- ✅ 更新通知中心页面
- ✅ 添加通知点击跳转功能
- ✅ 预留员工签署后通知HR的功能
