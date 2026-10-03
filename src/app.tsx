/**
 * @file Taro application entry file
 */

import {AuthProvider} from 'miaoda-auth-taro'
import type React from 'react'
import type {PropsWithChildren} from 'react'
import {supabase} from '@/client/supabase'

import './app.scss'

const App: React.FC<PropsWithChildren<any>> = ({children}: PropsWithChildren<any>) => {
  console.log('🚀 App 组件渲染')
  console.log('🔧 Supabase client:', supabase ? '✅ 已初始化' : '❌ 未初始化')

  // 无论 supabase client 是否初始化，都需要提供 AuthProvider
  // 这样可以确保 React Context 正确设置，避免 hooks 调用错误
  return <AuthProvider client={supabase}>{children}</AuthProvider>
}

export default App
