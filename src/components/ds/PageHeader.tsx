/**
 * 工作旅途 DS · PageHeader 页头（首页沉浸式 / 内页标准两种形态）
 */
import {Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import type {ReactNode} from 'react'

/** 内页标准头：返回 + 标题 + 右侧动作（配合 navigationStyle custom 使用） */
export function NavBar(props: {title: string; right?: ReactNode; onBack?: () => void}) {
  const {title, right, onBack} = props
  const back = () => {
    if (onBack) return onBack()
    const pages = Taro.getCurrentPages()
    if (pages.length > 1) Taro.navigateBack()
    else Taro.switchTab({url: '/pages/index/index'})
  }
  return (
    <View className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
      <View className="flex items-center h-11 px-3">
        <View hoverClass="opacity-60" className="p-2 -ml-1" onClick={back}>
          <Text className="i-mdi-chevron-left text-2xl text-gray-800" />
        </View>
        <Text className="flex-1 text-center text-base font-semibold text-gray-900 truncate">{title}</Text>
        <View className="min-w-8 flex justify-end">{right}</View>
      </View>
    </View>
  )
}

/** 首页沉浸式头：品牌问候 + 角色徽标（不用返回键） */
export function HeroHeader(props: {greeting: string; subtitle?: string; roleName?: string; right?: ReactNode}) {
  const {greeting, subtitle, roleName, right} = props
  return (
    <View className="relative overflow-hidden bg-primary-500 px-4 pt-10 pb-14">
      <View className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
      <View className="absolute top-6 right-16 w-20 h-20 rounded-full bg-white/5" />
      <View className="relative flex items-start justify-between">
        <View>
          <View className="flex items-center gap-2">
            <Text className="text-lg font-bold text-white">{greeting}</Text>
            {roleName && <Text className="px-2 py-0.5 rounded-full bg-white/20 text-2xs text-white">{roleName}</Text>}
          </View>
          {subtitle && <Text className="mt-1 text-xs text-white/80">{subtitle}</Text>}
        </View>
        {right}
      </View>
    </View>
  )
}
