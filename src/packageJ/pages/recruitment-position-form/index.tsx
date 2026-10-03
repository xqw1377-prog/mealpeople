/**
 * 职位表单页面 - 招聘管理
 */

import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'
import {createPosition, updatePosition} from '@/db/api-lifecycle'
import {useTenantStore} from '@/store/tenant'

export default function RecruitmentPositionForm() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const router = useRouter()
  const positionId = router.params.id || ''
  const isEdit = !!positionId

  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('')
  const [location, setLocation] = useState('')
  const [employmentType, setEmploymentType] = useState('full_time')
  const [salaryRange, setSalaryRange] = useState('')
  const [headcount, setHeadcount] = useState('')
  const [requirements, setRequirements] = useState('')
  const [responsibilities, setResponsibilities] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 雇佣类型选项
  const employmentTypes = [
    {label: '全职', value: 'full_time'},
    {label: '兼职', value: 'part_time'},
    {label: '实习', value: 'internship'},
    {label: '合同工', value: 'contract'}
  ]

  // 加载职位信息（编辑模式）
  const loadPosition = useCallback(async () => {
    try {
      const {data, error} = await supabase.from('positions').select('*').eq('id', positionId).maybeSingle()

      if (error) throw error
      if (data) {
        setTitle(data.title || '')
        setDepartment(data.department || '')
        setLocation(data.location || '')
        setEmploymentType(data.employment_type || 'full_time')
        setSalaryRange(data.salary_range || '')
        setHeadcount(data.headcount?.toString() || '')
        setRequirements(data.requirements || '')
        setResponsibilities(data.responsibilities || '')
      }
    } catch (error) {
      console.error('加载职位信息失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  }, [positionId])

  useEffect(() => {
    if (isEdit && positionId) {
      loadPosition()
    }
  }, [isEdit, positionId, loadPosition])

  // 处理雇佣类型选择
  const handleEmploymentTypeChange = (e: any) => {
    const index = e.detail.value
    setEmploymentType(employmentTypes[index].value)
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!user || !currentTenant) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    if (!title.trim()) {
      Taro.showToast({
        title: '请输入职位名称',
        icon: 'none'
      })
      return
    }

    if (!department.trim()) {
      Taro.showToast({
        title: '请输入部门',
        icon: 'none'
      })
      return
    }

    if (!headcount || Number.parseInt(headcount, 10) <= 0) {
      Taro.showToast({
        title: '请输入有效的招聘人数',
        icon: 'none'
      })
      return
    }

    setSubmitting(true)
    try {
      const positionData = {
        tenant_id: currentTenant.id,
        title: title.trim(),
        department: department.trim(),
        description: `工作地点：${location.trim()}，雇佣类型：${employmentType}，招聘人数：${headcount}，职责：${responsibilities.trim()}`,
        requirements: requirements.trim(),
        salary_range: salaryRange.trim(),
        status: 'open' as const
      }

      if (isEdit) {
        await updatePosition(positionId, positionData)
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        })
      } else {
        await createPosition(positionData)
        Taro.showToast({
          title: '创建成功',
          icon: 'success'
        })
      }

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('提交职位失败:', error)
      Taro.showToast({
        title: '提交失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 基本信息 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-lg font-semibold text-foreground mb-4">基本信息</Text>

            <View className="space-y-4">
              {/* 职位名称 */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">职位名称 *</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-gray-50 text-foreground px-3 py-2 rounded-lg border border-border w-full"
                    placeholder="请输入职位名称"
                    value={title}
                    onInput={(e) => setTitle(e.detail.value)}
                  />
                </View>
              </View>

              {/* 部门 */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">部门 *</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-gray-50 text-foreground px-3 py-2 rounded-lg border border-border w-full"
                    placeholder="请输入部门"
                    value={department}
                    onInput={(e) => setDepartment(e.detail.value)}
                  />
                </View>
              </View>

              {/* 工作地点 */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">工作地点</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-gray-50 text-foreground px-3 py-2 rounded-lg border border-border w-full"
                    placeholder="请输入工作地点"
                    value={location}
                    onInput={(e) => setLocation(e.detail.value)}
                  />
                </View>
              </View>

              {/* 雇佣类型 */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">雇佣类型</Text>
                <Picker
                  mode="selector"
                  range={employmentTypes.map((t) => t.label)}
                  onChange={handleEmploymentTypeChange}>
                  <View className="bg-gray-50 rounded-lg p-3 flex items-center justify-between border border-border">
                    <Text className="text-sm text-foreground">
                      {employmentTypes.find((t) => t.value === employmentType)?.label || '请选择'}
                    </Text>
                    <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
                  </View>
                </Picker>
              </View>

              {/* 薪资范围 */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">薪资范围</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-gray-50 text-foreground px-3 py-2 rounded-lg border border-border w-full"
                    placeholder="例如：8000-12000"
                    value={salaryRange}
                    onInput={(e) => setSalaryRange(e.detail.value)}
                  />
                </View>
              </View>

              {/* 招聘人数 */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">招聘人数 *</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-gray-50 text-foreground px-3 py-2 rounded-lg border border-border w-full"
                    placeholder="请输入招聘人数"
                    type="number"
                    value={headcount}
                    onInput={(e) => setHeadcount(e.detail.value)}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* 职位要求 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-lg font-semibold text-foreground mb-4">职位要求</Text>
            <View style={{overflow: 'hidden'}}>
              <Textarea
                className="bg-gray-50 text-foreground px-3 py-2 rounded-lg border border-border w-full"
                placeholder="请输入职位要求，例如：&#10;1. 本科及以上学历&#10;2. 3年以上相关工作经验&#10;3. 熟练掌握..."
                value={requirements}
                onInput={(e) => setRequirements(e.detail.value)}
                maxlength={1000}
                style={{minHeight: '120px'}}
              />
            </View>
            <Text className="text-xs text-muted-foreground mt-2">{requirements.length}/1000</Text>
          </View>

          {/* 岗位职责 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-lg font-semibold text-foreground mb-4">岗位职责</Text>
            <View style={{overflow: 'hidden'}}>
              <Textarea
                className="bg-gray-50 text-foreground px-3 py-2 rounded-lg border border-border w-full"
                placeholder="请输入岗位职责，例如：&#10;1. 负责产品设计和开发&#10;2. 参与需求分析和评审&#10;3. 编写技术文档..."
                value={responsibilities}
                onInput={(e) => setResponsibilities(e.detail.value)}
                maxlength={1000}
                style={{minHeight: '120px'}}
              />
            </View>
            <Text className="text-xs text-muted-foreground mt-2">{responsibilities.length}/1000</Text>
          </View>

          {/* 提交按钮 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded-lg break-keep text-base"
              size="default"
              onClick={handleSubmit}
              disabled={submitting}>
              {submitting ? '提交中...' : isEdit ? '更新职位' : '创建职位'}
            </Button>
          </View>

          {/* 底部占位 */}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  )
}
