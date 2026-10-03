import {Input, Text, View} from '@tarojs/components'
import type React from 'react'
import {useState} from 'react'
import type {ScheduleConfig} from '../types'

interface Step4ScheduleProps {
  initialData: ScheduleConfig | null
  onComplete: (data: ScheduleConfig) => void
}

const Step4Schedule: React.FC<Step4ScheduleProps> = ({initialData, onComplete}) => {
  const [config, setConfig] = useState<ScheduleConfig>(
    initialData || {
      high_efficiency_min: 120,
      high_efficiency_max: 150,
      standard_efficiency_min: 80,
      standard_efficiency_max: 119,
      low_efficiency_min: 0,
      low_efficiency_max: 79,
      daily_work_hours: 8,
      weekly_work_hours: 40,
      target_cost_rate: 20,
      warning_threshold: 25
    }
  )

  const handleUpdate = (field: keyof ScheduleConfig, value: number) => {
    setConfig({...config, [field]: value})
  }

  return (
    <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
      {/* 标题和说明 */}
      <View className="mb-6">
        <View className="flex items-center gap-2 mb-2">
          <View className="i-mdi-cog text-2xl text-blue-500" />
          <Text className="text-lg font-bold text-gray-800">排班配置</Text>
        </View>
        <Text className="text-sm text-gray-600">设置排班规则和成本控制标准，系统将根据这些标准进行智能排班。</Text>
      </View>

      {/* 表单 */}
      <View className="space-y-6">
        {/* 效能标准设置 */}
        <View>
          <View className="flex items-center gap-2 mb-3">
            <View className="i-mdi-chart-line text-lg text-muted-foreground" />
            <Text className="text-sm font-bold text-gray-800">效能标准设置</Text>
          </View>

          <View className="space-y-3 pl-6">
            {/* 高效区间 */}
            <View>
              <Text className="text-xs text-gray-600 mb-2">高效区间（元/人/小时）</Text>
              <View className="flex items-center gap-2">
                <View style={{overflow: 'hidden'}} className="flex-1">
                  <Input
                    className="bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 w-full"
                    type="number"
                    placeholder="最小值"
                    value={config.high_efficiency_min.toString()}
                    onInput={(e) => handleUpdate('high_efficiency_min', Number(e.detail.value) || 0)}
                  />
                </View>
                <Text className="text-gray-500">-</Text>
                <View style={{overflow: 'hidden'}} className="flex-1">
                  <Input
                    className="bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 w-full"
                    type="number"
                    placeholder="最大值"
                    value={config.high_efficiency_max.toString()}
                    onInput={(e) => handleUpdate('high_efficiency_max', Number(e.detail.value) || 0)}
                  />
                </View>
              </View>
            </View>

            {/* 标准区间 */}
            <View>
              <Text className="text-xs text-gray-600 mb-2">标准区间（元/人/小时）</Text>
              <View className="flex items-center gap-2">
                <View style={{overflow: 'hidden'}} className="flex-1">
                  <Input
                    className="bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 w-full"
                    type="number"
                    placeholder="最小值"
                    value={config.standard_efficiency_min.toString()}
                    onInput={(e) => handleUpdate('standard_efficiency_min', Number(e.detail.value) || 0)}
                  />
                </View>
                <Text className="text-gray-500">-</Text>
                <View style={{overflow: 'hidden'}} className="flex-1">
                  <Input
                    className="bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 w-full"
                    type="number"
                    placeholder="最大值"
                    value={config.standard_efficiency_max.toString()}
                    onInput={(e) => handleUpdate('standard_efficiency_max', Number(e.detail.value) || 0)}
                  />
                </View>
              </View>
            </View>

            {/* 低效区间 */}
            <View>
              <Text className="text-xs text-gray-600 mb-2">低效区间（元/人/小时）</Text>
              <View className="flex items-center gap-2">
                <View style={{overflow: 'hidden'}} className="flex-1">
                  <Input
                    className="bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 w-full"
                    type="number"
                    placeholder="最小值"
                    value={config.low_efficiency_min.toString()}
                    onInput={(e) => handleUpdate('low_efficiency_min', Number(e.detail.value) || 0)}
                  />
                </View>
                <Text className="text-gray-500">-</Text>
                <View style={{overflow: 'hidden'}} className="flex-1">
                  <Input
                    className="bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 w-full"
                    type="number"
                    placeholder="最大值"
                    value={config.low_efficiency_max.toString()}
                    onInput={(e) => handleUpdate('low_efficiency_max', Number(e.detail.value) || 0)}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 工时设置 */}
        <View>
          <View className="flex items-center gap-2 mb-3">
            <View className="i-mdi-clock-outline text-lg text-muted-foreground" />
            <Text className="text-sm font-bold text-gray-800">工时设置</Text>
          </View>

          <View className="space-y-3 pl-6">
            {/* 每日标准工时 */}
            <View>
              <Text className="text-xs text-gray-600 mb-2">每日标准工时（小时）</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 w-full"
                  type="number"
                  placeholder="如：8"
                  value={config.daily_work_hours.toString()}
                  onInput={(e) => handleUpdate('daily_work_hours', Number(e.detail.value) || 0)}
                />
              </View>
            </View>

            {/* 每周标准工时 */}
            <View>
              <Text className="text-xs text-gray-600 mb-2">每周标准工时（小时）</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 w-full"
                  type="number"
                  placeholder="如：40"
                  value={config.weekly_work_hours.toString()}
                  onInput={(e) => handleUpdate('weekly_work_hours', Number(e.detail.value) || 0)}
                />
              </View>
            </View>
          </View>
        </View>

        {/* 成本控制 */}
        <View>
          <View className="flex items-center gap-2 mb-3">
            <View className="i-mdi-currency-cny text-lg text-muted-foreground" />
            <Text className="text-sm font-bold text-gray-800">成本控制</Text>
          </View>

          <View className="space-y-3 pl-6">
            {/* 目标人力成本率 */}
            <View>
              <Text className="text-xs text-gray-600 mb-2">目标人力成本率（%，建议20%以内）</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 w-full"
                  type="number"
                  placeholder="如：20"
                  value={config.target_cost_rate.toString()}
                  onInput={(e) => handleUpdate('target_cost_rate', Number(e.detail.value) || 0)}
                />
              </View>
            </View>

            {/* 预警阈值 */}
            <View>
              <Text className="text-xs text-gray-600 mb-2">预警阈值（%，建议25%）</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 w-full"
                  type="number"
                  placeholder="如：25"
                  value={config.warning_threshold?.toString() || ''}
                  onInput={(e) => handleUpdate('warning_threshold', Number(e.detail.value) || 0)}
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 提示信息 */}
      <View className="mt-4 bg-blue-100 rounded-lg p-3">
        <View className="flex items-start gap-2">
          <View className="i-mdi-information text-blue-500 mt-0.5" />
          <Text className="text-xs text-blue-700 flex-1">
            这些配置将作为系统智能排班的依据。您可以根据实际经营情况随时在管理中心调整。
          </Text>
        </View>
      </View>
    </View>
  )
}

export default Step4Schedule
export type {Step4ScheduleProps}
