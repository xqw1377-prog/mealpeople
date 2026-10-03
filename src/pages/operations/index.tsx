/**
 * 运营管理页面 - 门店/品牌管理、成本控制、数据分析
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'

export default function Operations() {
  const {user} = useAuth({guard: true})

  // 导航到具体功能
  const handleNavigate = (path: string) => {
    Taro.navigateTo({url: path})
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        {/* 使用容器查询支持WEB端响应式 */}
        <View className="@container">
          <View className="p-4 max-w-7xl mx-auto">
            {/* 页面标题 - 修复文字颜色 */}
            <View className="mb-6">
              <View className="flex items-center gap-3 mb-2">
                <View className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-chart-line text-3xl text-blue-600" />
                </View>
                <View>
                  <Text className="text-2xl max-sm:text-xl font-bold text-foreground">运营管理</Text>
                  <Text className="text-sm text-muted-foreground">门店管理、成本控制、数据分析</Text>
                </View>
              </View>
            </View>

            {/* 门店管理 - WEB端优化 */}
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4">
              <View className="flex items-center gap-3 mb-4">
                <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-store text-2xl text-blue-600" />
                </View>
                <View>
                  <Text className="text-lg max-sm:text-base font-bold text-foreground">门店管理</Text>
                  <Text className="text-xs text-muted-foreground">管理门店和部门</Text>
                </View>
              </View>

              {/* WEB端使用2列，移动端使用1列 */}
              <View className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                <View
                  className="bg-green-500/10 rounded-lg p-4 flex items-center justify-between active:opacity-80 transition-all border border-border cursor-pointer"
                  onClick={() => handleNavigate('/packageD/pages/store-management/index')}>
                  <View className="flex items-center flex-1 gap-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <View className="i-mdi-office-building text-xl text-blue-600" />
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-foreground">门店列表</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">查看和管理所有门店</Text>
                    </View>
                  </View>
                  <View className="i-mdi-chevron-right text-2xl text-muted-foreground" />
                </View>

                <View
                  className="bg-blue-100 rounded-lg p-4 flex items-center justify-between active:opacity-80 transition-all border border-border cursor-pointer"
                  onClick={() => handleNavigate('/packageD/pages/department-management/index')}>
                  <View className="flex items-center flex-1 gap-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <View className="i-mdi-account-group text-xl text-blue-600" />
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-foreground">部门管理</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">管理部门和岗位</Text>
                    </View>
                  </View>
                  <View className="i-mdi-chevron-right text-2xl text-muted-foreground" />
                </View>
              </View>
            </View>

            {/* 成本控制 - WEB端优化 */}
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4">
              <View className="flex items-center gap-3 mb-4">
                <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-currency-usd text-2xl text-blue-600" />
                </View>
                <View>
                  <Text className="text-lg max-sm:text-base font-bold text-foreground">成本控制</Text>
                  <Text className="text-xs text-muted-foreground">人效分析和成本管理</Text>
                </View>
              </View>

              {/* WEB端使用2列，移动端使用1列 */}
              <View className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                <View
                  className="bg-green-500/10 rounded-lg p-4 flex items-center justify-between active:opacity-80 transition-all border border-border cursor-pointer"
                  onClick={() => handleNavigate('/packageB/pages/home/index')}>
                  <View className="flex items-center flex-1 gap-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <View className="i-mdi-chart-line text-xl text-blue-600" />
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-foreground">人效分析</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">查看人效指标和趋势</Text>
                    </View>
                  </View>
                  <View className="i-mdi-chevron-right text-2xl text-muted-foreground" />
                </View>

                <View
                  className="bg-blue-100 rounded-lg p-4 flex items-center justify-between active:opacity-80 transition-all border border-border cursor-pointer"
                  onClick={() => handleNavigate('/packageB/pages/home/index')}>
                  <View className="flex items-center flex-1 gap-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <View className="i-mdi-cash-multiple text-xl text-blue-600" />
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-foreground">人力成本</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">查看人力成本统计</Text>
                    </View>
                  </View>
                  <View className="i-mdi-chevron-right text-2xl text-muted-foreground" />
                </View>

                <View
                  className="bg-green-500/10 rounded-lg p-4 flex items-center justify-between active:opacity-80 transition-all border border-cyan-200 cursor-pointer @md:col-span-2"
                  onClick={() => handleNavigate('/packageB/pages/schedule-center/index')}>
                  <View className="flex items-center flex-1 gap-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <View className="i-mdi-calendar-clock text-xl text-blue-600" />
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-foreground">排班管理</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">统一管理所有排班功能</Text>
                    </View>
                  </View>
                  <View className="i-mdi-chevron-right text-2xl text-muted-foreground" />
                </View>
              </View>
            </View>

            {/* 数据分析 - WEB端优化 */}
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-20">
              <View className="flex items-center gap-3 mb-4">
                <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-chart-bar text-2xl text-blue-600" />
                </View>
                <View>
                  <Text className="text-lg max-sm:text-base font-bold text-foreground">数据分析</Text>
                  <Text className="text-xs text-muted-foreground">综合报表和绩效排行</Text>
                </View>
              </View>

              {/* WEB端使用2列，移动端使用1列 */}
              <View className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                <View
                  className="bg-green-500/10 rounded-lg p-4 flex items-center justify-between active:opacity-80 transition-all border border-border cursor-pointer"
                  onClick={() => handleNavigate('/packageB/pages/analytics/index')}>
                  <View className="flex items-center flex-1 gap-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <View className="i-mdi-chart-box text-xl text-blue-600" />
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-foreground">综合报表</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">查看各类数据报表</Text>
                    </View>
                  </View>
                  <View className="i-mdi-chevron-right text-2xl text-muted-foreground" />
                </View>

                <View
                  className="bg-blue-100 rounded-lg p-4 flex items-center justify-between active:opacity-80 transition-all border border-yellow-200 cursor-pointer"
                  onClick={() => handleNavigate('/packageG/pages/work-log-ranking/index')}>
                  <View className="flex items-center flex-1 gap-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <View className="i-mdi-trophy text-xl text-blue-600" />
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-foreground">绩效排行</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">查看员工绩效排名</Text>
                    </View>
                  </View>
                  <View className="i-mdi-chevron-right text-2xl text-muted-foreground" />
                </View>

                <View
                  className="bg-blue-100 rounded-lg p-4 flex items-center justify-between active:opacity-80 transition-all border border-border cursor-pointer @md:col-span-2"
                  onClick={() => handleNavigate('/packageB/pages/home/index')}>
                  <View className="flex items-center flex-1 gap-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <View className="i-mdi-file-chart text-xl text-blue-600" />
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-foreground">运营仪表盘</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">查看运营数据概览</Text>
                    </View>
                  </View>
                  <View className="i-mdi-chevron-right text-2xl text-muted-foreground" />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
