/**
 * 设置页面
 * 用户个人设置和系统配置
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useTenantStore} from '@/store/tenant'

// 设置项组件
interface SettingItemProps {
  title: string
  value?: string
  icon: string
  onClick?: () => void
  showArrow?: boolean
}

const SettingItem: React.FC<SettingItemProps> = ({title, value, icon, onClick, showArrow = true}) => {
  return (
    <View
      className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 mb-3 flex items-center active:opacity-80 transition-all border border-border"
      onClick={onClick}>
      <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
        <View className={`${icon} text-xl text-foreground`} />
      </View>
      <Text className="text-base text-foreground font-medium flex-1">{title}</Text>
      {value && (
        <View className="bg-blue-100 px-3 py-1 rounded-full mr-2">
          <Text className="text-xs text-foreground font-bold">{value}</Text>
        </View>
      )}
      {showArrow && <View className="i-mdi-chevron-right text-2xl text-muted-foreground" />}
    </View>
  )
}

export default function Settings() {
  const {logout} = useAuth({guard: true})
  const clearTenantContext = useTenantStore((state) => state.clearTenantContext)

  // 退出登录
  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          clearTenantContext()
          logout()
        }
      }
    })
  }

  // 清除缓存
  const handleClearCache = () => {
    Taro.showModal({
      title: '确认清除',
      content: '确定要清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.clearStorage({
            success: () => {
              Taro.showToast({
                title: '清除成功',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  }

  // 关于我们
  const handleAbout = () => {
    Taro.navigateTo({url: '/pages/about/index'})
  }

  // 用户协议
  const handleUserAgreement = () => {
    Taro.navigateTo({url: '/pages/user-agreement/index'})
  }

  // 隐私政策
  const handlePrivacyPolicy = () => {
    Taro.navigateTo({url: '/pages/privacy-policy/index'})
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <View className="flex items-center gap-3 mb-2">
              <View className="w-12 h-12 rounded-lg bg-white backdrop-blur flex items-center justify-center">
                <View className="i-mdi-cog text-3xl text-blue-600" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-white">设置</Text>
                <Text className="text-sm text-white/80">个人设置和系统配置</Text>
              </View>
            </View>
          </View>

          {/* 账号设置 */}
          <View className="mb-4">
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
              <View className="flex items-center gap-3 mb-4">
                <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-account-cog text-2xl text-blue-600" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-foreground">账号设置</Text>
                  <Text className="text-xs text-muted-foreground">管理您的账号信息</Text>
                </View>
              </View>
              <SettingItem
                title="修改密码"
                icon="i-mdi-lock-reset"
                onClick={() =>
                  Taro.showToast({
                    title: '功能开发中',
                    icon: 'none'
                  })
                }
              />
              <SettingItem
                title="绑定微信"
                icon="i-mdi-wechat"
                value="未绑定"
                onClick={() =>
                  Taro.showToast({
                    title: '功能开发中',
                    icon: 'none'
                  })
                }
              />
              <SettingItem
                title="绑定手机"
                icon="i-mdi-cellphone"
                value="138****8888"
                onClick={() =>
                  Taro.showToast({
                    title: '功能开发中',
                    icon: 'none'
                  })
                }
              />
              <SettingItem
                title="绑定邮箱"
                icon="i-mdi-email"
                value="未绑定"
                onClick={() =>
                  Taro.showToast({
                    title: '功能开发中',
                    icon: 'none'
                  })
                }
              />
            </View>
          </View>

          {/* 通知设置 */}
          <View className="mb-4">
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
              <View className="flex items-center gap-3 mb-4">
                <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-bell text-2xl text-blue-600" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-foreground">通知设置</Text>
                  <Text className="text-xs text-muted-foreground">管理消息提醒</Text>
                </View>
              </View>
              <SettingItem
                title="消息通知"
                icon="i-mdi-bell"
                value="已开启"
                onClick={() =>
                  Taro.showToast({
                    title: '功能开发中',
                    icon: 'none'
                  })
                }
              />
              <SettingItem
                title="排班提醒"
                icon="i-mdi-calendar-alert"
                value="已开启"
                onClick={() =>
                  Taro.showToast({
                    title: '功能开发中',
                    icon: 'none'
                  })
                }
              />
              <SettingItem
                title="考勤提醒"
                icon="i-mdi-clock-alert"
                value="已开启"
                onClick={() =>
                  Taro.showToast({
                    title: '功能开发中',
                    icon: 'none'
                  })
                }
              />
            </View>
          </View>

          {/* 隐私设置 */}
          <View className="mb-4">
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
              <View className="flex items-center gap-3 mb-4">
                <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-shield-check text-2xl text-blue-600" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-foreground">隐私设置</Text>
                  <Text className="text-xs text-muted-foreground">保护您的隐私</Text>
                </View>
              </View>
              <SettingItem
                title="个人信息可见性"
                icon="i-mdi-eye"
                value="仅自己"
                onClick={() =>
                  Taro.showToast({
                    title: '功能开发中',
                    icon: 'none'
                  })
                }
              />
              <SettingItem
                title="工作记录可见性"
                icon="i-mdi-file-eye"
                value="团队可见"
                onClick={() =>
                  Taro.showToast({
                    title: '功能开发中',
                    icon: 'none'
                  })
                }
              />
            </View>
          </View>

          {/* 系统设置 */}
          <View className="mb-4">
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
              <View className="flex items-center gap-3 mb-4">
                <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-cog text-2xl text-blue-600" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-foreground">系统设置</Text>
                  <Text className="text-xs text-muted-foreground">系统相关配置</Text>
                </View>
              </View>
              <SettingItem
                title="语言设置"
                icon="i-mdi-translate"
                value="简体中文"
                onClick={() =>
                  Taro.showToast({
                    title: '功能开发中',
                    icon: 'none'
                  })
                }
              />
              <SettingItem title="清除缓存" icon="i-mdi-delete-sweep" onClick={handleClearCache} />
              <SettingItem
                title="检查更新"
                icon="i-mdi-update"
                value="v1.0.0"
                onClick={() =>
                  Taro.showToast({
                    title: '已是最新版本',
                    icon: 'success'
                  })
                }
              />
            </View>
          </View>

          {/* 关于 */}
          <View className="mb-4">
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
              <View className="flex items-center gap-3 mb-4">
                <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-information text-2xl text-blue-600" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-foreground">关于</Text>
                  <Text className="text-xs text-muted-foreground">了解更多信息</Text>
                </View>
              </View>
              <SettingItem title="关于我们" icon="i-mdi-information" onClick={handleAbout} />
              <SettingItem title="用户协议" icon="i-mdi-file-document" onClick={handleUserAgreement} />
              <SettingItem title="隐私政策" icon="i-mdi-shield-check" onClick={handlePrivacyPolicy} />
              <SettingItem
                title="意见反馈"
                icon="i-mdi-message-text"
                onClick={() =>
                  Taro.showToast({
                    title: '功能开发中',
                    icon: 'none'
                  })
                }
              />
            </View>
          </View>

          {/* 退出登录 */}
          <View className="mb-20">
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded-xl break-keep text-base active:opacity-90 transition-all"
              size="default"
              onClick={handleLogout}>
              <View className="flex items-center justify-center gap-2">
                <View className="i-mdi-logout text-xl text-foreground" />
                <Text className="text-foreground font-bold">退出登录</Text>
              </View>
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
