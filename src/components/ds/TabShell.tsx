/**
 * 工作旅途 DS · TabHero + StatsStrip（Tab 页壳层模式）
 * P1-C：收敛四个 Tab 各自手写的品牌头与悬浮统计条，实现真正 DS 复用（Gate 3）
 *
 * 用法：
 * <TabHero title='工作记录' subtitle='随手记录，看见成长' right={<Text>…</Text>} />
 * <StatsStrip items={[{value: 3, label: '今日'}, …]} />
 */
import {Text, View} from '@tarojs/components'
import type {ReactNode} from 'react'

/** Tab 品牌头：primary Hero + 装饰圆 + 标题/副题/右侧动作 */
export function TabHero(props: {title: string; subtitle?: string; right?: ReactNode; children?: ReactNode}) {
  const {title, subtitle, right, children} = props
  return (
    <View className="relative overflow-hidden bg-primary-500 px-4 pt-10 pb-14">
      <View className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10" />
      <View className="relative flex items-center justify-between">
        <View>
          <Text className="text-xl font-bold text-white">{title}</Text>
          {subtitle && <Text className="mt-1 block text-xs text-white/75">{subtitle}</Text>}
        </View>
        {right}
      </View>
      {children}
    </View>
  )
}

/** 统计条：叠在 Hero 底沿的白卡（-mt-9），等分列 + 可选分隔线 */
export interface StatItem {
  value: ReactNode
  label: string
  /** 数值强调色（如 text-success-600），默认灰-900 */
  valueClass?: string
  onClick?: () => void
}

export function StatsStrip(props: {items: StatItem[]; className?: string}) {
  const {items, className = ''} = props
  return (
    <View className={`px-4 -mt-9 relative z-10 ${className}`}>
      <View
        className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] grid py-4"
        style={{gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`}}>
        {items.map((it, i) => (
          <View
            key={it.label}
            className={`text-center ${i > 0 ? 'border-l border-gray-100' : ''}`}
            hoverClass={it.onClick ? 'opacity-60' : ''}
            onClick={it.onClick}>
            <Text className={`text-xl font-bold ${it.valueClass || 'text-gray-900'}`}>{it.value}</Text>
            <Text className="mt-0.5 block text-2xs text-gray-400">{it.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

/** 页内错误横幅：用户可见 Error + 重试（Gate 4） */
export function ErrorBanner(props: {message?: string; onRetry: () => void}) {
  const {message = '加载失败', onRetry} = props
  return (
    <View className="mx-4 mt-3 flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-danger-50 border border-danger-500/20">
      <Text className="i-mdi-alert-circle-outline text-base text-danger-500" />
      <Text className="flex-1 text-xs text-danger-600">{message}</Text>
      <View className="px-3 py-1.5 rounded-full bg-danger-500 text-white" hoverClass="opacity-80" onClick={onRetry}>
        <Text className="text-2xs font-medium">重试</Text>
      </View>
    </View>
  )
}
