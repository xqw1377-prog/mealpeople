/**
 * 历史营收数据导入页面
 * 支持Excel批量导入历史营收数据
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useState} from 'react'
import * as XLSX from 'xlsx'
import {importRevenueFromExcel} from '@/db/api-revenue-detail'
import type {RevenueImportRow} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

export default function RevenueHistoryImport() {
  const {user} = useAuth({guard: true})
  // 使用 selector 方式获取 store 状态
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: number
    failed: number
    total: number
    errors: Array<{row: number; error: string}>
  } | null>(null)

  // 生成并下载Excel模板
  const handleDownloadTemplate = () => {
    try {
      // 创建示例数据
      const templateData = [
        {
          日期: '2024-01-01',
          餐段: '早餐',
          经营区: '大厅',
          来客数: 50,
          客单价: 25.5,
          备注: '元旦假期'
        },
        {
          日期: '2024-01-01',
          餐段: '午餐',
          经营区: '大厅',
          来客数: 120,
          客单价: 45.8,
          备注: ''
        },
        {
          日期: '2024-01-01',
          餐段: '晚餐',
          经营区: '大厅',
          来客数: 150,
          客单价: 52.3,
          备注: ''
        },
        {
          日期: '2024-01-01',
          餐段: '午餐',
          经营区: '包间',
          来客数: 30,
          客单价: 88.0,
          备注: ''
        },
        {
          日期: '2024-01-02',
          餐段: '早餐',
          经营区: '大厅',
          来客数: 45,
          客单价: 23.5,
          备注: ''
        }
      ]

      // 创建工作簿
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(templateData)

      // 设置列宽
      ws['!cols'] = [
        {wch: 12}, // 日期
        {wch: 10}, // 餐段
        {wch: 10}, // 经营区
        {wch: 10}, // 来客数
        {wch: 10}, // 客单价
        {wch: 20} // 备注
      ]

      XLSX.utils.book_append_sheet(wb, ws, '营收明细')

      // 生成Excel文件
      const wbout = XLSX.write(wb, {bookType: 'xlsx', type: 'base64'})

      // 保存文件
      const fs = Taro.getFileSystemManager()
      const filePath = `${Taro.env.USER_DATA_PATH}/营收明细导入模板.xlsx`

      fs.writeFile({
        filePath,
        data: wbout,
        encoding: 'base64',
        success: () => {
          Taro.showModal({
            title: '模板已生成',
            content: `模板文件已保存到：\n${filePath}\n\n字段说明：\n• 日期：YYYY-MM-DD格式\n• 餐段：早餐/午餐/晚餐/夜宵\n• 经营区：大厅/包间/外卖/其他\n• 来客数：整数\n• 客单价：小数（保留2位）\n• 备注：可选\n\n支持导入任意长时间的历史数据，数据越多，营业预估越准确！`,
            confirmText: '我知道了',
            showCancel: false
          })
        },
        fail: (err) => {
          console.error('保存模板失败:', err)
          Taro.showToast({
            title: '保存模板失败',
            icon: 'none'
          })
        }
      })
    } catch (error) {
      console.error('生成模板失败:', error)
      Taro.showToast({
        title: '生成模板失败',
        icon: 'none'
      })
    }
  }

  // 选择文件并导入
  const handleImport = async () => {
    if (!currentTenant || !currentStore || !user) {
      Taro.showToast({
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

      // 检查文件大小（限制10MB，支持更多数据）
      if (file.size > 10 * 1024 * 1024) {
        Taro.showToast({
          title: '文件大小不能超过10MB',
          icon: 'none',
          duration: 2000
        })
        return
      }

      setImporting(true)
      setImportResult(null)

      // 读取文件
      const fs = Taro.getFileSystemManager()
      const fileContent = fs.readFileSync(file.path, 'base64') as string

      // 解析Excel
      const wb = XLSX.read(fileContent, {type: 'base64'})
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]

      // 转换为JSON
      const data = XLSX.utils.sheet_to_json<RevenueImportRow>(ws)

      console.log('解析的数据:', data)

      if (data.length === 0) {
        throw new Error('Excel文件中没有数据')
      }

      // 显示导入进度
      Taro.showLoading({
        title: `正在导入${data.length}条数据...`,
        mask: true
      })

      // 调用导入API
      const result = await importRevenueFromExcel({
        tenantId: currentTenant.id,
        storeId: currentStore.id,
        userId: user.id,
        fileName: file.name,
        rows: data
      })

      Taro.hideLoading()

      // 设置导入结果
      setImportResult({
        success: result.success_count,
        failed: result.failed_count,
        total: result.total,
        errors: result.errors.map((e) => ({
          row: e.row,
          error: e.error
        }))
      })

      if (result.success) {
        Taro.showToast({
          title: `成功导入${result.success_count}条数据`,
          icon: 'success',
          duration: 2000
        })
      } else {
        Taro.showModal({
          title: '导入完成',
          content: `成功：${result.success_count}条\n失败：${result.failed_count}条\n\n请查看下方错误详情`,
          showCancel: false
        })
      }
    } catch (error) {
      console.error('导入失败:', error)
      Taro.hideLoading()
      Taro.showToast({
        title: error instanceof Error ? error.message : '导入失败',
        icon: 'none',
        duration: 2000
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-4">
            <Text className="text-xl font-bold text-gray-900 block mb-1">历史营收数据导入</Text>
            <Text className="text-sm text-gray-700 block">批量导入历史营收明细数据，支持Excel格式</Text>
          </View>

          {/* 功能亮点 */}
          <View className="bg-blue-100 rounded-lg p-4 mb-4 shadow-md">
            <Text className="text-base font-bold text-foreground mb-2 block">💡 功能亮点</Text>
            <Text className="text-sm text-blue-600 block mb-1">✓ 支持导入任意长时间的历史数据</Text>
            <Text className="text-sm text-blue-600 block mb-1">✓ 数据越多，营业预估越准确</Text>
            <Text className="text-sm text-blue-600 block mb-1">✓ 支持按餐段和经营区细分</Text>
            <Text className="text-sm text-blue-600 block">✓ 最大支持10MB文件，可导入数千条数据</Text>
          </View>

          {/* 使用说明 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-base font-bold text-gray-900 mb-3 block">📋 使用说明</Text>

            <View className="mb-3">
              <Text className="text-sm font-bold text-gray-800 mb-2 block">1. 下载模板</Text>
              <Text className="text-sm text-gray-700 mb-2 block">点击下方"下载模板"按钮，获取标准的Excel导入模板</Text>
            </View>

            <View className="mb-3">
              <Text className="text-sm font-bold text-gray-800 mb-2 block">2. 填写数据</Text>
              <Text className="text-sm text-gray-700 mb-1 block">按照模板格式填写以下字段：</Text>
              <View className="ml-4 bg-gray-50 rounded p-2 mt-2">
                <Text className="text-sm text-gray-700 block mb-1">• 日期：YYYY-MM-DD格式，如 2024-01-01</Text>
                <Text className="text-sm text-gray-700 block mb-1">• 餐段：早餐/午餐/晚餐/夜宵</Text>
                <Text className="text-sm text-gray-700 block mb-1">• 经营区：大厅/包间/外卖/其他</Text>
                <Text className="text-sm text-gray-700 block mb-1">• 来客数：整数，表示客人数量</Text>
                <Text className="text-sm text-gray-700 block mb-1">• 客单价：小数，单位为元</Text>
                <Text className="text-sm text-gray-700 block">• 备注：文本，记录特殊情况（可选）</Text>
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
              <Text className="text-xs text-yellow-700 block mb-1">• 文件大小不能超过10MB</Text>
              <Text className="text-xs text-yellow-700 block mb-1">• 支持.xlsx和.xls格式</Text>
              <Text className="text-xs text-yellow-700 block mb-1">• 建议导入至少3个月的历史数据</Text>
              <Text className="text-xs text-yellow-700 block mb-1">• 数据越完整，预测越准确</Text>
              <Text className="text-xs text-yellow-700 block">• 导入前请仔细检查数据格式</Text>
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="mb-4">
            <Button
              className="w-full bg-blue-100 text-white py-3 rounded break-keep text-base mb-3"
              size="default"
              onClick={handleDownloadTemplate}>
              <View className="flex items-center justify-center gap-2">
                <View className="i-mdi-download text-xl" />
                <Text>下载Excel模板</Text>
              </View>
            </Button>

            <Button
              className="w-full bg-blue-100 text-white py-3 rounded break-keep text-base"
              size="default"
              onClick={handleImport}
              loading={importing}
              disabled={importing}>
              <View className="flex items-center justify-center gap-2">
                <View className="i-mdi-file-excel text-xl" />
                <Text>{importing ? '导入中...' : '选择文件并导入'}</Text>
              </View>
            </Button>
          </View>

          {/* 导入结果 */}
          {importResult && (
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm mb-4">
              <Text className="text-base font-bold text-gray-900 mb-3 block">📊 导入结果</Text>

              <View className="mb-3">
                <View className="flex items-center mb-2 bg-gray-50 rounded p-2">
                  <Text className="text-sm text-gray-700 flex-1">总计：</Text>
                  <Text className="text-lg font-bold text-muted-foreground">{importResult.total} 条</Text>
                </View>

                <View className="flex items-center mb-2 bg-blue-100 rounded p-2">
                  <Text className="text-sm text-gray-700 flex-1">成功导入：</Text>
                  <Text className="text-lg font-bold text-muted-foreground">{importResult.success} 条</Text>
                </View>

                {importResult.failed > 0 && (
                  <View className="flex items-center mb-2 bg-blue-100 rounded p-2">
                    <Text className="text-sm text-gray-700 flex-1">导入失败：</Text>
                    <Text className="text-lg font-bold text-red-600">{importResult.failed} 条</Text>
                  </View>
                )}
              </View>

              {importResult.errors.length > 0 && (
                <View className="bg-blue-100 border border-border rounded p-3">
                  <Text className="text-sm font-bold text-red-600 mb-2 block">❌ 错误详情：</Text>
                  <ScrollView style={{maxHeight: '200px'}}>
                    {importResult.errors.map((error, index) => (
                      <Text key={index} className="text-xs text-red-600 block mb-1">
                        第{error.row}行：{error.error}
                      </Text>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* 数据示例 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <Text className="text-base font-bold text-gray-900 mb-3 block">📝 数据示例</Text>

            <View className="bg-gray-50 rounded p-3 overflow-x-auto">
              <View className="flex border-b border-border pb-2 mb-2">
                <Text className="text-xs font-bold text-gray-800" style={{width: '90px'}}>
                  日期
                </Text>
                <Text className="text-xs font-bold text-gray-800" style={{width: '60px'}}>
                  餐段
                </Text>
                <Text className="text-xs font-bold text-gray-800" style={{width: '60px'}}>
                  经营区
                </Text>
                <Text className="text-xs font-bold text-gray-800" style={{width: '60px'}}>
                  来客数
                </Text>
                <Text className="text-xs font-bold text-gray-800" style={{width: '60px'}}>
                  客单价
                </Text>
              </View>

              <View className="flex pb-2 mb-2">
                <Text className="text-xs text-gray-700" style={{width: '90px'}}>
                  2024-01-01
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '60px'}}>
                  早餐
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '60px'}}>
                  大厅
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '60px'}}>
                  50
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '60px'}}>
                  25.5
                </Text>
              </View>

              <View className="flex pb-2 mb-2">
                <Text className="text-xs text-gray-700" style={{width: '90px'}}>
                  2024-01-01
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '60px'}}>
                  午餐
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '60px'}}>
                  大厅
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '60px'}}>
                  120
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '60px'}}>
                  45.8
                </Text>
              </View>

              <View className="flex pb-2">
                <Text className="text-xs text-gray-700" style={{width: '90px'}}>
                  2024-01-01
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '60px'}}>
                  晚餐
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '60px'}}>
                  大厅
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '60px'}}>
                  150
                </Text>
                <Text className="text-xs text-gray-700" style={{width: '60px'}}>
                  52.3
                </Text>
              </View>
            </View>

            <View className="mt-3 bg-blue-100 rounded p-3">
              <Text className="text-xs text-blue-600 block">
                💡 提示：一天可以有多条记录，按餐段和经营区细分。例如：早餐-大厅、午餐-大厅、午餐-包间、晚餐-大厅等。
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
