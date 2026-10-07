/**
 * 排班管理中心
 * 整合所有排班操作和查看功能的统一入口
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'

export default function ScheduleCenter() {
  useAuth({guard: true})

  // 导航到具体功能
  const handleNavigate = (path: string) => {
    Taro.navigateTo({url: path})
  }

  // 导航到分包页面
  const handleNavigateToPackage = (path: string) => {
    Taro.navigateTo({url: path})
  }

  return (
    <View className="bg-gray-50 min-h-screen">
      <ScrollView scrollY className="box-border" style={{height: '100vh'}}>
        {/* 使用容器查询支持WEB端响应式 */}
        <View className="@container">
          <View className="p-4 max-w-7xl mx-auto">
            {/* 页面标题 - WEB端优化 */}
            <View className="mb-6">
              <Text className="text-2xl max-sm:text-xl font-bold text-foreground">排班管理中心</Text>
              <Text className="text-sm text-muted-foreground mt-1">统一管理所有排班功能</Text>
            </View>

            {/* 排班管理 - WEB端优化 */}
            <View className="mb-6">
              <View className="flex items-center gap-2 mb-3">
                <View className="i-mdi-calendar-multiple text-lg text-foreground" />
                <Text className="text-base max-sm:text-sm font-semibold text-foreground">排班管理</Text>
              </View>

              {/* WEB端使用2列，移动端使用1列 */}
              <View className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                {/* 今日运营仪表盘 */}
                <View
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 active:opacity-70 transition-all cursor-pointer"
                  onClick={() => handleNavigate('/packageB/pages/home/index')}>
                  <View className="flex items-center gap-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <View className="i-mdi-chart-box text-xl text-blue-600" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">今日运营仪表盘</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">查看营收、人效、成本数据</Text>
                    </View>
                    <View className="i-mdi-chevron-right text-lg text-muted-foreground flex-shrink-0" />
                  </View>
                </View>

                {/* 排班列表 */}
                <View
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 active:opacity-70 transition-all cursor-pointer"
                  onClick={() => handleNavigateToPackage('/packageB/pages/schedules/index')}>
                  <View className="flex items-center gap-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <View className="i-mdi-calendar-text text-xl text-blue-600" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">排班列表</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">查看和管理所有排班</Text>
                    </View>
                    <View className="i-mdi-chevron-right text-lg text-muted-foreground flex-shrink-0" />
                  </View>
                </View>

                {/* 创建排班 */}
                <View
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 active:opacity-70 transition-all cursor-pointer"
                  onClick={() => handleNavigateToPackage('/packageB/pages/schedule-form/index')}>
                  <View className="flex items-center gap-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <View className="i-mdi-plus-circle text-xl text-blue-600" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">创建排班</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">为员工创建新的排班</Text>
                    </View>
                    <View className="i-mdi-chevron-right text-lg text-muted-foreground flex-shrink-0" />
                  </View>
                </View>

                {/* 换班审批（P2-S1-A 新增：真实审批入口） */}
                <View
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 active:opacity-70 transition-all cursor-pointer"
                  onClick={() => handleNavigateToPackage('/packageB/pages/swap-records/index')}>
                  <View className="flex items-center gap-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <View className="i-mdi-swap-horizontal text-xl text-blue-600" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">换班审批</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">处理员工的换班申请</Text>
                    </View>
                    <View className="i-mdi-chevron-right text-lg text-muted-foreground flex-shrink-0" />
                  </View>
                </View>
              </View>
            </View>

            {/* 智能排班 - WEB端优化 */}
            <View className="mb-6">
              <View className="flex items-center gap-2 mb-3">
                <View className="i-mdi-brain text-lg text-foreground" />
                <Text className="text-base max-sm:text-sm font-semibold text-foreground">智能排班</Text>
              </View>

              {/* WEB端使用2列，移动端使用1列 */}
              <View className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                {/* 排班规划 */}
                <View
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 active:opacity-70 transition-all cursor-pointer"
                  onClick={() => handleNavigateToPackage('/packageB/pages/schedule-planning/index')}>
                  <View className="flex items-center gap-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <View className="i-mdi-calendar-clock text-xl text-blue-600" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">排班规划</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">智能规划排班方案</Text>
                    </View>
                    <View className="i-mdi-chevron-right text-lg text-muted-foreground flex-shrink-0" />
                  </View>
                </View>

                {/* 排班优化入口已按 P2-S1 映射 RETIRE（本地计算不落库，无事实来源）；
                    S1-B 与排班规划合并评估后再定去留 */}
              </View>
            </View>

            {/* 排班统计 - WEB端优化 */}
            <View className="mb-6">
              <View className="flex items-center gap-2 mb-3">
                <View className="i-mdi-chart-bar text-lg text-foreground" />
                <Text className="text-base max-sm:text-sm font-semibold text-foreground">排班统计</Text>
              </View>

              {/* WEB端使用2列，移动端使用1列 */}
              <View className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                {/* 排班记录 */}
                <View
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 active:opacity-70 transition-all cursor-pointer"
                  onClick={() => handleNavigateToPackage('/packageA/pages/schedule-records/index')}>
                  <View className="flex items-center gap-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <View className="i-mdi-history text-xl text-blue-600" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">排班记录</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">查看历史排班记录</Text>
                    </View>
                    <View className="i-mdi-chevron-right text-lg text-muted-foreground flex-shrink-0" />
                  </View>
                </View>

                {/* 排班统计 */}
                <View
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 active:opacity-70 transition-all cursor-pointer"
                  onClick={() => handleNavigateToPackage('/packageA/pages/schedule-stats/index')}>
                  <View className="flex items-center gap-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <View className="i-mdi-chart-box text-xl text-blue-600" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">排班统计</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">查看排班数据统计</Text>
                    </View>
                    <View className="i-mdi-chevron-right text-lg text-muted-foreground flex-shrink-0" />
                  </View>
                </View>

                {/* 排班日志 */}
                <View
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 active:opacity-70 transition-all cursor-pointer @md:col-span-2"
                  onClick={() => handleNavigate('/packageB/pages/schedule-logs/index')}>
                  <View className="flex items-center gap-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <View className="i-mdi-file-document text-xl text-blue-600" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">排班日志</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">记录和查看排班日志</Text>
                    </View>
                    <View className="i-mdi-chevron-right text-lg text-muted-foreground flex-shrink-0" />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
