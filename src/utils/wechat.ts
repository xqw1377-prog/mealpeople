// 微信相关工具函数
import Taro from '@tarojs/taro'

/**
 * 微信用户信息
 */
export interface WechatUserInfo {
  openid: string
  unionid?: string
  nickName?: string
  avatarUrl?: string
}

/**
 * 获取微信用户信息
 * 注意：此功能仅在微信小程序环境中可用
 */
export async function getWechatUserInfo(): Promise<WechatUserInfo | null> {
  try {
    // 检查是否在微信小程序环境
    if (Taro.getEnv() !== 'WEAPP') {
      console.log('⚠️ 不在微信小程序环境，无法获取微信用户信息')
      return null
    }

    // 调用微信登录API
    console.log('🔑 开始获取微信用户信息...')
    const loginRes = await Taro.login()
    console.log('🔑 微信登录结果:', loginRes)

    if (!loginRes.code) {
      console.error('❌ 获取微信登录code失败')
      return null
    }

    // 注意：实际项目中，需要将 code 发送到后端服务器
    // 后端服务器使用 code 换取 openid 和 session_key
    // 这里我们暂时返回一个模拟的 openid
    // 在生产环境中，需要实现后端接口来完成这个过程

    console.log('⚠️ 警告：当前使用模拟的微信用户信息，生产环境需要实现后端接口')

    // 模拟返回（生产环境需要替换为真实的后端接口调用）
    return {
      openid: `mock_openid_${loginRes.code.substring(0, 10)}`,
      unionid: undefined,
      nickName: '微信用户',
      avatarUrl: undefined
    }
  } catch (error) {
    console.error('❌ 获取微信用户信息失败:', error)
    return null
  }
}

/**
 * 检查是否在微信小程序环境
 */
export function isWechatMiniProgram(): boolean {
  return Taro.getEnv() === 'WEAPP'
}
