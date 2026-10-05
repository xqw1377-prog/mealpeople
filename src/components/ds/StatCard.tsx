/**
 * 工作旅途 DS · StatCard 数据卡（看板/首页统计位）
 */
import {Text, View} from '@tarojs/components'

export function StatCard(props: {
  label: string
  value: string | number
  unit?: string
  icon?: string
  hint?: string
  tone?: 'primary' | 'success' | 'info' | 'warning'
  onClick?: () => void
}) {
  const {label, value, unit, icon = 'i-mdi-chart-line', hint, tone = 'primary', onClick} = props
  const toneMap = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    info: 'bg-info-50 text-info-600',
    warning: 'bg-warning-50 text-warning-600'
  } as const
  return (
    <View
      className="bg-white rounded-xl p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      hoverClass={onClick ? 'shadow-[0_4px_12px_rgba(0,0,0,0.08)]' : ''}
      onClick={onClick}>
      <View className="flex items-center">
        <View className={`w-8 h-8 rounded-lg flex items-center justify-center ${toneMap[tone]}`}>
          <Text className={`${icon} text-base`} />
        </View>
        <Text className="ml-2 text-xs text-gray-500">{label}</Text>
      </View>
      <View className="mt-2 flex items-baseline">
        <Text className="text-2xl font-bold text-gray-900">{value}</Text>
        {unit && <Text className="ml-1 text-xs text-gray-400">{unit}</Text>}
      </View>
      {hint && <Text className="mt-0.5 text-2xs text-gray-400">{hint}</Text>}
    </View>
  )
}
