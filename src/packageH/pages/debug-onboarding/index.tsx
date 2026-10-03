/**
 * 入职页面调试工具
 * 用于诊断入职页面加载失败的问题
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useState} from 'react'
import {useTenantStore} from '@/store/tenant'

export default function DebugOnboarding() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // 添加调试信息
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo((prev) => `${prev}\n[${timestamp}] ${message}`)
    console.log(`[调试] ${message}`)
  }

  // 测试1：检查用户信息
  const testUserInfo = async () => {
    addLog('=== 测试1：检查用户信息 ===')
    if (!user) {
      addLog('❌ 用户未登录')
      return
    }
    addLog(`✅ 用户ID: ${user.id}`)
    addLog(`✅ 用户邮箱: ${user.email || '无'}`)
    addLog(`✅ 用户手机: ${user.phone || '无'}`)
  }

  // 测试2：检查全局租户状态
  const testTenantState = () => {
    addLog('=== 测试2：检查全局租户状态 ===')
    if (!currentTenant) {
      addLog('❌ 全局租户状态为空')
      addLog('💡 建议：请先选择租户')
      return
    }
    addLog(`✅ 租户ID: ${currentTenant.id}`)
    addLog(`✅ 租户名称: ${currentTenant.name}`)
  }

  // 测试3：查询员工信息
  const testEmployeeInfo = async () => {
    addLog('=== 测试3：查询员工信息 ===')
    if (!user?.id) {
      addLog('❌ 用户ID不存在')
      return
    }

    try {
      const {getEmployeeByUserId} = await import('@/db/api')
      addLog('开始查询员工信息...')
      const employee = await getEmployeeByUserId(user.id)

      if (!employee) {
        addLog('❌ 未找到员工记录')
        addLog('💡 建议：需要在员工管理中创建员工记录')
        return
      }

      addLog(`✅ 员工ID: ${employee.id}`)
      addLog(`✅ 员工姓名: ${employee.name}`)
      addLog(`✅ 租户ID: ${employee.tenant_id || '无'}`)
      addLog(`✅ 门店ID: ${employee.store_id || '无'}`)
      addLog(`✅ 职位: ${employee.position || '无'}`)
      addLog(`✅ 状态: ${employee.status}`)
    } catch (error) {
      addLog(`❌ 查询失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 测试4：查询入职统计
  const testOnboardingStats = async () => {
    addLog('=== 测试4：查询入职统计 ===')

    let tenantId: string | null = null

    // 获取租户ID
    if (currentTenant?.id) {
      tenantId = currentTenant.id
      addLog(`使用全局租户ID: ${tenantId}`)
    } else if (user?.id) {
      try {
        const {getEmployeeByUserId} = await import('@/db/api')
        const employee = await getEmployeeByUserId(user.id)
        if (employee?.tenant_id) {
          tenantId = employee.tenant_id
          addLog(`从员工信息获取租户ID: ${tenantId}`)
        }
      } catch (error) {
        addLog(`❌ 获取员工信息失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }

    if (!tenantId) {
      addLog('❌ 无法获取租户ID')
      return
    }

    try {
      const {getOnboardingStats} = await import('@/db/api-lifecycle')
      addLog('开始查询入职统计...')
      const stats = await getOnboardingStats(tenantId)

      addLog(`✅ 待开始: ${stats.pending}`)
      addLog(`✅ 进行中: ${stats.in_progress}`)
      addLog(`✅ 本月完成: ${stats.completed_this_month}`)
    } catch (error) {
      addLog(`❌ 查询失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 测试5：查询入职流程列表
  const testOnboardingProcesses = async () => {
    addLog('=== 测试5：查询入职流程列表 ===')

    let tenantId: string | null = null

    // 获取租户ID
    if (currentTenant?.id) {
      tenantId = currentTenant.id
      addLog(`使用全局租户ID: ${tenantId}`)
    } else if (user?.id) {
      try {
        const {getEmployeeByUserId} = await import('@/db/api')
        const employee = await getEmployeeByUserId(user.id)
        if (employee?.tenant_id) {
          tenantId = employee.tenant_id
          addLog(`从员工信息获取租户ID: ${tenantId}`)
        }
      } catch (error) {
        addLog(`❌ 获取员工信息失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }

    if (!tenantId) {
      addLog('❌ 无法获取租户ID')
      return
    }

    try {
      const {getOnboardingProcesses} = await import('@/db/api-lifecycle')
      addLog('开始查询入职流程列表...')
      const processes = await getOnboardingProcesses(tenantId)

      addLog(`✅ 查询到 ${processes.length} 条记录`)
      if (processes.length === 0) {
        addLog('💡 提示：数据库中没有入职流程记录，这是正常的')
        addLog('💡 建议：可以通过"新建入职流程"按钮添加数据')
      } else {
        processes.slice(0, 3).forEach((p, index) => {
          addLog(`  ${index + 1}. ID: ${p.id} - ${p.status}`)
        })
      }
    } catch (error) {
      addLog(`❌ 查询失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 测试6：测试数据库连接
  const testDatabaseConnection = async () => {
    addLog('=== 测试6：测试数据库连接 ===')
    try {
      const {supabase} = await import('@/client/supabase')
      addLog('开始测试数据库连接...')

      const {data, error} = await supabase.from('tenants').select('*').limit(1)

      if (error) {
        addLog(`❌ 数据库连接失败: ${error.message}`)
        return
      }

      addLog('✅ 数据库连接正常')
      if (data && data.length > 0) {
        addLog(`✅ 查询到租户: ${data[0].name}`)
      }
    } catch (error) {
      addLog(`❌ 测试失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 运行所有测试
  const runAllTests = async () => {
    setLoading(true)
    setDebugInfo('')
    addLog('开始运行所有测试...\n')

    await testUserInfo()
    addLog('')
    testTenantState()
    addLog('')
    await testEmployeeInfo()
    addLog('')
    await testOnboardingStats()
    addLog('')
    await testOnboardingProcesses()
    addLog('')
    await testDatabaseConnection()
    addLog('')
    addLog('=== 所有测试完成 ===')

    setLoading(false)
  }

  // 清除日志
  const clearLog = () => {
    setDebugInfo('')
  }

  // 复制日志
  const copyLog = () => {
    Taro.setClipboardData({
      data: debugInfo,
      success: () => {
        Taro.showToast({title: '日志已复制', icon: 'success'})
      }
    })
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-background to-muted">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4">
          {/* 标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">入职页面调试工具</Text>
            <Text className="text-sm text-muted-foreground mt-2">用于诊断入职页面加载失败的问题</Text>
          </View>

          {/* 当前状态 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4">
            <Text className="text-base font-semibold text-foreground mb-3">当前状态</Text>
            <View className="space-y-2">
              <View className="flex flex-row items-center">
                <Text className="text-sm text-muted-foreground w-24">用户状态：</Text>
                <Text className={`text-sm ${user ? 'text-muted-foreground' : 'text-red-600'}`}>
                  {user ? '✅ 已登录' : '❌ 未登录'}
                </Text>
              </View>
              <View className="flex flex-row items-center">
                <Text className="text-sm text-muted-foreground w-24">租户状态：</Text>
                <Text className={`text-sm ${currentTenant ? 'text-muted-foreground' : 'text-red-600'}`}>
                  {currentTenant ? `✅ ${currentTenant.name}` : '❌ 未选择'}
                </Text>
              </View>
            </View>
          </View>

          {/* 测试按钮 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4">
            <Text className="text-base font-semibold text-foreground mb-3">测试项目</Text>
            <View className="space-y-2">
              <Button
                className="w-full bg-blue-100 text-white py-3 rounded break-keep text-sm"
                size="default"
                onClick={runAllTests}
                disabled={loading}>
                {loading ? '测试中...' : '运行所有测试'}
              </Button>
              <View className="grid grid-cols-2 gap-2">
                <Button
                  className="bg-secondary text-foreground py-2 rounded break-keep text-xs"
                  size="default"
                  onClick={testUserInfo}>
                  测试1：用户信息
                </Button>
                <Button
                  className="bg-secondary text-foreground py-2 rounded break-keep text-xs"
                  size="default"
                  onClick={testTenantState}>
                  测试2：租户状态
                </Button>
                <Button
                  className="bg-secondary text-foreground py-2 rounded break-keep text-xs"
                  size="default"
                  onClick={testEmployeeInfo}>
                  测试3：员工信息
                </Button>
                <Button
                  className="bg-secondary text-foreground py-2 rounded break-keep text-xs"
                  size="default"
                  onClick={testOnboardingStats}>
                  测试4：入职统计
                </Button>
                <Button
                  className="bg-secondary text-foreground py-2 rounded break-keep text-xs"
                  size="default"
                  onClick={testOnboardingProcesses}>
                  测试5：流程列表
                </Button>
                <Button
                  className="bg-secondary text-foreground py-2 rounded break-keep text-xs"
                  size="default"
                  onClick={testDatabaseConnection}>
                  测试6：数据库连接
                </Button>
              </View>
            </View>
          </View>

          {/* 日志输出 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4">
            <View className="flex flex-row justify-between items-center mb-3">
              <Text className="text-base font-semibold text-foreground">调试日志</Text>
              <View className="flex flex-row gap-2">
                <Button
                  className="bg-muted text-foreground px-3 py-1 rounded break-keep text-xs"
                  size="mini"
                  onClick={copyLog}>
                  复制
                </Button>
                <Button
                  className="bg-muted text-foreground px-3 py-1 rounded break-keep text-xs"
                  size="mini"
                  onClick={clearLog}>
                  清除
                </Button>
              </View>
            </View>
            <View className="bg-muted rounded p-3 min-h-[200px]">
              {debugInfo ? (
                <Text className="text-xs text-foreground font-mono whitespace-pre-wrap">{debugInfo}</Text>
              ) : (
                <Text className="text-sm text-muted-foreground">点击上方按钮开始测试...</Text>
              )}
            </View>
          </View>

          {/* 快捷操作 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4">
            <Text className="text-base font-semibold text-foreground mb-3">快捷操作</Text>
            <View className="space-y-2">
              <Button
                className="w-full bg-accent text-white py-3 rounded break-keep text-sm"
                size="default"
                onClick={() => Taro.navigateTo({url: '/pages/tenant-select/index'})}>
                选择租户
              </Button>
              <Button
                className="w-full bg-accent text-white py-3 rounded break-keep text-sm"
                size="default"
                onClick={() => Taro.navigateTo({url: '/packageH/pages/onboarding/index'})}>
                返回入职页面
              </Button>
            </View>
          </View>

          {/* 说明 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-20">
            <Text className="text-base font-semibold text-foreground mb-3">使用说明</Text>
            <View className="space-y-2">
              <Text className="text-sm text-muted-foreground">1. 点击"运行所有测试"按钮执行完整的诊断流程</Text>
              <Text className="text-sm text-muted-foreground">2. 查看调试日志中的错误信息</Text>
              <Text className="text-sm text-muted-foreground">3. 根据提示进行相应的修复操作</Text>
              <Text className="text-sm text-muted-foreground">4. 如需帮助，请复制日志并联系技术支持</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
