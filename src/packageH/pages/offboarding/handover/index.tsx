/**
 * 工作交接页面
 * 显示员工的工作交接清单和进度
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useState} from 'react'

const WorkHandover: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [_loading, _setLoading] = useState(false)

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 交接清单
  const handoverItems = [
    {
      id: 1,
      category: '工作文档',
      items: [
        {id: 11, name: '项目文档', status: 'completed'},
        {id: 12, name: '工作日志', status: 'completed'},
        {id: 13, name: '客户资料', status: 'in-progress'}
      ]
    },
    {
      id: 2,
      category: '工作任务',
      items: [
        {id: 21, name: '待办事项', status: 'completed'},
        {id: 22, name: '进行中项目', status: 'in-progress'},
        {id: 23, name: '跟进客户', status: 'pending'}
      ]
    },
    {
      id: 3,
      category: '物品归还',
      items: [
        {id: 31, name: '工作电脑', status: 'pending'},
        {id: 32, name: '门禁卡', status: 'pending'},
        {id: 33, name: '工作手机', status: 'pending'}
      ]
    },
    {
      id: 4,
      category: '账号权限',
      items: [
        {id: 41, name: '系统账号', status: 'pending'},
        {id: 42, name: '邮箱账号', status: 'pending'},
        {id: 43, name: '客户系统', status: 'pending'}
      ]
    }
  ]

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: 'i-mdi-check-circle',
          color: 'text-muted-foreground',
          bg: 'bg-green-100',
          label: '已完成'
        }
      case 'in-progress':
        return {
          icon: 'i-mdi-progress-clock',
          color: 'text-muted-foreground',
          bg: 'bg-blue-100',
          label: '进行中'
        }
      case 'pending':
        return {
          icon: 'i-mdi-clock-outline',
          color: 'text-muted-foreground',
          bg: 'bg-gray-50',
          label: '待处理'
        }
      default:
        return {
          icon: 'i-mdi-help-circle',
          color: 'text-muted-foreground',
          bg: 'bg-gray-50',
          label: '未知'
        }
    }
  }

  // 计算总体进度
  const calculateProgress = () => {
    const allItems = handoverItems.flatMap((category) => category.items)
    const completedItems = allItems.filter((item) => item.status === 'completed')
    return Math.round((completedItems.length / allItems.length) * 100)
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 space-y-4">
          {/* 页面标题 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center justify-between mb-4">
              <View className="flex items-center">
                <View className="i-mdi-swap-horizontal-circle text-3xl text-blue-600 mr-3" />
                <Text className="text-2xl font-bold text-foreground">工作交接</Text>
              </View>
              <View className="bg-muted p-2 rounded-lg active:opacity-70" onClick={handleBack}>
                <View className="i-mdi-arrow-left text-xl text-foreground" />
              </View>
            </View>
            <Text className="text-sm text-muted-foreground">完成工作交接清单，确保工作顺利移交</Text>
          </View>

          {/* 交接进度 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-4">
              <View className="i-mdi-progress-check text-2xl text-blue-600 mr-2" />
              <Text className="text-lg font-bold text-foreground">交接进度</Text>
            </View>
            <View>
              <View className="flex items-center justify-between mb-2">
                <Text className="text-sm text-muted-foreground">总体进度</Text>
                <Text className="text-sm font-bold text-blue-600">{calculateProgress()}%</Text>
              </View>
              <View className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <View className="h-full bg-blue-100" style={{width: `${calculateProgress()}%`}} />
              </View>
            </View>
          </View>

          {/* 交接清单 */}
          {handoverItems.map((category) => (
            <View key={category.id} className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
              <View className="flex items-center mb-4">
                <View className="i-mdi-clipboard-list text-2xl text-blue-600 mr-2" />
                <Text className="text-lg font-bold text-foreground">{category.category}</Text>
              </View>
              <View className="space-y-2">
                {category.items.map((item) => {
                  const statusStyle = getStatusStyle(item.status)
                  return (
                    <View key={item.id} className="flex items-center justify-between p-3 bg-gray-50/30 rounded-lg">
                      <View className="flex items-center flex-1">
                        <View className={`${statusStyle.icon} text-xl ${statusStyle.color} mr-3`} />
                        <Text className="text-sm text-foreground">{item.name}</Text>
                      </View>
                      <View className={`${statusStyle.bg} px-3 py-1 rounded-full`}>
                        <Text className={`text-xs ${statusStyle.color} font-medium`}>{statusStyle.label}</Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>
          ))}

          {/* 交接人信息 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-4">
              <View className="i-mdi-account-arrow-right text-2xl text-blue-600 mr-2" />
              <Text className="text-lg font-bold text-foreground">交接人信息</Text>
            </View>
            <View className="p-4 bg-blue-100 rounded-lg">
              <View className="space-y-2">
                <View className="flex items-center">
                  <View className="i-mdi-account text-lg text-muted-foreground mr-2" />
                  <Text className="text-sm text-muted-foreground">姓名：李明</Text>
                </View>
                <View className="flex items-center">
                  <View className="i-mdi-briefcase text-lg text-muted-foreground mr-2" />
                  <Text className="text-sm text-muted-foreground">职位：高级专员</Text>
                </View>
                <View className="flex items-center">
                  <View className="i-mdi-phone text-lg text-muted-foreground mr-2" />
                  <Text className="text-sm text-muted-foreground">电话：138****5678</Text>
                </View>
                <View className="flex items-center">
                  <View className="i-mdi-email text-lg text-muted-foreground mr-2" />
                  <Text className="text-sm text-muted-foreground">邮箱：liming@company.com</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 注意事项 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-4">
              <View className="i-mdi-alert-circle text-2xl text-blue-600 mr-2" />
              <Text className="text-lg font-bold text-foreground">注意事项</Text>
            </View>
            <View className="space-y-2">
              <View className="flex items-start">
                <View className="i-mdi-check-circle text-sm text-muted-foreground mr-2 mt-0.5" />
                <Text className="text-sm text-muted-foreground flex-1">请确保所有工作文档完整移交</Text>
              </View>
              <View className="flex items-start">
                <View className="i-mdi-check-circle text-sm text-muted-foreground mr-2 mt-0.5" />
                <Text className="text-sm text-muted-foreground flex-1">进行中的项目需详细说明进度</Text>
              </View>
              <View className="flex items-start">
                <View className="i-mdi-check-circle text-sm text-muted-foreground mr-2 mt-0.5" />
                <Text className="text-sm text-muted-foreground flex-1">客户资料需妥善交接</Text>
              </View>
              <View className="flex items-start">
                <View className="i-mdi-check-circle text-sm text-muted-foreground mr-2 mt-0.5" />
                <Text className="text-sm text-muted-foreground flex-1">公司物品需按时归还</Text>
              </View>
            </View>
          </View>

          {/* 确认交接 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View
              className="bg-green-500 text-white p-4 rounded-lg active:opacity-80"
              onClick={() => {
                Taro.showToast({
                  title: '交接确认功能开发中',
                  icon: 'none'
                })
              }}>
              <Text className="text-white text-center font-medium">确认完成交接</Text>
            </View>
            <Text className="text-xs text-muted-foreground text-center mt-2">请确保所有交接事项已完成</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default WorkHandover
