import * as XLSX from 'xlsx'
import type {Employee} from '@/db/types-employee-hub'

/**
 * 员工数据导出工具
 * 支持导出为Excel格式
 */

/**
 * 将员工数据导出为Excel文件
 * @param employees 员工数据数组
 * @param filename 文件名（不含扩展名）
 */
export function exportEmployeesToExcel(employees: Employee[], filename = '员工数据') {
  // 准备导出数据
  const exportData = employees.map((emp) => ({
    姓名: emp.name,
    手机号: emp.phone || '',
    部门: emp.department || '',
    岗位: emp.position || '',
    员工类型: emp.employee_type === 'full_time' ? '全职' : emp.employee_type === 'part_time' ? '兼职' : '未知',
    状态: getStatusText(emp.status),
    月薪: emp.monthly_salary || 0,
    每日工时: emp.daily_work_hours || 0,
    核心岗位: emp.is_core_position ? '是' : '否',
    创建时间: new Date(emp.created_at).toLocaleString('zh-CN')
  }))

  // 创建工作簿
  const wb = XLSX.utils.book_new()

  // 创建工作表
  const ws = XLSX.utils.json_to_sheet(exportData)

  // 设置列宽
  const colWidths = [
    {wch: 10}, // 姓名
    {wch: 15}, // 手机号
    {wch: 12}, // 部门
    {wch: 12}, // 岗位
    {wch: 10}, // 员工类型
    {wch: 10}, // 状态
    {wch: 12}, // 月薪
    {wch: 10}, // 每日工时
    {wch: 10}, // 核心岗位
    {wch: 20} // 创建时间
  ]
  ws['!cols'] = colWidths

  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(wb, ws, '员工数据')

  // 生成Excel文件
  const wbout = XLSX.write(wb, {bookType: 'xlsx', type: 'array'})

  // 创建Blob对象
  const blob = new Blob([wbout], {type: 'application/octet-stream'})

  // 创建下载链接
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`

  // 触发下载
  document.body.appendChild(link)
  link.click()

  // 清理
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 获取状态文本
 */
function getStatusText(status?: string): string {
  switch (status) {
    case 'active':
      return '在职'
    case 'on_leave':
      return '请假中'
    case 'resigned':
      return '已离职'
    case 'terminated':
      return '已解雇'
    default:
      return '未知'
  }
}

/**
 * 导出筛选后的员工数据
 * @param employees 员工数据数组
 * @param filterType 筛选类型
 */
export function exportFilteredEmployees(employees: Employee[], filterType: string) {
  let filename = '员工数据'

  switch (filterType) {
    case 'full_time':
      filename = '全职员工数据'
      break
    case 'part_time':
      filename = '兼职员工数据'
      break
    case 'active':
      filename = '在职员工数据'
      break
    case 'on_leave':
      filename = '请假员工数据'
      break
    case 'resigned':
      filename = '离职员工数据'
      break
    default:
      filename = '全部员工数据'
  }

  exportEmployeesToExcel(employees, filename)
}
