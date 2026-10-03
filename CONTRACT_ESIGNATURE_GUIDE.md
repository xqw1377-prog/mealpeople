# 劳动合同电子签名功能指南

> 📝 **完整的电子签名解决方案** | 支持员工和HR双方电子签署劳动合同

---

## 📋 功能概述

劳动合同电子签名功能为餐时间工作旅程系统提供了完整的电子合同签署流程，支持员工和HR双方通过手写签名的方式完成合同签署，确保合同的法律效力。

### ✨ 核心特性

- ✅ **手写签名**：支持触摸屏手写签名，真实还原纸质签名体验
- ✅ **双方签署**：员工签署 → HR签署 → 合同生效
- ✅ **签名存储**：签名图片安全存储在Supabase Storage
- ✅ **法律效力**：记录签名时间戳、IP地址等关键信息
- ✅ **跨平台支持**：H5和微信小程序双平台兼容
- ✅ **合同预览**：签署前可预览完整合同内容
- ✅ **状态管理**：实时跟踪合同签署状态

---

## 🏗️ 系统架构

### 1. 核心组件

#### SignaturePad（签名画板组件）
- **位置**：`src/components/signature/SignaturePad.tsx`
- **功能**：
  - 提供手写签名画板
  - 支持触摸和鼠标输入
  - 签名清除和重写
  - 签名数据导出（Base64格式）

#### ContractPreview（合同预览组件）
- **位置**：`src/components/contract/ContractPreview.tsx`
- **功能**：
  - 显示完整合同内容
  - 展示双方签名信息
  - 提供签署按钮
  - 显示合同状态

#### signature-upload（签名上传工具）
- **位置**：`src/utils/signature-upload.ts`
- **功能**：
  - 将Base64签名数据转换为Blob
  - 上传签名到Supabase Storage
  - 生成签名公开URL
  - 获取用户IP地址

### 2. 数据库设计

#### employment_contracts 表扩展字段

```sql
-- 员工签名信息
employee_signature_url TEXT,           -- 员工签名图片URL
employee_signed_at TIMESTAMPTZ,        -- 员工签署时间
employee_signature_ip TEXT,            -- 员工签署IP地址

-- 公司签名信息
company_signature_url TEXT,            -- 公司签名图片URL
company_signed_at TIMESTAMPTZ,         -- 公司签署时间
company_signature_ip TEXT,             -- 公司签署IP地址
company_signer_name TEXT,              -- 公司签署人姓名
company_signer_position TEXT,          -- 公司签署人职位

-- 电子合同PDF
contract_pdf_url TEXT                  -- 合同PDF文件URL
```

#### contract_signatures Storage Bucket

- **Bucket名称**：`app-7daop8q0sxdt_contract_signatures`
- **用途**：存储员工和HR的签名图片
- **文件命名规则**：`{tenant_id}/{contract_id}/{type}_{timestamp}.png`

### 3. API函数

#### 员工端API
- `signContractByEmployee`：员工签署合同
- `getPendingContractsForEmployee`：获取待签署合同列表

#### HR端API
- `signContractByCompanyWithSignature`：公司签署合同
- `getPendingContractsForCompany`：获取待签署合同列表

#### 通用API
- `getContractWithSignatures`：获取合同详情（含签名）

---

## 🔄 签署流程

### 员工端签署流程

1. **查看待签署合同** → 进入"我的合同签署"页面
2. **预览合同内容** → 点击"预览合同"按钮
3. **手写签名** → 点击"立即签署"，在签名画板上手写签名
4. **提交签署** → 点击"保存签名"，完成签署

### HR端签署流程

1. **查看待签署合同** → 进入"劳动合同管理"，切换到"待签署"标签页
2. **预览合同内容** → 点击"预览并签署"按钮
3. **手写签名** → 点击"公司签署"，在签名画板上手写签名
4. **提交签署** → 点击"保存签名"，完成签署

### 合同状态流转

```
草稿 (draft)
  ↓ 员工签署
待公司签署 (draft + signed_by_employee)
  ↓ 公司签署
生效中 (active)
  ↓ 到期
已到期 (expired)
```

---

## 📱 页面说明

### 员工端页面

#### 我的合同签署（my-contract-sign）
- **路由**：`/pages/my-contract-sign/index`
- **功能**：查看待签署合同、预览合同、手写签名、查看已签署合同
- **访问权限**：需要登录

### HR端页面

#### 劳动合同管理（contract-management）
- **路由**：`/pages/onboarding/contract-management/index`
- **功能**：查看所有合同、查看待签署合同、预览合同、手写签名、管理合同状态
- **访问权限**：需要登录

---

## 🔒 安全性保障

### 1. 签名存储安全
- 签名图片存储在Supabase Storage，具有访问控制
- 签名文件命名包含随机时间戳，防止猜测

### 2. 签署信息记录
- 记录签署时间戳（精确到毫秒）
- 记录签署IP地址
- 记录签署人信息（公司签署时）
- 所有信息不可篡改

### 3. 合同状态控制
- 只有草稿状态的合同才能签署
- 员工签署后，才能进行公司签署
- 双方签署完成后，合同自动生效
- 生效后的合同不可修改

### 4. 权限控制
- 员工只能签署自己的合同
- HR只能签署本租户的合同
- 签署操作需要登录认证

---

## 🎯 未来规划

### 短期计划
- [ ] 添加合同PDF生成功能
- [ ] 添加签名通知提醒
- [ ] 优化签名画板体验
- [ ] 添加签名验证机制

### 长期计划
- [ ] 支持多种签名方式（手写、印章、数字证书）
- [ ] 集成第三方电子签名服务
- [ ] 支持合同模板管理
- [ ] 支持合同批量签署

---

**最后更新时间**：2025-11-07 05:30
