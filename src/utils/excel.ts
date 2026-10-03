// Excel 工具函数
// 注意：此功能仅在电脑端浏览器中可用，小程序环境不支持

// Excel员工数据接口
export interface ExcelEmployeeRow {
  姓名: string
  手机号: string
  店铺名称: string
  员工类型: string
  备注?: string
}

// 导入结果接口
export interface ImportResult {
  success: number
  failed: number
  errors: string[]
  data: ExcelEmployeeRow[]
}

// 生成Excel模板
// 此功能仅在电脑端浏览器中可用
export function generateEmployeeTemplate(): Uint8Array {
  throw new Error('此功能仅在电脑端浏览器中可用，请在电脑上访问系统网页版使用')
}

// 验证手机号格式
function _validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

// 验证员工类型
function _validateEmployeeType(type: string): boolean {
  return type === '正式' || type === '兼职'
}

// 解析Excel文件
// 此功能仅在电脑端浏览器中可用
export async function parseExcelFile(_fileBuffer: ArrayBuffer): Promise<ImportResult> {
  throw new Error('此功能仅在电脑端浏览器中可用，请在电脑上访问系统网页版使用')
}
