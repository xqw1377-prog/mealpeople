import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {navigateBack, showModal, showToast} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import * as XLSX from 'xlsx'
import {batchImportEmployees} from '@/db/modules/user'
import type {Employee, EmploymentType} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const EmployeeImport: React.FC = () => {
  const {user} = useAuth({guard: true})
  // 使用 selector 方式获取 store 状态
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)

  // 下载模板
  const handleDownloadTemplate = useCallback(() => {
    showModal({
      title: 'Excel模板说明',
      content:
        '模板包含以下字段：\n\n必填字段：\n• 姓名\n• 手机号\n• 店铺名称\n• 员工类型（正式/兼职）\n\n可选字段：\n• 备注\n\n示例数据：\n姓名,手机号,店铺名称,员工类型,备注\n张三,13800138000,总店,正式,优秀员工\n李四,13900139000,总店,兼职,周末兼职',
      confirmText: '我知道了',
      showCancel: false
    })
  }, [])

  // 选择文件并导入
  const handleImport = useCallback(async () => {
    if (!currentTenant || !currentStore || !user) {
      showToast({
        title: '请先选择店铺',
        icon: 'none'
      })
      return
    }

    try {
      // 选择文件
      const res = await Taro.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['xlsx', 'xls']
      })

      if (!res.tempFiles || res.tempFiles.length === 0) {
        return
      }

      const file = res.tempFiles[0]
      console.log('选择的文件:', file)

      // 检查文件大小（限制5MB）
      if (file.size > 5 * 1024 * 1024) {
        showToast({
          title: '文件大小不能超过5MB',
          icon: 'none'
        })
        return
      }

      setImporting(true)
      setImportResult(null)
      setImportProgress(0)

      // 读取文件内容
      const fileSystemManager = Taro.getFileSystemManager()
      const fileContent = fileSystemManager.readFileSync(file.path, 'base64')

      // 更新进度：文件读取完成 10%
      setImportProgress(10)

      // 解析Excel文件
      const workbook = XLSX.read(fileContent, {type: 'base64'})
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      // 转换为JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1}) as any[][]

      // 更新进度：数据解析完成 30%
      setImportProgress(30)

      console.log('解析的数据:', jsonData)

      // 验证数据格式
      if (jsonData.length < 2) {
        showToast({
          title: '文件中没有数据',
          icon: 'none'
        })
        setImporting(false)
        return
      }

      // 解析数据行
      const employees: Partial<Employee>[] = []
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (!row || row.length === 0) continue

        const name = row[0]?.toString().trim()
        const phone = row[1]?.toString().trim()
        const storeName = row[2]?.toString().trim()
        const employeeType = row[3]?.toString().trim()
        const _notes = row[4]?.toString().trim() || ''

        // 跳过空行
        if (!name && !phone) continue

        // 验证必填字段
        if (!name || !phone || !storeName || !employeeType) {
          showToast({
            title: `第${i + 1}行数据不完整`,
            icon: 'none',
            duration: 3000
          })
          setImporting(false)
          return
        }

        // 验证员工类型
        if (employeeType !== '正式' && employeeType !== '兼职') {
          showToast({
            title: `第${i + 1}行员工类型必须是"正式"或"兼职"`,
            icon: 'none',
            duration: 3000
          })
          setImporting(false)
          return
        }

        employees.push({
          name,
          phone,
          employee_type: (employeeType === '正式' ? 'full_time' : 'part_time') as EmploymentType
        })
      }

      if (employees.length === 0) {
        showToast({
          title: '没有有效的数据行',
          icon: 'none'
        })
        setImporting(false)
        return
      }

      // 更新进度：数据验证完成 50%
      setImportProgress(50)

      console.log('准备导入的员工数据:', employees)

      // 批量导入 - 分批处理以提升性能
      const batchSize = 50 // 每批导入50条
      let successCount = 0
      let failCount = 0
      const errors: string[] = []

      for (let i = 0; i < employees.length; i += batchSize) {
        const batch = employees.slice(i, i + batchSize)
        const result = await batchImportEmployees(batch, currentTenant.id, user?.id || '')

        successCount += result.successCount
        failCount += result.failCount
        errors.push(...result.errors)

        // 更新进度：50% + (当前批次/总批次 * 50%)
        const progress = 50 + Math.round(((i + batch.length) / employees.length) * 50)
        setImportProgress(progress)
      }

      console.log('导入结果:', {successCount, failCount, errors})

      setImportResult({
        success: successCount,
        failed: failCount,
        errors: errors
      })

      if (successCount > 0) {
        showToast({
          title: `成功导入${successCount}人`,
          icon: 'success'
        })
      } else {
        showToast({
          title: '导入失败',
          icon: 'error'
        })
      }
    } catch (error) {
      console.error('导入失败:', error)
      showToast({
        title: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`,
        icon: 'none',
        duration: 3000
      })
    } finally {
      setImporting(false)
    }
  }, [currentTenant, currentStore, user])

  // 返回
  const _handleBack = useCallback(() => {
    navigateBack()
  }, [])

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-4">
            <Text className="text-xl font-bold text-gray-900 block mb-1">员工批量导入</Text>
            <Text className="text-sm text-gray-700 block">批量导入员工信息，支持Excel格式</Text>
          </View>

          {/* 使用说明 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-base font-bold text-gray-900 mb-3 block">使用说明</Text>

            <View className="mb-3">
              <Text className="text-sm font-bold text-gray-800 mb-2 block">1. 下载模板</Text>
              <Text className="text-sm text-gray-700 mb-2 block">
                点击下方"下载模板"按钮，查看标准的Excel导入模板说明
              </Text>
            </View>

            <View className="mb-3">
              <Text className="text-sm font-bold text-gray-800 mb-2 block">2. 填写数据</Text>
              <Text className="text-sm text-gray-700 mb-1 block">按照模板格式填写以下字段：</Text>
              <View className="ml-4">
                <Text className="text-sm text-gray-700 block">• 姓名：员工姓名（必填）</Text>
                <Text className="text-sm text-gray-700 block">• 手机号：11位手机号码（必填）</Text>
                <Text className="text-sm text-gray-700 block">• 店铺名称：员工所属店铺（必填）</Text>
                <Text className="text-sm text-gray-700 block">• 员工类型：正式/兼职（必填）</Text>
                <Text className="text-sm text-gray-700 block">• 备注：其他说明（可选）</Text>
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-sm font-bold text-gray-800 mb-2 block">3. 导入数据</Text>
              <Text className="text-sm text-gray-700 mb-2 block">
                点击"选择文件并导入"按钮，选择填写好的Excel文件进行导入
              </Text>
            </View>

            <View className="bg-blue-100 border border-yellow-200 rounded p-3 mt-3">
              <Text className="text-sm font-bold text-yellow-800 mb-1 block">⚠️ 注意事项</Text>
              <Text className="text-xs text-yellow-700 block">• 文件大小不能超过5MB</Text>
              <Text className="text-xs text-yellow-700 block">• 支持.xlsx和.xls格式</Text>
              <Text className="text-xs text-yellow-700 block">• 手机号不能重复</Text>
              <Text className="text-xs text-yellow-700 block">• 导入前请仔细检查数据格式</Text>
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="mb-4">
            <Button
              className="w-full bg-blue-100 text-white py-3 rounded break-keep text-base mb-3"
              size="default"
              onClick={handleDownloadTemplate}>
              📥 查看模板说明
            </Button>

            <Button
              className="w-full bg-blue-100 text-white py-3 rounded break-keep text-base"
              size="default"
              onClick={handleImport}
              disabled={importing}>
              {importing ? '导入中...' : '📂 选择文件并导入'}
            </Button>
          </View>

          {/* 导入进度 */}
          {importing && (
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm mb-4">
              <Text className="text-base font-bold text-gray-900 mb-3 block">导入进度</Text>

              {/* 进度条 */}
              <View className="mb-3">
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-sm text-gray-700">正在导入...</Text>
                  <Text className="text-sm font-bold text-blue-600">{importProgress}%</Text>
                </View>

                <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{width: `${importProgress}%`}}
                  />
                </View>
              </View>

              {/* 进度说明 */}
              <View className="bg-blue-100 rounded p-3">
                <Text className="text-xs text-blue-600 block">
                  {importProgress < 10 && '正在读取文件...'}
                  {importProgress >= 10 && importProgress < 30 && '正在解析数据...'}
                  {importProgress >= 30 && importProgress < 50 && '正在验证数据...'}
                  {importProgress >= 50 && importProgress < 100 && '正在导入数据...'}
                  {importProgress === 100 && '导入完成！'}
                </Text>
              </View>
            </View>
          )}

          {/* 导入结果 */}
          {importResult && (
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm mb-4">
              {/* 成功图标 */}
              <View className="flex items-center justify-center mb-4">
                {importResult.success > 0 ? (
                  <View className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <View className="i-mdi-check text-4xl text-green-600" />
                  </View>
                ) : (
                  <View className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <View className="i-mdi-close text-4xl text-red-600" />
                  </View>
                )}
              </View>

              <Text className="text-xl font-bold text-center text-gray-900 mb-2 block">
                {importResult.success > 0 ? '导入成功！' : '导入失败'}
              </Text>

              <Text className="text-sm text-center text-muted-foreground mb-4 block">
                成功 {importResult.success} 人，失败 {importResult.failed} 人
              </Text>

              <View className="mb-3">
                <View className="flex items-center mb-2">
                  <Text className="text-sm text-gray-700 flex-1">成功导入：</Text>
                  <Text className="text-lg font-bold text-green-600">{importResult.success} 人</Text>
                </View>

                <View className="flex items-center mb-2">
                  <Text className="text-sm text-gray-700 flex-1">导入失败：</Text>
                  <Text className="text-lg font-bold text-red-600">{importResult.failed} 人</Text>
                </View>
              </View>

              {importResult.errors.length > 0 && (
                <View className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                  <Text className="text-sm font-bold text-red-600 mb-2 block">错误详情：</Text>
                  {importResult.errors.map((error, index) => (
                    <Text key={index} className="text-xs text-red-600 block mb-1">
                      • {error}
                    </Text>
                  ))}
                </View>
              )}

              {/* 快捷操作 */}
              <View className="flex gap-2">
                <Button
                  className="flex-1 bg-blue-100 text-white py-2 rounded break-keep text-sm"
                  size="default"
                  onClick={() => {
                    Taro.navigateTo({url: '/packageA/pages/employees/index'})
                  }}>
                  查看员工列表
                </Button>
                <Button
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded break-keep text-sm"
                  size="default"
                  onClick={() => {
                    setImportResult(null)
                    setImportProgress(0)
                  }}>
                  继续导入
                </Button>
              </View>
            </View>
          )}

          {/* 数据示例 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <Text className="text-base font-bold text-gray-900 mb-3 block">数据示例</Text>

            <View className="bg-gray-50 rounded p-3">
              <View className="flex border-b border-gray-200 pb-2 mb-2">
                <Text className="text-xs font-bold text-gray-800" style={{width: '20%'}}>
                  姓名
                </Text>
                <Text className="text-xs font-bold text-gray-800" style={{width: '30%'}}>
                  手机号
                </Text>
                <Text className="text-xs font-bold text-gray-800" style={{width: '25%'}}>
                  店铺名称
                </Text>
                <Text className="text-xs font-bold text-gray-800" style={{width: '25%'}}>
                  员工类型
                </Text>
              </View>

              <View className="flex pb-2 mb-2">
                <Text className="text-xs text-gray-700" style={{width: '20%'}}>
                  张三
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '30%'}}>
                  13800138000
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '25%'}}>
                  总店
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '25%'}}>
                  正式
                </Text>
              </View>

              <View className="flex pb-2 mb-2">
                <Text className="text-xs text-gray-700" style={{width: '20%'}}>
                  李四
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '30%'}}>
                  13900139000
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '25%'}}>
                  总店
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '25%'}}>
                  兼职
                </Text>
              </View>

              <View className="flex pb-2">
                <Text className="text-xs text-gray-700" style={{width: '20%'}}>
                  王五
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '30%'}}>
                  13700137000
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '25%'}}>
                  总店
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '25%'}}>
                  正式
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
export default EmployeeImport
