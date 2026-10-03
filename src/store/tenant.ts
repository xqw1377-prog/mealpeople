import {create} from 'zustand'
import type {Profile, Store, Tenant} from '@/db/types'

interface TenantState {
  currentTenant: Tenant | null
  currentUser: Profile | null
  currentStore: Store | null // 新增：当前选择的门店
  setCurrentTenant: (tenant: Tenant | null) => void
  setCurrentUser: (user: Profile | null) => void
  setCurrentStore: (store: Store | null) => void // 新增：设置当前门店
  clearTenantContext: () => void
}

// 修复：使用正确的 zustand 创建方式，避免在 Taro 环境中出现 dispatcher 错误
export const useTenantStore = create<TenantState>((set) => ({
  currentTenant: null,
  currentUser: null,
  currentStore: null, // 新增：初始化为null
  setCurrentTenant: (tenant) => set({currentTenant: tenant}),
  setCurrentUser: (user) => set({currentUser: user}),
  setCurrentStore: (store) => set({currentStore: store}), // 新增：设置门店方法
  clearTenantContext: () => set({currentTenant: null, currentUser: null, currentStore: null}) // 清空时也清空门店
}))
