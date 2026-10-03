import {Button, Picker, ScrollView, Text, View} from '@tarojs/components'
import {navigateBack, showToast} from '@tarojs/taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {useTenantStore} from '@/store/tenant'

type ExportType = 'employees' | 'stores' | 'schedules' | 'schedule_logs' | 'analytics' | 'cost'
type ExportFormat = 'excel' | 'pdf' | 'csv'

interface ExportOption {
  id: ExportType
  name: string
  description: string
  icon: string
  color: string
}

const DataExport: React.FC = () => {
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [selectedType, setSelectedType] = useState<ExportType>('employees')
  const [_selectedFormat, setSelectedFormat] = useState<ExportFormat>('excel')
  const [exporting, setExporting] = useState(false)
  const [formatIndex, setFormatIndex] = useState(0)

  const exportOptions: ExportOption[] = [
    {
      id: 'employees',
      name: '员工数据',
      description: '导出所有员工信息（姓名、手机号、店铺、类型等）',
      icon: 'i-mdi-account-group',
      color: 'blue'
    },
    {
      id: 'stores',
      name: '店铺数据',
      description: '导出所有店铺信息（名称、地址、店经理等）',
      icon: 'i-mdi-store',
      color: 'green'
    },
    {
      id: 'schedules',
      name: '排班数据',
      description: '导出排班计划（员工、店铺、班次、日期等）',
      icon: 'i-mdi-calendar-clock',
      color: 'purple'
    },
    {
      id: 'schedule_logs',
      name: '排班日志',
      description: '导出排班执行记录（评分、状态、用时等）',
      icon: 'i-mdi-clipboard-text',
      color: 'orange'
    },
    {
      id: 'analytics',
      name: '数据分析报表',
      description: '导出统计分析数据（质量指标、店铺统计等）',
      icon: 'i-mdi-chart-bar',
      color: 'indigo'
    },
    {
      id: 'cost',
      name: '成本管控报表',
      description: '导出成本分析数据（营收、成本、效能等）',
      icon: 'i-mdi-currency-usd',
      color: 'red'
    }
  ]

  const formatOptions = [
    {value: 'excel', label: 'Excel格式 (.xlsx)', icon: 'i-mdi-file-excel'},
    {value: 'pdf', label: 'PDF格式 (.pdf)', icon: 'i-mdi-file-pdf-box'},
    {value: 'csv', label: 'CSV格式 (.csv)', icon: 'i-mdi-file-delimited'}
  ]

  // 选择导出类型
  const handleSelectType = useCallback((type: ExportType) => {
    setSelectedType(type)
  }, [])

  // 选择导出格式
  const handleFormatChange = useCallback((e: any) => {
    const index = e.detail.value
    setFormatIndex(index)
    setSelectedFormat(formatOptions[index].value as ExportFormat)
  }, [])

  // 开始导出
  const handleExport = useCallback(async () => {
    if (!currentTenant) {
      showToast({
        title: '请先选择租户',
        icon: 'error',
        duration: 2000
      })
      return
    }

    setExporting(true)
    try {
      // TODO: 实现数据导出逻辑
      await new Promise((resolve) => setTimeout(resolve, 2000))

      showToast({
        title: '导出成功',
        icon: 'success',
        duration: 2000
      })
    } catch (_error) {
      showToast({
        title: '导出失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setExporting(false)
    }
  }, [currentTenant])

  // 返回
  const handleBack = useCallback(() => {
    navigateBack()
  }, [])

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4">
          {/* 标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground block mb-2">数据导出</Text>
            <Text className="text-sm text-muted-foreground block">导出各类数据报表，支持多种格式</Text>
          </View>

          {/* 选择导出类型 */}
          <View className="mb-4">
            <View className="flex items-center mb-3">
              <View className="i-mdi-database-export text-xl text-blue-500 mr-2"></View>
              <Text className="text-base font-semibold text-foreground">选择导出类型</Text>
            </View>
            <View className="space-y-2">
              {exportOptions.map((option) => (
                <View
                  key={option.id}
                  className={`bg-white rounded-xl p-4 shadow-sm ${
                    selectedType === option.id ? `border-2 border-${option.color}-500` : ''
                  }`}
                  onClick={() => handleSelectType(option.id)}>
                  <View className="flex items-start">
                    <View className={`${option.icon} text-2xl text-${option.color}-500 mr-3 mt-1`}></View>
                    <View className="flex-1">
                      <View className="flex items-center justify-between mb-1">
                        <Text className="text-base font-semibold text-foreground">{option.name}</Text>
                        {selectedType === option.id && (
                          <View className="i-mdi-check-circle text-lg text-blue-500"></View>
                        )}
                      </View>
                      <Text className="text-sm text-muted-foreground block">{option.description}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 选择导出格式 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center mb-3">
              <View className="i-mdi-file-document text-xl text-green-500 mr-2"></View>
              <Text className="text-base font-semibold text-foreground">选择导出格式</Text>
            </View>
            <Picker
              mode="selector"
              range={formatOptions.map((f) => f.label)}
              value={formatIndex}
              onChange={handleFormatChange}>
              <View className="bg-muted rounded-xl p-3 flex items-center justify-between">
                <View className="flex items-center">
                  <View className={`${formatOptions[formatIndex].icon} text-lg text-muted-foreground mr-2`}></View>
                  <Text className="text-sm text-foreground">{formatOptions[formatIndex].label}</Text>
                </View>
                <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
              </View>
            </Picker>
          </View>

          {/* 导出说明 */}
          <View className="bg-blue-100 rounded-lg p-4 mb-4 border border-blue-200">
            <View className="flex items-center mb-2">
              <View className="i-mdi-information text-lg text-muted-foreground mr-2"></View>
              <Text className="text-sm font-semibold text-blue-600">导出说明</Text>
            </View>
            <View className="space-y-1">
              <Text className="text-xs text-blue-600 block">• Excel格式：适合数据分析和编辑，支持公式和图表</Text>
              <Text className="text-xs text-blue-600 block">• PDF格式：适合打印和分享，保持格式不变</Text>
              <Text className="text-xs text-blue-600 block">• CSV格式：适合数据导入和系统对接，纯文本格式</Text>
              <Text className="text-xs text-blue-600 block">• 导出的数据仅包含当前租户的数据</Text>
              <Text className="text-xs text-blue-600 block">• 大量数据导出可能需要较长时间，请耐心等待</Text>
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="flex gap-3 mb-4">
            <Button
              className="flex-1 bg-gray-500 text-white rounded-xl text-sm break-keep"
              size="default"
              onClick={handleBack}>
              返回
            </Button>
            <Button
              className="flex-1 bg-blue-100 text-white rounded-xl text-sm break-keep"
              size="default"
              loading={exporting}
              onClick={handleExport}>
              {exporting ? '导出中...' : '开始导出'}
            </Button>
          </View>

          {/* 功能开发提示 */}
          <View className="bg-blue-100 rounded-lg p-4 border border-yellow-200">
            <View className="flex items-center mb-2">
              <View className="i-mdi-alert text-lg text-yellow-600 mr-2"></View>
              <Text className="text-sm font-semibold text-yellow-800">功能说明</Text>
            </View>
            <Text className="text-xs text-yellow-700 block">
              数据导出功能界面已完成，实际导出逻辑需要根据具体业务需求进一步开发。
              目前点击"开始导出"会模拟导出过程，实际项目中需要对接后端API实现真实的数据导出功能。
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default DataExport
