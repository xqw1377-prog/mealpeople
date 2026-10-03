/**
 * 权限管理Hook
 * 用于检查用户对模块的访问权限
 */

import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'

export interface ModulePermission {
  module_key: string
  module_name: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
}

export interface UsePermissionResult {
  permissions: ModulePermission[]
  loading: boolean
  hasPermission: (moduleKey: string, action?: 'view' | 'create' | 'edit' | 'delete') => boolean
  canView: (moduleKey: string) => boolean
  canCreate: (moduleKey: string) => boolean
  canEdit: (moduleKey: string) => boolean
  canDelete: (moduleKey: string) => boolean
  refreshPermissions: () => Promise<void>
}

/**
 * 使用权限Hook
 */
export function usePermission(): UsePermissionResult {
  const {user} = useAuth()
  const [permissions, setPermissions] = useState<ModulePermission[]>([])
  const [loading, setLoading] = useState(true)

  // 加载用户权限
  const loadPermissions = useCallback(async () => {
    if (!user?.id) {
      setPermissions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 1. 获取用户角色
      const {data: profile} = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()

      if (!profile) {
        setPermissions([])
        return
      }

      const userRole = profile.role

      // 2. 获取所有系统模块
      const {data: modules} = await supabase
        .from('system_modules')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', {ascending: true})

      if (!modules || modules.length === 0) {
        setPermissions([])
        return
      }

      // 3. 获取角色权限
      const {data: rolePermissions} = await supabase.from('role_module_permissions').select('*').eq('role', userRole)

      // 4. 获取用户个性化权限
      const {data: userPermissions} = await supabase.from('user_module_permissions').select('*').eq('user_id', user.id)

      // 5. 合并权限（用户权限覆盖角色权限）
      const permissionMap = new Map<string, ModulePermission>()

      for (const module of modules) {
        // 先从角色权限获取
        const rolePermission = rolePermissions?.find((p) => p.module_id === module.id)

        // 再从用户权限获取（覆盖角色权限）
        const userPermission = userPermissions?.find((p) => p.module_id === module.id)

        const finalPermission: ModulePermission = {
          module_key: module.module_key,
          module_name: module.module_name,
          can_view: userPermission?.can_view ?? rolePermission?.can_view ?? false,
          can_create: userPermission?.can_create ?? rolePermission?.can_create ?? false,
          can_edit: userPermission?.can_edit ?? rolePermission?.can_edit ?? false,
          can_delete: userPermission?.can_delete ?? rolePermission?.can_delete ?? false
        }

        permissionMap.set(module.module_key, finalPermission)
      }

      setPermissions(Array.from(permissionMap.values()))
    } catch (error) {
      console.error('加载权限失败:', error)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // 初始加载
  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  // 检查是否有权限
  const hasPermission = useCallback(
    (moduleKey: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view'): boolean => {
      const permission = permissions.find((p) => p.module_key === moduleKey)
      if (!permission) return false

      switch (action) {
        case 'view':
          return permission.can_view
        case 'create':
          return permission.can_create
        case 'edit':
          return permission.can_edit
        case 'delete':
          return permission.can_delete
        default:
          return false
      }
    },
    [permissions]
  )

  // 快捷方法
  const canView = useCallback((moduleKey: string) => hasPermission(moduleKey, 'view'), [hasPermission])
  const canCreate = useCallback((moduleKey: string) => hasPermission(moduleKey, 'create'), [hasPermission])
  const canEdit = useCallback((moduleKey: string) => hasPermission(moduleKey, 'edit'), [hasPermission])
  const canDelete = useCallback((moduleKey: string) => hasPermission(moduleKey, 'delete'), [hasPermission])

  return {
    permissions,
    loading,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    refreshPermissions: loadPermissions
  }
}

/**
 * 权限守卫组件
 */
export interface PermissionGuardProps {
  moduleKey: string
  action?: 'view' | 'create' | 'edit' | 'delete'
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({moduleKey, action = 'view', fallback = null, children}: PermissionGuardProps) {
  const {hasPermission, loading} = usePermission()

  if (loading) {
    return null
  }

  if (!hasPermission(moduleKey, action)) {
    return fallback as React.ReactElement
  }

  return children as React.ReactElement
}
