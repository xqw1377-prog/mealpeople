/**
 * 系统诊断页面
 * 用于诊断用户账号和员工关联问题
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import {useAuth} from 'miaoda-auth-taro'
import {useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api'

export default function Diagnostic() {
  const {user} = useAuth({guard: true})
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const runDiagnostic = async () => {
    if (!user?.id) {
      setResult('❌ 用户未登录')
      return
    }

    setLoading(true)
    let diagnosticResult = '🔍 系统诊断报告\n\n'

    try {
      // 1. 检查用户信息
      diagnosticResult += '1️⃣ 用户信息检查\n'
      diagnosticResult += `用户ID: ${user.id}\n`
      diagnosticResult += `用户邮箱: ${user.email || '未设置'}\n`
      diagnosticResult += `用户手机: ${user.phone || '未设置'}\n\n`

      // 2. 检查profiles表
      diagnosticResult += '2️⃣ Profiles表检查\n'
      const {data: profile, error: profileError} = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        diagnosticResult += `❌ 查询失败: ${profileError.message}\n\n`
      } else if (!profile) {
        diagnosticResult += '❌ 未找到profile记录\n\n'
      } else {
        diagnosticResult += '✅ Profile记录存在\n'
        diagnosticResult += `角色: ${profile.role}\n\n`
      }

      // 3. 检查员工关联
      diagnosticResult += '3️⃣ 员工关联检查\n'
      const employee = await getEmployeeByUserId(user.id)

      if (!employee) {
        diagnosticResult += '❌ 未找到员工记录\n'
        diagnosticResult += '原因: 您的账号还没有关联到任何员工\n'
        diagnosticResult += '解决方案: 请联系管理员在"员工管理"中添加您的员工信息\n\n'
      } else {
        diagnosticResult += '✅ 员工记录存在\n'
        diagnosticResult += `员工ID: ${employee.id}\n`
        diagnosticResult += `员工姓名: ${employee.name}\n`
        diagnosticResult += `员工状态: ${employee.status}\n`
        diagnosticResult += `租户ID: ${employee.tenant_id}\n`
        diagnosticResult += `门店ID: ${employee.store_id}\n\n`
      }

      // 4. 检查租户信息
      if (employee) {
        diagnosticResult += '4️⃣ 租户信息检查\n'
        const {data: tenant, error: tenantError} = await supabase
          .from('tenants')
          .select('*')
          .eq('id', employee.tenant_id)
          .maybeSingle()

        if (tenantError) {
          diagnosticResult += `❌ 查询失败: ${tenantError.message}\n\n`
        } else if (!tenant) {
          diagnosticResult += '❌ 未找到租户记录\n\n'
        } else {
          diagnosticResult += '✅ 租户记录存在\n'
          diagnosticResult += `租户名称: ${tenant.name}\n\n`
        }
      }

      // 5. 检查成长数据表
      if (employee) {
        diagnosticResult += '5️⃣ 成长数据检查\n'

        // 检查等级表
        const {data: level, error: levelError} = await supabase
          .from('employee_levels')
          .select('*')
          .eq('employee_id', employee.id)
          .maybeSingle()

        if (levelError) {
          diagnosticResult += `❌ 等级表查询失败: ${levelError.message}\n`
        } else if (!level) {
          diagnosticResult += '⚠️ 等级记录不存在（系统会自动创建）\n'
        } else {
          diagnosticResult += `✅ 等级记录存在: ${level.current_level}\n`
        }

        // 检查培训记录
        const {data: trainings, error: trainingError} = await supabase
          .from('training_records')
          .select('count')
          .eq('employee_id', employee.id)

        if (trainingError) {
          diagnosticResult += `❌ 培训记录查询失败: ${trainingError.message}\n`
        } else {
          const count = trainings?.[0]?.count || 0
          diagnosticResult += `培训记录数量: ${count}\n`
        }

        // 检查认证记录
        const {data: certs, error: certError} = await supabase
          .from('certifications')
          .select('count')
          .eq('employee_id', employee.id)

        if (certError) {
          diagnosticResult += `❌ 认证记录查询失败: ${certError.message}\n`
        } else {
          const count = certs?.[0]?.count || 0
          diagnosticResult += `认证记录数量: ${count}\n`
        }

        diagnosticResult += '\n'
      }

      // 6. 总结
      diagnosticResult += '📋 诊断总结\n'
      if (!employee) {
        diagnosticResult += '❌ 主要问题: 账号未关联员工\n'
        diagnosticResult += '✅ 解决方案: 请联系管理员添加员工信息\n'
      } else {
        diagnosticResult += '✅ 账号状态正常\n'
        diagnosticResult += '✅ 可以正常使用"我的成长"功能\n'
      }

      setResult(diagnosticResult)
    } catch (error) {
      diagnosticResult += `\n❌ 诊断过程出错: ${error instanceof Error ? error.message : '未知错误'}\n`
      setResult(diagnosticResult)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">系统诊断</Text>
            <Text className="text-sm text-muted-foreground mt-1 block">检查账号和员工关联状态</Text>
          </View>

          {/* 诊断按钮 */}
          <View className="mb-4">
            <Button
              className="w-full bg-primary text-white py-4 rounded-lg break-keep text-base"
              size="default"
              onClick={runDiagnostic}
              disabled={loading}>
              {loading ? '诊断中...' : '开始诊断'}
            </Button>
          </View>

          {/* 诊断结果 */}
          {result && (
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
              <View className="mb-3">
                <Text className="text-lg font-semibold text-foreground">诊断结果</Text>
              </View>
              <View className="bg-gray-50 rounded p-3">
                <Text className="text-xs font-mono text-foreground whitespace-pre-wrap">{result}</Text>
              </View>
            </View>
          )}

          {/* 帮助信息 */}
          <View className="bg-blue-50 rounded-lg p-4 mt-4">
            <View className="flex flex-row items-start gap-2 mb-2">
              <View className="i-mdi-information text-xl text-blue-600 flex-shrink-0 mt-0.5" />
              <Text className="text-sm font-semibold text-blue-900">使用说明</Text>
            </View>
            <Text className="text-xs text-blue-800 leading-relaxed">
              如果"我的成长"页面显示加载失败，请点击"开始诊断"按钮检查问题原因。诊断工具会检查您的账号状态、员工关联情况和数据完整性。
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
