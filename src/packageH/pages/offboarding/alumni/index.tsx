/**
 * 校友网络页面
 * 离职员工的校友网络和联系平台
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useState} from 'react'

const AlumniNetwork: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [_loading, _setLoading] = useState(false)

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 校友活动
  const activities = [
    {
      id: 1,
      title: '2024年春季校友聚会',
      date: '2024-04-15',
      location: '公司总部',
      participants: 45,
      status: 'upcoming'
    },
    {
      id: 2,
      title: '职业发展分享会',
      date: '2024-03-20',
      location: '线上会议',
      participants: 68,
      status: 'completed'
    },
    {
      id: 3,
      title: '校友年度聚会',
      date: '2023-12-30',
      location: '希尔顿酒店',
      participants: 120,
      status: 'completed'
    }
  ]

  // 校友福利
  const benefits = [
    {
      id: 1,
      title: '内推优先',
      description: '推荐优秀人才，享受内推奖励',
      icon: 'i-mdi-account-multiple-plus',
      color: 'text-muted-foreground',
      bgColor: 'bg-blue-100'
    },
    {
      id: 2,
      title: '职业咨询',
      description: '免费职业发展咨询服务',
      icon: 'i-mdi-account-tie',
      color: 'text-muted-foreground',
      bgColor: 'bg-blue-100'
    },
    {
      id: 3,
      title: '培训优惠',
      description: '公司培训课程优惠价格',
      icon: 'i-mdi-school',
      color: 'text-muted-foreground',
      bgColor: 'bg-blue-100'
    },
    {
      id: 4,
      title: '活动邀请',
      description: '定期举办校友活动',
      icon: 'i-mdi-calendar-star',
      color: 'text-muted-foreground',
      bgColor: 'bg-blue-100'
    }
  ]

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 space-y-4">
          {/* 页面标题 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center justify-between mb-4">
              <View className="flex items-center">
                <View className="i-mdi-account-group text-3xl text-blue-600 mr-3" />
                <Text className="text-2xl font-bold text-foreground">校友网络</Text>
              </View>
              <View className="bg-muted p-2 rounded-lg active:opacity-70" onClick={handleBack}>
                <View className="i-mdi-arrow-left text-xl text-foreground" />
              </View>
            </View>
            <Text className="text-sm text-muted-foreground">加入校友网络，保持联系，共同成长</Text>
          </View>

          {/* 欢迎信息 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-4">
              <View className="i-mdi-hand-wave text-2xl text-blue-600 mr-2" />
              <Text className="text-lg font-bold text-foreground">欢迎加入校友网络</Text>
            </View>
            <View className="p-4 bg-blue-100 rounded-lg">
              <Text className="text-sm text-foreground leading-relaxed mb-3">
                感谢您曾经为公司做出的贡献！虽然您已离开，但我们的联系不会中断。欢迎加入校友网络，与老同事保持联系，分享职业发展经验。
              </Text>
              <View className="grid grid-cols-3 gap-3">
                <View className="text-center p-3 bg-white rounded-lg">
                  <Text className="text-2xl font-bold text-muted-foreground">500+</Text>
                  <Text className="text-xs text-muted-foreground mt-1">校友成员</Text>
                </View>
                <View className="text-center p-3 bg-white rounded-lg">
                  <Text className="text-2xl font-bold text-muted-foreground">50+</Text>
                  <Text className="text-xs text-muted-foreground mt-1">年度活动</Text>
                </View>
                <View className="text-center p-3 bg-white rounded-lg">
                  <Text className="text-2xl font-bold text-muted-foreground">100+</Text>
                  <Text className="text-xs text-muted-foreground mt-1">合作机会</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 校友福利 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-4">
              <View className="i-mdi-gift text-2xl text-blue-600 mr-2" />
              <Text className="text-lg font-bold text-foreground">校友福利</Text>
            </View>
            <View className="grid grid-cols-2 gap-3">
              {benefits.map((benefit) => (
                <View key={benefit.id} className={`p-4 ${benefit.bgColor} rounded-lg`}>
                  <View className={`${benefit.icon} text-3xl ${benefit.color} mb-2`} />
                  <Text className="text-sm font-bold text-foreground mb-1">{benefit.title}</Text>
                  <Text className="text-xs text-muted-foreground">{benefit.description}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 校友活动 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-4">
              <View className="i-mdi-calendar-star text-2xl text-blue-600 mr-2" />
              <Text className="text-lg font-bold text-foreground">校友活动</Text>
            </View>
            <View className="space-y-3">
              {activities.map((activity) => (
                <View key={activity.id} className="p-4 bg-gray-50/30 rounded-lg">
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-base font-bold text-foreground">{activity.title}</Text>
                    <View
                      className={`px-3 py-1 rounded-full ${
                        activity.status === 'upcoming' ? 'bg-green-100' : 'bg-gray-50'
                      }`}>
                      <Text
                        className={`text-xs font-medium ${
                          activity.status === 'upcoming' ? 'text-muted-foreground' : 'text-muted-foreground'
                        }`}>
                        {activity.status === 'upcoming' ? '即将举行' : '已结束'}
                      </Text>
                    </View>
                  </View>
                  <View className="space-y-1">
                    <View className="flex items-center">
                      <View className="i-mdi-calendar text-sm text-muted-foreground mr-2" />
                      <Text className="text-sm text-muted-foreground">时间：{activity.date}</Text>
                    </View>
                    <View className="flex items-center">
                      <View className="i-mdi-map-marker text-sm text-muted-foreground mr-2" />
                      <Text className="text-sm text-muted-foreground">地点：{activity.location}</Text>
                    </View>
                    <View className="flex items-center">
                      <View className="i-mdi-account-multiple text-sm text-muted-foreground mr-2" />
                      <Text className="text-sm text-muted-foreground">参与人数：{activity.participants}人</Text>
                    </View>
                  </View>
                  {activity.status === 'upcoming' && (
                    <View
                      className="mt-3 bg-green-500 text-white py-2 px-4 rounded-lg active:opacity-80"
                      onClick={() => {
                        Taro.showToast({
                          title: '报名功能开发中',
                          icon: 'none'
                        })
                      }}>
                      <Text className="text-white text-center text-sm font-medium">立即报名</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* 联系方式 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-4">
              <View className="i-mdi-phone text-2xl text-blue-600 mr-2" />
              <Text className="text-lg font-bold text-foreground">联系我们</Text>
            </View>
            <View className="space-y-3">
              <View className="p-4 bg-blue-100 rounded-lg">
                <View className="flex items-center mb-2">
                  <View className="i-mdi-wechat text-xl text-muted-foreground mr-2" />
                  <Text className="text-sm font-bold text-muted-foreground">微信群</Text>
                </View>
                <Text className="text-xs text-muted-foreground">扫码加入校友微信群</Text>
              </View>
              <View className="p-4 bg-blue-100 rounded-lg">
                <View className="flex items-center mb-2">
                  <View className="i-mdi-email text-xl text-muted-foreground mr-2" />
                  <Text className="text-sm font-bold text-muted-foreground">邮箱</Text>
                </View>
                <Text className="text-xs text-muted-foreground">alumni@company.com</Text>
              </View>
              <View className="p-4 bg-blue-100 rounded-lg">
                <View className="flex items-center mb-2">
                  <View className="i-mdi-phone text-xl text-muted-foreground mr-2" />
                  <Text className="text-sm font-bold text-muted-foreground">电话</Text>
                </View>
                <Text className="text-xs text-muted-foreground">010-12345678</Text>
              </View>
            </View>
          </View>

          {/* 加入校友网络 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View
              className="bg-green-500 text-white p-4 rounded-lg active:opacity-80"
              onClick={() => {
                Taro.showToast({
                  title: '加入功能开发中',
                  icon: 'none'
                })
              }}>
              <Text className="text-white text-center font-medium">立即加入校友网络</Text>
            </View>
            <Text className="text-xs text-muted-foreground text-center mt-2">加入后可参与所有校友活动</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default AlumniNetwork
