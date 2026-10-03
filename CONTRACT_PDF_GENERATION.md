# 劳动合同PDF生成功能说明

## 功能概述

本功能实现了劳动合同的自动PDF生成和下载功能。当HR完成合同签署后，系统会自动生成包含完整合同内容和双方签名的PDF文档，并提供下载功能。

## 核心功能

### 1. 自动PDF生成
- **触发时机**：HR在合同管理页面完成公司签署后自动触发
- **生成内容**：
  - 合同标题和编号
  - 甲方（公司）和乙方（员工）信息
  - 合同基本信息（职位、部门、合同类型、起止日期、薪资等）
  - 工作地点
  - 其他约定事项
  - 双方电子签名图片
  - 签署时间和签署人信息
  - 法律声明

### 2. PDF存储
- **存储位置**：Supabase Storage的`app-7daop8q0sxdt_contract_signatures` bucket
- **文件命名**：`{tenant_id}/{contract_id}/contract_{timestamp}.pdf`
- **访问方式**：生成公开访问URL，保存到数据库的`contract_pdf_url`字段

### 3. PDF下载
- **下载入口**：合同预览页面的"下载PDF"按钮
- **显示条件**：合同已完成双方签署且PDF已生成
- **环境适配**：
  - H5环境：直接在新窗口打开PDF
  - 小程序环境：提示用户在H5端下载

## 技术实现

### 依赖库
- **jspdf**：PDF文档生成库
- **html2canvas**：HTML转图片（预留，用于未来可能的HTML内容转换）

### 核心文件

#### 1. PDF生成工具（src/utils/contract-pdf-generator.ts）
```typescript
// 主要函数
export async function generateContractPDF(
  contract: EmploymentContract,
  employeeName: string,
  companyName: string
): Promise<Blob>

export async function uploadContractPDF(
  pdfBlob: Blob,
  tenantId: string,
  contractId: string
): Promise<string>

export async function generateAndUploadContractPDF(
  contract: EmploymentContract,
  employeeName: string,
  companyName: string,
  tenantId: string
): Promise<string>
```

#### 2. 合同预览组件（src/components/signature/ContractPreview.tsx）
- 新增`showDownloadButton`属性
- 新增`handleDownloadPDF`函数
- 根据环境自动适配下载方式

#### 3. 合同管理页面（src/pages/onboarding/contract-management/index.tsx）
- 在`handleSaveSignature`函数中集成PDF生成
- 签署成功后自动生成并上传PDF
- 保存PDF URL到数据库

### PDF内容布局

```
┌─────────────────────────────────────┐
│     劳动合同 / Employment Contract    │
│                                     │
│  Contract No: XXX                   │
│                                     │
│  Party A (Employer): 公司名称        │
│  Party B (Employee): 员工姓名        │
│                                     │
│  Contract Information:              │
│  - Position: XXX                    │
│  - Department: XXX                  │
│  - Contract Type: XXX               │
│  - Start Date: YYYY-MM-DD           │
│  - End Date: YYYY-MM-DD             │
│  - Salary: XXX CNY/month            │
│                                     │
│  Work Location: XXX                 │
│                                     │
│  Other Terms: XXX                   │
│                                     │
│  Signatures:                        │
│  ┌─────────────┐  ┌─────────────┐  │
│  │ Employee    │  │ Company     │  │
│  │ Signature   │  │ Signature   │  │
│  │ [Image]     │  │ [Image]     │  │
│  │ Date: XXX   │  │ Date: XXX   │  │
│  └─────────────┘  └─────────────┘  │
│                                     │
│  Legal Notice: ...                  │
└─────────────────────────────────────┘
```

## 使用流程

### HR端操作流程
1. 进入"劳动合同管理"页面
2. 在"待签署"标签页查看待签署合同
3. 点击合同卡片，预览合同内容
4. 点击"公司签署"按钮
5. 填写签署人信息（姓名、职位）
6. 在签名画板上手写签名
7. 点击"保存签名"
8. 系统自动：
   - 上传签名图片
   - 更新合同状态
   - 生成PDF文档
   - 上传PDF到Storage
   - 保存PDF URL
9. 签署成功后，可在合同预览页面看到"下载PDF"按钮

### 员工端查看流程
1. 进入"我的合同签署"页面
2. 查看已签署的合同
3. 点击合同卡片，预览合同内容
4. 如果合同已完成双方签署，可看到"下载PDF"按钮
5. 点击下载按钮获取PDF文档

## 数据库字段

### employment_contracts表
```sql
contract_pdf_url text NULL  -- PDF文档的公开访问URL
```

## API函数

### saveContractPdfUrl
```typescript
/**
 * 保存合同PDF URL
 * @param contractId 合同ID
 * @param pdfUrl PDF的公开访问URL
 * @returns 是否保存成功
 */
export async function saveContractPdfUrl(
  contractId: string,
  pdfUrl: string
): Promise<boolean>
```

## 错误处理

### PDF生成失败
- 不影响签署流程的完成
- 错误信息记录到控制台
- 用户仍可正常完成签署

### PDF下载失败
- H5环境：浏览器会提示无法打开链接
- 小程序环境：显示提示信息，引导用户到H5端下载

## 安全性

### 访问控制
- PDF存储在公开bucket中，但URL包含随机时间戳
- 只有知道完整URL的用户才能访问
- 建议未来添加访问令牌验证

### 数据完整性
- PDF生成前验证合同已完成双方签署
- 签名图片必须存在才能生成PDF
- 生成失败不影响合同的法律效力

## 未来优化建议

### 功能增强
1. **PDF加密**：添加密码保护
2. **数字签名**：添加数字证书验证
3. **水印功能**：添加防伪水印
4. **批量下载**：支持批量导出多份合同
5. **邮件发送**：自动发送PDF到员工邮箱

### 性能优化
1. **异步生成**：使用后台任务生成PDF，避免阻塞用户操作
2. **缓存机制**：缓存已生成的PDF，避免重复生成
3. **压缩优化**：优化PDF文件大小

### 用户体验
1. **生成进度**：显示PDF生成进度条
2. **预览功能**：在下载前预览PDF内容
3. **分享功能**：支持分享PDF到微信、邮箱等

## 常见问题

### Q1: PDF生成失败怎么办？
A: PDF生成失败不影响合同签署的完成。可以在合同管理页面重新打开合同，系统会尝试重新生成PDF。

### Q2: 小程序中能下载PDF吗？
A: 小程序环境暂不支持直接下载PDF，需要在H5端打开应用后下载。

### Q3: PDF内容可以自定义吗？
A: 可以。修改`src/utils/contract-pdf-generator.ts`中的`generateContractPDF`函数即可自定义PDF内容和样式。

### Q4: 如何修改PDF样式？
A: 在`contract-pdf-generator.ts`中修改jsPDF的配置参数，如字体、颜色、布局等。

## 相关文档

- [劳动合同电子签名功能指南](./CONTRACT_ESIGNATURE_GUIDE.md)
- [入职离职管理指南](./ONBOARDING_OFFBOARDING_GUIDE.md)
- [TODO任务清单](./TODO.md)

## 更新日志

### 2025-11-07
- ✅ 初始版本发布
- ✅ 实现自动PDF生成功能
- ✅ 实现PDF上传和存储
- ✅ 实现PDF下载功能
- ✅ 添加环境适配（H5/小程序）
