/**
 * 离职员工档案页面
 *
 * 功能：
 * - 查看所有离职员工档案
 * - 搜索和筛选离职员工
 * - 查看离职员工详细信息
 * - 查看离职原因和面谈记录
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api-employees'
import {useTenantStore} from '@/store/tenant'

// 离职员工档案类型
interface OffboardingArchive {
  id: string
  employee_id: string
  employee_name: string
  gender: string
  phone: string
  email?: string
  department: string
  position: string
  hire_date: string
  resignation_date: string
  last_working_day: string
  resignation_reason: string
  resignation_type: string
  work_duration_months: number
  exit_interview_completed: boolean
  exit_interview_rating?: number
  procedures_completed: boolean
  rehire_eligible: boolean
  notes?: string
  created_at: string
}

export default function OffboardingArchivePage() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [archives, setArchives] = useState<OffboardingArchive[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'voluntary' | 'involuntary'>('all')

  // 加载离职员工档案
  const loadArchives = useCallback(async () => {
    if (!currentTenant) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 检查权限
      const currentEmployee = await getEmployeeByUserId(user?.id)
      if (!currentEmployee) {
        Taro.showToast({title: '无权限访问', icon: 'none'})
        setLoading(false)
        return
      }

      // 获取已完成的离职申请
      const {data: resignations, error: resignError} = await supabase
        .from('resignation_applications')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'approved')
        .order('resignation_date', {ascending: false})

      if (resignError) throw resignError

      // 获取员工信息
      const employeeIds = resignations?.map((r) => r.employee_id) || []
      const {data: employees, error: empError} = await supabase.from('employees').select('*').in('id', employeeIds)

      if (empError) throw empError

      // 获取离职面谈记录
      const {data: interviews, error: interviewError} = await supabase
        .from('exit_interviews')
        .select('*')
        .eq('tenant_id', currentTenant.id)

      if (interviewError) throw interviewError

      // 获取离职手续记录
      const {data: procedures, error: procError} = await supabase
        .from('exit_procedures')
        .select('*')
        .eq('tenant_id', currentTenant.id)

      if (procError) throw procError

      // 构建离职员工档案列表
      const archiveList: OffboardingArchive[] = []

      for (const resignation of resignations || []) {
        const employee = employees?.find((e) => e.id === resignation.employee_id)
        if (!employee) continue

        // 查找面谈记录
        const interview = interviews?.find((i) => i.employee_id === resignation.employee_id)

        // 查找手续记录
        const procedure = procedures?.find((p) => p.employee_id === resignation.employee_id)

        // 计算工作时长（月）
        const hireDate = new Date(employee.hire_date)
        const resignDate = new Date(resignation.resignation_date)
        const workDurationMonths = Math.round((resignDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30))

        archiveList.push({
          id: resignation.id,
          employee_id: employee.id,
          employee_name: employee.name,
          gender: employee.gender,
          phone: employee.phone,
          email: employee.email || undefined,
          department: employee.department || '未知',
          position: employee.position || '未知',
          hire_date: employee.hire_date,
          resignation_date: resignation.resignation_date,
          last_working_day: resignation.last_working_day,
          resignation_reason: resignation.reason || '未填写',
          resignation_type: resignation.resignation_type || 'voluntary',
          work_duration_months: workDurationMonths,
          exit_interview_completed: !!interview,
          exit_interview_rating: interview?.overall_satisfaction,
          procedures_completed: procedure?.status === 'completed',
          rehire_eligible: interview?.willing_to_return === true,
          notes: resignation.notes || undefined,
          created_at: resignation.created_at
        })
      }

      setArchives(archiveList)
    } catch (error) {
      console.error('加载离职员工档案失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, user])

  useDidShow(() => {
    loadArchives()
  })

  // 查看详情
  const handleViewDetail = (archive: OffboardingArchive) => {
    const genderText = archive.gender === 'male' ? '男' : '女'
    const typeText = archive.resignation_type === 'voluntary' ? '主动离职' : '被动离职'

    let content = `姓名：${archive.employee_name}\n性别：${genderText}\n手机：${archive.phone}`

    if (archive.email) content += `\n邮箱：${archive.email}`

    content += `\n\n工作信息：\n部门：${archive.department}\n职位：${archive.position}\n入职日期：${archive.hire_date}\n工作时长：${archive.work_duration_months}个月`

    content += `\n\n离职信息：\n离职类型：${typeText}\n离职日期：${archive.resignation_date}\n最后工作日：${archive.last_working_day}\n离职原因：${archive.resignation_reason}`

    content += `\n\n离职状态：\n面谈完成：${archive.exit_interview_completed ? '是' : '否'}`

    if (archive.exit_interview_rating) {
      content += `\n满意度评分：${archive.exit_interview_rating}分`
    }

    content += `\n手续完成：${archive.procedures_completed ? '是' : '否'}\n可再雇佣：${archive.rehire_eligible ? '是' : '否'}`

    if (archive.notes) content += `\n\n备注：${archive.notes}`

    Taro.showModal({
      title: '员工档案详情',
      content,
      showCancel: false
    })
  }

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 筛选档案列表
  const filteredArchives = archives.filter((archive) => {
    // 类型筛选
    if (filterType !== 'all' && archive.resignation_type !== filterType) {
      return false
    }

    // 关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      return (
        archive.employee_name.toLowerCase().includes(keyword) ||
        archive.department.toLowerCase().includes(keyword) ||
        archive.position.toLowerCase().includes(keyword) ||
        archive.phone.includes(keyword)
      )
    }

    return true
  })

  // 统计数据
  const statistics = {
    total: archives.length,
    voluntary: archives.filter((a) => a.resignation_type === 'voluntary').length,
    involuntary: archives.filter((a) => a.resignation_type === 'involuntary').length,
    rehire_eligible: archives.filter((a) => a.rehire_eligible).length
  }

  return (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)'}}>
      {/* 头部 */}
      <View className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-6 rounded-b-3xl mb-4">
        <View className="flex items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold block mb-2">离职员工档案</Text>
            <Text className="text-sm opacity-90 block">查看历史离职记录</Text>
          </View>
          <View className="i-mdi-archive text-5xl opacity-20"></View>
        </View>

        {/* 统计卡片 */}
        <View className="bg-white bg-opacity-20 rounded-xl p-4">
          <View className="grid grid-cols-4 gap-2">
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.total}</Text>
              <Text className="text-xs opacity-90 block">总数</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.voluntary}</Text>
              <Text className="text-xs opacity-90 block">主动离职</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.involuntary}</Text>
              <Text className="text-xs opacity-90 block">被动离职</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.rehire_eligible}</Text>
              <Text className="text-xs opacity-90 block">可再雇佣</Text>
            </View>
          </View>
        </View>
      </View>

      {loading ? (
        <View className="text-center py-8">
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      ) : (
        <View className="p-4">
          {/* 搜索框 */}
          <View className="mb-4">
            <View style={{overflow: 'hidden'}}>
              <Input
                className="bg-white text-foreground px-4 py-3 rounded-xl w-full border-2 border-gray-200"
                value={searchKeyword}
                onInput={(e) => setSearchKeyword(e.detail.value)}
                placeholder="搜索姓名、部门、职位、手机号"
              />
            </View>
          </View>

          {/* 筛选器 */}
          <View className="flex items-center gap-2 mb-4">
            <View
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-xl ${filterType === 'all' ? 'bg-gray-600 text-white' : 'bg-white text-foreground'}`}>
              <Text className="text-sm font-medium">全部({statistics.total})</Text>
            </View>
            <View
              onClick={() => setFilterType('voluntary')}
              className={`px-4 py-2 rounded-xl ${filterType === 'voluntary' ? 'bg-blue-500 text-white' : 'bg-white text-foreground'}`}>
              <Text className="text-sm font-medium">主动离职({statistics.voluntary})</Text>
            </View>
            <View
              onClick={() => setFilterType('involuntary')}
              className={`px-4 py-2 rounded-xl ${filterType === 'involuntary' ? 'bg-red-500 text-white' : 'bg-white text-foreground'}`}>
              <Text className="text-sm font-medium">被动离职({statistics.involuntary})</Text>
            </View>
          </View>

          {/* 档案列表 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-3 block">共 {filteredArchives.length} 条记录</Text>
            {filteredArchives.map((archive) => (
              <View key={archive.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                <View className="flex items-center justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex items-center mb-2">
                      <View className="i-mdi-account-circle text-xl text-gray-600 mr-2"></View>
                      <Text className="text-base font-bold text-foreground">{archive.employee_name}</Text>
                      {archive.rehire_eligible && (
                        <View className="ml-2 px-2 py-0.5 bg-green-100 rounded">
                          <Text className="text-xs text-green-700">可再雇佣</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm text-muted-foreground">
                      {archive.department} · {archive.position}
                    </Text>
                  </View>

                  {/* 离职类型标签 */}
                  <View
                    className={`px-3 py-1 rounded-full ${archive.resignation_type === 'voluntary' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                    <Text className="text-xs font-medium">
                      {archive.resignation_type === 'voluntary' ? '主动' : '被动'}
                    </Text>
                  </View>
                </View>

                {/* 工作信息 */}
                <View className="bg-gray-50 rounded-xl p-3 mb-3">
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-sm text-muted-foreground">入职日期</Text>
                    <Text className="text-sm text-foreground font-medium">{archive.hire_date}</Text>
                  </View>
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-sm text-muted-foreground">离职日期</Text>
                    <Text className="text-sm text-foreground font-medium">{archive.resignation_date}</Text>
                  </View>
                  <View className="flex items-center justify-between">
                    <Text className="text-sm text-muted-foreground">工作时长</Text>
                    <Text className="text-sm text-foreground font-medium">{archive.work_duration_months}个月</Text>
                  </View>
                </View>

                {/* 离职状态 */}
                <View className="bg-blue-50 rounded-xl p-3 mb-3">
                  <View className="grid grid-cols-2 gap-2">
                    <View className="flex items-center">
                      <View
                        className={`w-4 h-4 rounded mr-2 flex items-center justify-center ${archive.exit_interview_completed ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {archive.exit_interview_completed && <View className="i-mdi-check text-xs text-white"></View>}
                      </View>
                      <Text className="text-xs text-foreground">离职面谈</Text>
                    </View>
                    <View className="flex items-center">
                      <View
                        className={`w-4 h-4 rounded mr-2 flex items-center justify-center ${archive.procedures_completed ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {archive.procedures_completed && <View className="i-mdi-check text-xs text-white"></View>}
                      </View>
                      <Text className="text-xs text-foreground">手续完成</Text>
                    </View>
                  </View>
                  {archive.exit_interview_rating && (
                    <View className="mt-2 pt-2 border-t border-gray-200">
                      <Text className="text-xs text-muted-foreground">
                        满意度评分：{archive.exit_interview_rating}分
                      </Text>
                    </View>
                  )}
                </View>

                {/* 离职原因 */}
                <View className="bg-yellow-50 rounded-xl p-3 mb-3">
                  <Text className="text-xs text-muted-foreground mb-1 block">离职原因</Text>
                  <Text className="text-sm text-foreground">{archive.resignation_reason}</Text>
                </View>

                {/* 操作按钮 */}
                <View className="flex items-center gap-2">
                  <View
                    onClick={() => handleViewDetail(archive)}
                    className="flex-1 bg-gray-50 rounded-xl py-2 flex items-center justify-center active:bg-gray-100">
                    <View className="i-mdi-eye text-lg text-gray-600 mr-1"></View>
                    <Text className="text-sm text-gray-600 font-medium">查看详情</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* 空状态 */}
          {filteredArchives.length === 0 && (
            <View className="text-center py-12">
              <View className="i-mdi-archive-outline text-6xl text-muted-foreground mb-4"></View>
              <Text className="text-muted-foreground text-base block">暂无档案记录</Text>
            </View>
          )}

          {/* 返回按钮 */}
          <View className="mt-6">
            <View
              onClick={handleBack}
              className="bg-white border-2 border-gray-200 rounded-xl py-3 px-6 flex items-center justify-center active:bg-gray-50">
              <View className="i-mdi-arrow-left text-xl text-foreground mr-2"></View>
              <Text className="text-foreground font-medium">返回</Text>
            </View>
          </View>

          {/* 底部间距 */}
          <View className="h-6"></View>
        </View>
      )}
    </ScrollView>
  )
}
