# Excel导入功能现状说明

更新时间：2025-11-06

## 一、功能现状

### 1.1 已实现的功能

#### ✅ UI界面完整
- 员工管理页面有"模板"和"导入"按钮
- 员工导入页面UI完整
- 使用说明清晰
- 操作步骤明确

#### ✅ 基础交互
- 模板按钮点击显示模板说明
- 导入按钮跳转到导入页面
- 文件选择功能（小程序环境）
- 文件大小验证（限制5MB）

### 1.2 未实现的功能

#### ❌ 模板下载功能
**当前状态：** 只显示模板说明，没有实际下载文件

**代码位置：**
- `src/pages/employees/index.tsx` 第128-139行
- `src/pages/employee-import/index.tsx` 第19-30行

**TODO注释：**
```typescript
// TODO: 实际下载模板文件
// 这里可以生成一个示例Excel文件供用户下载
```

**需要实现：**
1. 生成Excel模板文件
2. 提供下载功能
3. 模板包含正确的字段和格式

#### ❌ Excel文件解析
**当前状态：** 只是模拟导入，没有真正解析Excel文件

**代码位置：**
- `src/pages/employee-import/index.tsx` 第69-85行

**TODO注释：**
```typescript
// TODO: 上传文件到服务器并解析
// 这里需要实现文件上传和解析逻辑
// 1. 上传文件到服务器
// 2. 服务器解析Excel文件
// 3. 验证数据格式
// 4. 批量插入数据库
// 5. 返回导入结果
```

**当前实现：**
```typescript
// 模拟导入过程
await new Promise((resolve) => setTimeout(resolve, 2000))

// 模拟导入结果
setImportResult({
  success: 15,
  failed: 2,
  errors: ['第3行：手机号格式错误', '第8行：员工类型必须为"全职"或"兼职"']
})
```

#### ❌ 数据验证和导入
**当前状态：** 没有实际的数据验证和数据库插入

**需要实现：**
1. Excel数据解析
2. 数据格式验证
3. 必填字段检查
4. 批量插入数据库
5. 错误处理和反馈

## 二、模板字段定义

### 2.1 必填字段
| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| 姓名 | 文本 | 员工姓名 | 张三 |
| 员工类型 | 文本 | 全职/兼职 | 全职 |
| 部门 | 文本 | 前厅/后厨 | 前厅 |
| 手机号 | 文本 | 11位手机号 | 13800138000 |

### 2.2 可选字段
| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| 职位 | 文本 | 员工职位 | 服务员 |
| 入职日期 | 日期 | YYYY-MM-DD | 2025-01-01 |
| 基础工资 | 数字 | 月薪（元） | 5000 |
| 备注 | 文本 | 其他说明 | 优秀员工 |

### 2.3 数据验证规则
1. **姓名**：不能为空，长度2-20个字符
2. **员工类型**：必须是"全职"或"兼职"
3. **部门**：必须是"前厅"或"后厨"
4. **手机号**：必须是11位数字
5. **入职日期**：格式必须是YYYY-MM-DD
6. **基础工资**：必须是正数

## 三、技术实现方案

### 3.1 方案一：前端解析（推荐）

#### 优点
- 无需后端支持
- 响应速度快
- 实现简单

#### 缺点
- 文件大小受限
- 浏览器兼容性问题

#### 实现步骤

1. **安装依赖**
```bash
pnpm add xlsx
```

2. **读取Excel文件**
```typescript
import * as XLSX from 'xlsx'

const readExcelFile = async (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, {type: 'binary'})
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        resolve(jsonData)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = reject
    reader.readAsBinaryString(file)
  })
}
```

3. **数据验证**
```typescript
interface EmployeeRow {
  姓名: string
  员工类型: string
  部门: string
  手机号: string
  职位?: string
  入职日期?: string
  基础工资?: number
  备注?: string
}

const validateRow = (row: EmployeeRow, index: number): string[] => {
  const errors: string[] = []
  
  // 验证姓名
  if (!row.姓名 || row.姓名.trim().length === 0) {
    errors.push(`第${index + 2}行：姓名不能为空`)
  }
  
  // 验证员工类型
  if (!['全职', '兼职'].includes(row.员工类型)) {
    errors.push(`第${index + 2}行：员工类型必须为"全职"或"兼职"`)
  }
  
  // 验证部门
  if (!['前厅', '后厨'].includes(row.部门)) {
    errors.push(`第${index + 2}行：部门必须为"前厅"或"后厨"`)
  }
  
  // 验证手机号
  if (!/^1[3-9]\d{9}$/.test(row.手机号)) {
    errors.push(`第${index + 2}行：手机号格式错误`)
  }
  
  return errors
}
```

