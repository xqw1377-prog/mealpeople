/**
 * 平台检测工具
 * 用于判断当前运行环境（移动端/WEB端）
 */

import Taro from '@tarojs/taro'

// 平台类型
export type PlatformType = 'mobile' | 'web'

/**
 * 获取当前平台类型
 */
export function getCurrentPlatform(): PlatformType {
  const env = Taro.getEnv()

  // 微信小程序环境 = 移动端
  if (env === Taro.ENV_TYPE.WEAPP) {
    return 'mobile'
  }

  // H5环境需要进一步判断
  if (env === Taro.ENV_TYPE.WEB) {
    // 检查屏幕宽度
    const screenWidth = window.innerWidth

    // 小于768px认为是移动端
    if (screenWidth < 768) {
      return 'mobile'
    }

    // 检查User Agent
    const ua = navigator.userAgent.toLowerCase()
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(ua) || ('ontouchstart' in window && screenWidth < 1024)

    return isMobile ? 'mobile' : 'web'
  }

  // 默认返回移动端
  return 'mobile'
}

/**
 * 判断是否为移动端
 */
export function isMobile(): boolean {
  return getCurrentPlatform() === 'mobile'
}

/**
 * 判断是否为WEB端
 */
export function isWeb(): boolean {
  return getCurrentPlatform() === 'web'
}

/**
 * 判断是否为微信小程序
 */
export function isWeapp(): boolean {
  return Taro.getEnv() === Taro.ENV_TYPE.WEAPP
}

/**
 * 判断是否为H5
 */
export function isH5(): boolean {
  return Taro.getEnv() === Taro.ENV_TYPE.WEB
}

/**
 * 获取平台名称（用于显示）
 */
export function getPlatformName(): string {
  const platform = getCurrentPlatform()
  return platform === 'mobile' ? '移动端' : 'WEB端'
}

/**
 * 根据平台返回不同的值
 */
export function platformValue<T>(mobileValue: T, webValue: T): T {
  return getCurrentPlatform() === 'mobile' ? mobileValue : webValue
}
