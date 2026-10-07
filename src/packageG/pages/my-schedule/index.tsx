/**
 * P2-S1-A：本页为 REDIRECT 壳。
 * 「我的班次」平行实现已归一至 /packageB/pages/scheduling/index（schedules SSOT）；
 * 旧入口（历史链接/收藏）重定向，不再持有独立数据源。
 */
import {View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'

export default function MyScheduleRedirect() {
  useDidShow(() => {
    Taro.redirectTo({url: '/packageB/pages/scheduling/index'})
  })
  return <View />
}