4. **批量导入**
```typescript
const importEmployees = async (rows: EmployeeRow[]) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  }
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const errors = validateRow(row, i)
    
    if (errors.length > 0) {
      results.failed++
      results.errors.push(...errors)
      continue
    }
    
    try {
      await createEmployee({
        tenant_id: currentTenant.id,
        store_id: currentStore.id,
        name: row.姓名,
        phone: row.手机号,
        employee_type: row.员工类型 === '全职' ? 'full_time' : 'part_time',
        department: row.部门 === '前厅' ? 'front_hall' : 'kitchen',
        position: row.职位 || '',
        monthly_salary: row.基础工资 || 0,
        // ... 其他字段
      })
      results.success++
    } catch (error) {
      results.failed++
      results.errors.push(`第${i + 2}行：导入失败 - ${error}`)
    }
  }
  
  return results
}
```

5. **生成模板文件**
```typescript
const generateTemplate = () => {
  const template = [
    {
      姓名: '张三',
      员工类型: '全职',
      部门: '前厅',
      手机号: '13800138000',
      职位: '服务员',
      入职日期: '2025-01-01',
      基础工资: 5000,
      备注: '示例数据'
    }
  ]
  
  const worksheet = XLSX.utils.json_to_sheet(template)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '员工信息')
  
  // 下载文件
  XLSX.writeFile(workbook, '员工导入模板.xlsx')
}
```

### 3.2 方案二：后端解析

#### 优点
- 支持大文件
- 更安全
- 可以做更复杂的验证

#### 缺点
- 需要后端支持
- 实现复杂
- 响应较慢

#### 实现步骤

1. **创建Edge Function**
```typescript
// supabase/functions/import-employees/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

serve(async (req) => {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    
    // 读取Excel文件
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet)
    
    // 验证和导入数据
    // ...
    
    return new Response(JSON.stringify({
      success: true,
      data: results
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

2. **前端调用**
```typescript
const uploadAndImport = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch(
    `${process.env.TARO_APP_SUPABASE_URL}/functions/v1/import-employees`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TARO_APP_SUPABASE_ANON_KEY}`
      },
      body: formData
    }
  )
  
  return await response.json()
}
```

## 四、跨平台兼容性

### 4.1 小程序环境
- 使用 `Taro.chooseMessageFile` 选择文件
- 文件大小限制：5MB
- 支持格式：.xlsx, .xls

### 4.2 H5环境
- 使用 `<input type="file">` 选择文件
- 文件大小限制：10MB
- 支持格式：.xlsx, .xls

### 4.3 兼容性处理
```typescript
const chooseFile = async () => {
  if (Taro.getEnv() === 'WEAPP') {
    // 小程序环境
    const res = await Taro.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls']
    })
    return res.tempFiles[0]
  } else {
    // H5环境
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.xlsx,.xls'
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        resolve(file)
      }
      input.click()
    })
  }
}
```

## 五、实现优先级

### 高优先级（必须实现）
1. ✅ **员工表单默认门店** - 已修复
2. ⏳ **Excel模板下载** - 待实现
3. ⏳ **Excel文件解析** - 待实现
4. ⏳ **数据验证** - 待实现
5. ⏳ **批量导入** - 待实现

### 中优先级（建议实现）
1. ⏳ 导入进度显示
2. ⏳ 错误详情导出
3. ⏳ 导入历史记录

### 低优先级（可选实现）
1. ⏳ 模板自定义
2. ⏳ 批量编辑
3. ⏳ 数据预览

## 六、用户使用指南

### 6.1 当前可用功能
1. ✅ 查看模板说明
2. ✅ 了解导入流程
3. ✅ 查看字段要求

### 6.2 暂不可用功能
1. ❌ 下载Excel模板
2. ❌ 导入Excel文件
3. ❌ 批量添加员工

### 6.3 临时解决方案
在Excel导入功能完全实现之前，用户可以：
1. 手动逐个添加员工
2. 使用"添加员工"表单
3. 参考模板说明准备数据

## 七、开发计划

### 第一阶段：基础功能（1-2天）
- [ ] 安装xlsx依赖
- [ ] 实现模板生成和下载
- [ ] 实现Excel文件读取
- [ ] 实现基础数据验证

### 第二阶段：完整功能（2-3天）
- [ ] 实现批量导入
- [ ] 实现错误处理
- [ ] 实现进度显示
- [ ] 跨平台兼容性测试

### 第三阶段：优化功能（1-2天）
- [ ] 性能优化
- [ ] 用户体验优化
- [ ] 错误提示优化
- [ ] 文档完善

## 八、总结

### 8.1 当前状态
- ✅ UI界面完整
- ✅ 基础交互正常
- ❌ 核心功能未实现
- ❌ 无法实际使用

### 8.2 主要问题
1. 模板下载功能缺失
2. Excel解析功能缺失
3. 数据导入功能缺失

### 8.3 解决方案
- 推荐使用方案一（前端解析）
- 使用xlsx库实现
- 预计开发时间：3-5天

---

**文档作者：** AI助手  
**更新时间：** 2025-11-06  
**文档状态：** 完整  
**实现状态：** 待开发
