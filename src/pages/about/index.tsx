/**
 * 关于我们页面
 * 展示应用信息和公司介绍
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'

export default function About() {
  // 联系我们
  const handleContact = () => {
    Taro.showModal({
      title: '联系我们',
      content: '客服电话：400-123-4567\n邮箱：support@canshijian.com',
      showCancel: false
    })
  }

  // 访问官网
  const handleVisitWebsite = () => {
    Taro.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4">
          {/* Logo和名称 */}
          <View className="bg-white rounded-lg p-8 border-2 border-gray-200 mb-4 border border-border text-center">
            <View className="w-24 h-24 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <View className="i-mdi-food text-6xl text-blue-600" />
            </View>
            <Text className="text-2xl font-bold text-foreground mb-2">餐时间工作台</Text>
            <Text className="text-sm text-muted-foreground mb-4">智能人力成本管控助手</Text>
            <View className="bg-blue-100 px-4 py-2 rounded-full inline-block">
              <Text className="text-xs text-foreground font-bold">版本 v1.0.0</Text>
            </View>
          </View>

          {/* 产品介绍 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 border border-border">
            <View className="flex items-center gap-3 mb-4">
              <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <View className="i-mdi-information text-2xl text-blue-600" />
              </View>
              <View>
                <Text className="text-lg font-bold text-foreground">产品介绍</Text>
                <Text className="text-xs text-muted-foreground">了解我们的产品</Text>
              </View>
            </View>
            <Text className="text-sm text-foreground leading-relaxed">
              餐时间工作台是一款专为餐饮行业打造的智能人力成本管控助手。基于营收-效能标准的多租户智能办公管理工具，支持多租户独立管理和数据完全隔离，帮助企业管理者实现科学排班和成本控制，支持多店连锁管理和智能化运营决策。
            </Text>
          </View>

          {/* 核心功能 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 border border-border">
            <View className="flex items-center gap-3 mb-4">
              <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <View className="i-mdi-star text-2xl text-blue-600" />
              </View>
              <View>
                <Text className="text-lg font-bold text-foreground">核心功能</Text>
                <Text className="text-xs text-muted-foreground">强大的功能体系</Text>
              </View>
            </View>
            <View className="space-y-3">
              <View className="flex items-start gap-3 bg-blue-100 rounded-lg p-4 border border-border">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <View className="i-mdi-check-circle text-lg text-blue-600" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground mb-1">入职管理</Text>
                  <Text className="text-xs text-muted-foreground">
                    完整的入职流程管理，包括面试、培训、试用期等环节
                  </Text>
                </View>
              </View>
              <View className="flex items-start gap-3 bg-blue-100 rounded-lg p-4 border border-border">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <View className="i-mdi-check-circle text-lg text-blue-600" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground mb-1">在职管理</Text>
                  <Text className="text-xs text-muted-foreground">考勤、请假、加班、绩效、薪酬等全方位管理</Text>
                </View>
              </View>
              <View className="flex items-start gap-3 bg-blue-100 rounded-lg p-4 border border-border">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <View className="i-mdi-check-circle text-lg text-blue-600" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground mb-1">离职管理</Text>
                  <Text className="text-xs text-muted-foreground">规范的离职流程，包括申请、审批、交接、面谈等</Text>
                </View>
              </View>
              <View className="flex items-start gap-3 bg-blue-100 rounded-lg p-4 border border-border">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <View className="i-mdi-check-circle text-lg text-blue-600" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground mb-1">工作记录</Text>
                  <Text className="text-xs text-muted-foreground">智能工作日志系统，记录成长轨迹</Text>
                </View>
              </View>
              <View className="flex items-start gap-3 bg-blue-100 rounded-lg p-4 border border-cyan-200">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <View className="i-mdi-check-circle text-lg text-blue-600" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground mb-1">多租户管理</Text>
                  <Text className="text-xs text-muted-foreground">支持多租户独立管理，数据完全隔离</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 设计理念 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 border border-border">
            <View className="flex items-center gap-3 mb-4">
              <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <View className="i-mdi-lightbulb text-2xl text-blue-600" />
              </View>
              <View>
                <Text className="text-lg font-bold text-foreground">设计理念</Text>
                <Text className="text-xs text-muted-foreground">简单易用的设计哲学</Text>
              </View>
            </View>
            <View className="grid grid-cols-3 gap-3">
              <View className="bg-blue-100 rounded-lg p-4 text-center border border-border">
                <View className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <View className="i-mdi-school text-2xl text-blue-600" />
                </View>
                <Text className="text-sm font-bold text-foreground">容易学</Text>
              </View>
              <View className="bg-blue-100 rounded-lg p-4 text-center border border-border">
                <View className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <View className="i-mdi-hand-okay text-2xl text-blue-600" />
                </View>
                <Text className="text-sm font-bold text-foreground">容易做</Text>
              </View>
              <View className="bg-blue-100 rounded-lg p-4 text-center border border-border">
                <View className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <View className="i-mdi-cog text-2xl text-blue-600" />
                </View>
                <Text className="text-sm font-bold text-foreground">容易管理</Text>
              </View>
            </View>
          </View>

          {/* 联系方式 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 border border-border">
            <View className="flex items-center gap-3 mb-4">
              <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <View className="i-mdi-phone text-2xl text-blue-600" />
              </View>
              <View>
                <Text className="text-lg font-bold text-foreground">联系我们</Text>
                <Text className="text-xs text-muted-foreground">随时为您服务</Text>
              </View>
            </View>
            <View className="space-y-3">
              <View className="flex items-center gap-3 bg-white rounded-lg p-3 border-2 border-gray-200">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-phone text-base text-blue-600" />
                </View>
                <Text className="text-sm text-foreground">客服电话：400-123-4567</Text>
              </View>
              <View className="flex items-center gap-3 bg-white rounded-lg p-3 border-2 border-gray-200">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-email text-base text-blue-600" />
                </View>
                <Text className="text-sm text-foreground">邮箱：support@canshijian.com</Text>
              </View>
              <View className="flex items-center gap-3 bg-white rounded-lg p-3 border-2 border-gray-200">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-web text-base text-blue-600" />
                </View>
                <Text className="text-sm text-foreground">官网：www.canshijian.com</Text>
              </View>
              <View className="flex items-center gap-3 bg-white rounded-lg p-3 border-2 border-gray-200">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-clock text-base text-blue-600" />
                </View>
                <Text className="text-sm text-foreground">工作时间：9:00-18:00</Text>
              </View>
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="flex items-center gap-3 mb-6">
            <Button
              className="flex-1 bg-white text-foreground py-4 rounded-xl break-keep text-base border-2 border-white"
              size="default"
              onClick={handleVisitWebsite}>
              访问官网
            </Button>
            <Button
              className="flex-1 bg-blue-100 text-white py-4 rounded-xl break-keep text-base"
              size="default"
              onClick={handleContact}>
              联系我们
            </Button>
          </View>

          {/* 版权信息 */}
          <View className="text-center mb-20">
            <Text className="text-xs text-white/80">© 2025 餐时间工作台</Text>
            <Text className="text-xs text-white/80 block mt-1">All Rights Reserved</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
