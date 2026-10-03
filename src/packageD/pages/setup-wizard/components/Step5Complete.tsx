import {Button, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import type React from 'react'
import type {BrandInfo, ScheduleConfig, StaffInfo, StoreInfo} from '../types'

interface Step5CompleteProps {
  brandInfo: BrandInfo | null
  stores: StoreInfo[]
  staff: StaffInfo[]
  scheduleConfig: ScheduleConfig | null
}

const Step5Complete: React.FC<Step5CompleteProps> = ({brandInfo, stores, staff, scheduleConfig}) => {
  const handleGoHome = () => {
    Taro.switchTab({url: '/pages/index/index'})
  }

  const handleGoSchedule = () => {
    Taro.navigateTo({url: '/packageB/pages/schedule-planning/index'})
  }

  return (
    <View className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
      {/* 成功图标 */}
      <View className="flex flex-col items-center mb-6">
        <View className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <View className="i-mdi-check-circle text-5xl text-green-500" />
        </View>
        <Text className="text-xl font-bold text-gray-800 mb-2">设置完成！</Text>
        <Text className="text-sm text-gray-600 text-center">恭喜！您已完成所有基础配置，现在可以开始使用系统了。</Text>
      </View>

      {/* 配置摘要 */}
      <View className="bg-gray-50 rounded-xl p-4 mb-6">
        <Text className="text-sm font-bold text-gray-800 mb-3">配置摘要</Text>

        <View className="space-y-3">
          {/* 品牌信息 */}
          <View className="flex items-center justify-between">
            <View className="flex items-center gap-2">
              <View className="i-mdi-check-circle text-green-500" />
              <Text className="text-sm text-gray-700">品牌信息</Text>
            </View>
            <Text className="text-sm text-gray-600">{brandInfo?.name}</Text>
          </View>

          {/* 门店数量 */}
          <View className="flex items-center justify-between">
            <View className="flex items-center gap-2">
              <View className="i-mdi-check-circle text-green-500" />
              <Text className="text-sm text-gray-700">门店数量</Text>
            </View>
            <Text className="text-sm text-gray-600">{stores.length} 家</Text>
          </View>

          {/* 员工数量 */}
          <View className="flex items-center justify-between">
            <View className="flex items-center gap-2">
              <View className="i-mdi-check-circle text-green-500" />
              <Text className="text-sm text-gray-700">员工数量</Text>
            </View>
            <Text className="text-sm text-gray-600">{staff.length} 人</Text>
          </View>

          {/* 排班配置 */}
          <View className="flex items-center justify-between">
            <View className="flex items-center gap-2">
              <View className="i-mdi-check-circle text-green-500" />
              <Text className="text-sm text-gray-700">排班配置</Text>
            </View>
            <Text className="text-sm text-gray-600">已完成</Text>
          </View>
        </View>
      </View>

      {/* 下一步操作建议 */}
      <View className="mb-6">
        <Text className="text-sm font-bold text-gray-800 mb-3">下一步操作</Text>

        <View className="space-y-3">
          {/* 前往首页 */}
          <View className="bg-blue-100 rounded-lg p-4">
            <View className="flex items-start gap-3">
              <View className="i-mdi-home text-2xl text-blue-500 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-800 block mb-1">前往首页</Text>
                <Text className="text-xs text-gray-600">选择门店，查看今日运营数据</Text>
              </View>
            </View>
          </View>

          {/* 开始排班 */}
          <View className="bg-blue-100 rounded-lg p-4">
            <View className="flex items-start gap-3">
              <View className="i-mdi-calendar-check text-2xl text-green-500 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-800 block mb-1">开始排班</Text>
                <Text className="text-xs text-gray-600">使用智能排班功能，快速生成排班方案</Text>
              </View>
            </View>
          </View>

          {/* 完善信息 */}
          <View className="bg-blue-100 rounded-lg p-4">
            <View className="flex items-start gap-3">
              <View className="i-mdi-cog text-2xl text-purple-500 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-800 block mb-1">完善信息</Text>
                <Text className="text-xs text-gray-600">在管理中心添加更多门店和员工信息</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 操作按钮 */}
      <View className="space-y-3">
        <Button
          className="w-full bg-blue-100 text-white py-4 rounded-lg text-base break-keep"
          size="default"
          onClick={handleGoHome}>
          前往首页
        </Button>

        <Button
          className="w-full bg-white text-muted-foreground py-4 rounded-lg text-base break-keep border border-blue-500"
          size="default"
          onClick={handleGoSchedule}>
          立即开始排班
        </Button>
      </View>

      {/* 提示信息 */}
      <View className="mt-6 bg-blue-100 rounded-lg p-3">
        <View className="flex items-start gap-2">
          <View className="i-mdi-lightbulb text-yellow-600 mt-0.5" />
          <Text className="text-xs text-yellow-800 flex-1">
            温馨提示：您可以随时在管理中心修改这些配置，或使用"系统设置向导"重新配置。
          </Text>
        </View>
      </View>
    </View>
  )
}

export default Step5Complete
export type {Step5CompleteProps}
