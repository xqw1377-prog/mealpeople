import {createClient} from '@supabase/supabase-js'
import Taro, {showToast} from '@tarojs/taro'

const supabaseUrl: string = process.env.TARO_APP_SUPABASE_URL || ''
const supabaseAnonKey: string = process.env.TARO_APP_SUPABASE_ANON_KEY || 'TOKEN'
const appId: string = process.env.TARO_APP_APP_ID || 'default-app'

// 验证环境变量
if (!supabaseUrl) {
  console.error('❌ TARO_APP_SUPABASE_URL 环境变量未设置')
}
if (!supabaseAnonKey || supabaseAnonKey === 'TOKEN') {
  console.error('❌ TARO_APP_SUPABASE_ANON_KEY 环境变量未设置')
}

console.log('🔧 Supabase 配置:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey && supabaseAnonKey !== 'TOKEN',
  appId
})

let noticed = false
export const customFetch: typeof fetch = async (url: string, options: RequestInit) => {
  // H5 运行时按需打包不含 Taro.request（调用会抛 "_.request is not a function"），
  // 浏览器环境直接走原生 fetch；小程序端保持 Taro.request 适配不变
  if (process.env.TARO_ENV === 'h5') {
    return fetch(url, options)
  }

  let headers: HeadersInit = options.headers || {}
  const {method = 'GET', body} = options

  if (options.headers instanceof Map) {
    headers = Object.fromEntries(options.headers)
  }

  const res = await Taro.request({
    url,
    method: method as keyof Taro.request.Method,
    header: headers,
    data: body,
    responseType: 'text'
  })

  // 全局启停提示
  if (res.statusCode > 300 && res.data?.code === 'SupabaseNotReady' && !noticed) {
    const tip = res.data.message || res.data.msg || '服务端报错'
    noticed = true
    showToast({
      title: tip,
      icon: 'error',
      duration: 5000
    })
  }

  return {
    ok: res.statusCode >= 200 && res.statusCode < 300,
    status: res.statusCode,
    json: async () => res.data,
    text: async () => JSON.stringify(res.data),
    data: res.data, // 兼容小程序的返回格式
    headers: {
      get: (key: string) => res.header?.[key]
    }
  } as unknown as Response
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch
  },
  auth: {
    storageKey: `${appId}-auth-token`
  }
})
