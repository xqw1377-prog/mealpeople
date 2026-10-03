/**
 * 工作班次调试页面
 * 用于诊断工作班次创建失败的问题
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'
import {createWorkShift} from '@/db/api-work-shifts'
import {useTenantStore} from '@/store/tenant'

export default function DebugWorkShifts() {
  const {user} = useAuth({guard: true})
  // 使用 selector 方式获取 store 状态
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [testing, setTesting] = useState(false)

  const loadDebugInfo = useCallback(async () => {
    if (!user || !currentTenant) return

    try {
      const info: any = {}

      // 1. 当前用户信息
      info.currentUser = {
        id: user.id,
        email: user.email
      }

      // 2. 当前租户信息
      info.currentTenant = {
        id: currentTenant.id,
        name: currentTenant.name // 修复：使用name而不是tenant_name
      }

      // 3. 查询profiles表
      const {data: profile} = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      info.profile = profile

      // 4. 查询tenant_members表
      const {data: members} = await supabase.from('tenant_members').select('*').eq('user_id', user.id)
      info.tenantMembers = members

      // 5. 测试权限函数
      const {data: permissionTest} = await supabase.rpc('is_tenant_admin_or_manager', {
        user_id: user.id,
        check_tenant_id: currentTenant.id
      })
      info.hasPermission = permissionTest

      // 6. 查询现有班次
      const {data: shifts, error: shiftsError} = await supabase
        .from('work_shifts')
        .select('*')
        .eq('tenant_id', currentTenant.id)
      info.existingShifts = shifts
      info.shiftsError = shiftsError

      setDebugInfo(info)
    } catch (error) {
      console.error('加载调试信息失败:', error)
      setDebugInfo({error: String(error)})
    }
  }, [user, currentTenant])

  useEffect(() => {
    loadDebugInfo()
  }, [loadDebugInfo])

  // 测试创建班次
  const testCreateShift = async () => {
    if (!currentTenant || !user) {
      Taro.showToast({title: '缺少必要信息', icon: 'none'})
      return
    }

    setTesting(true)
    try {
      console.log('========== 开始测试创建班次 ==========')
      console.log('租户ID:', currentTenant.id)
      console.log('用户ID:', user.id)

      const testData = {
        tenant_id: currentTenant.id,
        shift_name: `测试班次_${Date.now()}`,
        shift_order: 999,
        start_time: '09:00',
        end_time: '17:00',
        work_hours: 8,
        time_periods: null
      }

      console.log('测试数据:', testData)

      const result = await createWorkShift(testData)

      console.log('创建结果:', result)

      if (result) {
        Taro.showModal({
          title: '✅ 创建成功',
          content: `班次ID: ${result.id}\n班次名称: ${result.shift_name}`,
          showCancel: false
        })
        await loadDebugInfo()
      } else {
        Taro.showModal({
          title: '❌ 创建失败',
          content: 'API返回null，请查看控制台日志获取详细错误信息',
          showCancel: false
        })
      }
    } catch (error) {
      console.error('测试创建失败:', error)
      Taro.showModal({
        title: '❌ 测试失败',
        content: String(error),
        showCancel: false
      })
    } finally {
      setTesting(false)
    }
  }

  // 测试直接插入（绕过API）
  const testDirectInsert = async () => {
    if (!currentTenant) {
      Taro.showToast({title: '缺少租户信息', icon: 'none'})
      return
    }

    setTesting(true)
    try {
      console.log('========== 测试直接插入 ==========')

      const testData = {
        tenant_id: currentTenant.id,
        shift_name: `直接插入测试_${Date.now()}`,
        shift_order: 998,
        start_time: '09:00:00',
        end_time: '17:00:00',
        work_hours: 8,
        is_active: true
      }

      console.log('插入数据:', testData)

      const {data, error} = await supabase.from('work_shifts').insert(testData).select().maybeSingle()

      console.log('插入结果 - data:', data)
      console.log('插入结果 - error:', error)

      if (error) {
        Taro.showModal({
          title: '❌ 直接插入失败',
          content: `错误代码: ${error.code}\n错误信息: ${error.message}\n\n${error.hint || ''}`,
          showCancel: false
        })
      } else if (data) {
        Taro.showModal({
          title: '✅ 直接插入成功',
          content: `班次ID: ${data.id}`,
          showCancel: false
        })
        await loadDebugInfo()
      } else {
        Taro.showModal({
          title: '⚠️ 无错误但返回null',
          content: '这通常意味着RLS策略阻止了数据返回',
          showCancel: false
        })
      }
    } catch (error) {
      console.error('直接插入测试失败:', error)
      Taro.showModal({
        title: '❌ 测试异常',
        content: String(error),
        showCancel: false
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          <Text className="text-xl font-bold text-foreground block mb-4">工作班次调试工具</Text>

          {/* 调试信息 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-base font-bold text-foreground mb-3 block">调试信息</Text>
            <View className="bg-muted rounded p-3">
              <Text className="text-xs text-foreground block break-all">{JSON.stringify(debugInfo, null, 2)}</Text>
            </View>
          </View>

          {/* 测试按钮 */}
          <View className="mb-4">
            <Button
              className="w-full bg-blue-100 text-white py-3 rounded break-keep text-base mb-3"
              size="default"
              onClick={testCreateShift}
              loading={testing}
              disabled={testing}>
              测试创建班次（通过API）
            </Button>

            <Button
              className="w-full bg-blue-100 text-white py-3 rounded break-keep text-base mb-3"
              size="default"
              onClick={testDirectInsert}
              loading={testing}
              disabled={testing}>
              测试直接插入（绕过API）
            </Button>

            <Button
              className="w-full bg-gray-500 text-blue-600 py-3 rounded break-keep text-base"
              size="default"
              onClick={loadDebugInfo}>
              刷新调试信息
            </Button>
          </View>

          {/* 说明 */}
          <View className="bg-blue-100 border border-yellow-200 rounded p-4">
            <Text className="text-sm font-bold text-yellow-800 mb-2 block">使用说明</Text>
            <Text className="text-xs text-yellow-700 block mb-1">1. 查看上方调试信息，确认用户和租户信息</Text>
            <Text className="text-xs text-yellow-700 block mb-1">2. 点击"测试创建班次"按钮测试API</Text>
            <Text className="text-xs text-yellow-700 block mb-1">3. 点击"测试直接插入"按钮测试数据库权限</Text>
            <Text className="text-xs text-yellow-700 block mb-1">4. 打开浏览器控制台查看详细日志</Text>
            <Text className="text-xs text-yellow-700 block">5. 如果直接插入成功但API失败，说明是API层问题</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
