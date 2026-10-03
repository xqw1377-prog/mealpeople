/**
 * 面试安排页面 - 招聘管理
 */

import {Button, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {useTenantStore} from '@/store/tenant'

interface Candidate {
  id: string
  name: string
  position: string
  status: string
}

interface Interviewer {
  id: string
  name: string
}

export default function InterviewSchedule() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // 候选人和面试官列表
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [interviewers, setInterviewers] = useState<Interviewer[]>([])

  // 表单状态
  const [formData, setFormData] = useState({
    candidate_id: '',
    interviewer_id: '',
    interview_date: '',
    interview_time: '09:00',
    interview_type: '初试'
  })

  const [submitting, setSubmitting] = useState(false)

  // 面试类型选项
  const interviewTypes = ['初试', '复试', '终试']
  const [interviewTypeIndex, setInterviewTypeIndex] = useState(0)

  // 时间选项
  const timeOptions = [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00'
  ]
  const [timeIndex, setTimeIndex] = useState(0)

  // 加载候选人列表
  const loadCandidates = useCallback(async () => {
    if (!currentTenant) return

    try {
      const {data, error} = await supabase
        .from('candidates')
        .select('id, name, position, status')
        .eq('tenant_id', currentTenant.id)
        .in('status', ['pending', 'interview'])
        .order('created_at', {ascending: false})

      if (error) throw error
      setCandidates(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('加载候选人列表失败:', error)
    }
  }, [currentTenant])

  // 加载面试官列表
  const loadInterviewers = useCallback(async () => {
    if (!currentTenant) return

    try {
      const {data, error} = await supabase
        .from('profiles')
        .select('id, name')
        .eq('tenant_id', currentTenant.id)
        .in('role', ['admin', 'manager'])
        .order('name', {ascending: true})

      if (error) throw error
      setInterviewers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('加载面试官列表失败:', error)
    }
  }, [currentTenant])

  // 页面加载时获取数据
  Taro.useDidShow(() => {
    loadCandidates()
    loadInterviewers()
  })

  // 选择候选人
  const selectCandidate = () => {
    if (candidates.length === 0) {
      Taro.showToast({
        title: '暂无可选候选人',
        icon: 'none'
      })
      return
    }

    Taro.showActionSheet({
      itemList: candidates.map((c) => `${c.name} - ${c.position}`)
    }).then((res) => {
      const selected = candidates[res.tapIndex]
      setFormData({...formData, candidate_id: selected.id})
    })
  }

  // 选择面试官
  const selectInterviewer = () => {
    if (interviewers.length === 0) {
      Taro.showToast({
        title: '暂无可选面试官',
        icon: 'none'
      })
      return
    }

    Taro.showActionSheet({
      itemList: interviewers.map((i) => i.name)
    }).then((res) => {
      const selected = interviewers[res.tapIndex]
      setFormData({...formData, interviewer_id: selected.id})
    })
  }

  // 选择日期
  const selectDate = () => {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    Taro.showModal({
      title: '选择日期',
      content: `请使用日期选择器选择日期（默认：${dateStr}）`
    }).then((res) => {
      if (res.confirm) {
        setFormData({...formData, interview_date: dateStr})
      }
    })
  }

  // 提交面试安排
  const handleSubmit = async () => {
    // 验证必填项
    if (!formData.candidate_id) {
      Taro.showToast({
        title: '请选择候选人',
        icon: 'none'
      })
      return
    }

    if (!formData.interviewer_id) {
      Taro.showToast({
        title: '请选择面试官',
        icon: 'none'
      })
      return
    }

    if (!formData.interview_date) {
      Taro.showToast({
        title: '请选择面试日期',
        icon: 'none'
      })
      return
    }

    setSubmitting(true)
    try {
      // 组合日期和时间
      const interviewDateTime = `${formData.interview_date}T${formData.interview_time}:00`

      const {error} = await supabase.from('interviews').insert({
        candidate_id: formData.candidate_id,
        interviewer_id: formData.interviewer_id,
        interview_date: interviewDateTime,
        interview_type: formData.interview_type,
        result: 'pending'
      })

      if (error) throw error

      // 更新候选人状态为面试中
      await supabase.from('candidates').update({status: 'interview'}).eq('id', formData.candidate_id)

      Taro.showToast({
        title: '安排成功',
        icon: 'success'
      })

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('安排面试失败:', error)
      Taro.showToast({
        title: '安排失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 获取选中的候选人名称
  const getSelectedCandidateName = () => {
    const candidate = candidates.find((c) => c.id === formData.candidate_id)
    return candidate ? `${candidate.name} - ${candidate.position}` : '请选择候选人'
  }

  // 获取选中的面试官名称
  const getSelectedInterviewerName = () => {
    const interviewer = interviewers.find((i) => i.id === formData.interviewer_id)
    return interviewer ? interviewer.name : '请选择面试官'
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4 max-sm:p-3">
          {/* 说明 */}
          <View className="bg-blue-100 rounded-xl p-4 max-sm:p-3 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <View className="flex items-start gap-2 max-sm:gap-1.5">
              <View className="i-mdi-information text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 font-medium mb-1">
                  面试安排说明
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-blue-600/80">
                  请选择候选人、面试官，并设置面试时间和类型。
                </Text>
              </View>
            </View>
          </View>

          {/* 候选人选择 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-2 max-sm:mb-1.5">
              候选人
            </Text>
            <View
              className="bg-input rounded-lg px-3 max-sm:px-2 py-3 max-sm:py-2 flex items-center justify-between border border-border"
              onClick={selectCandidate}>
              <Text className={formData.candidate_id ? 'text-foreground' : 'text-muted-foreground'}>
                {getSelectedCandidateName()}
              </Text>
              <View className="i-mdi-chevron-down text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
            </View>
          </View>

          {/* 面试官选择 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-2 max-sm:mb-1.5">
              面试官
            </Text>
            <View
              className="bg-input rounded-lg px-3 max-sm:px-2 py-3 max-sm:py-2 flex items-center justify-between border border-border"
              onClick={selectInterviewer}>
              <Text className={formData.interviewer_id ? 'text-foreground' : 'text-muted-foreground'}>
                {getSelectedInterviewerName()}
              </Text>
              <View className="i-mdi-chevron-down text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
            </View>
          </View>

          {/* 面试日期 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-2 max-sm:mb-1.5">
              面试日期
            </Text>
            <View
              className="bg-input rounded-lg px-3 max-sm:px-2 py-3 max-sm:py-2 flex items-center justify-between border border-border"
              onClick={selectDate}>
              <Text className={formData.interview_date ? 'text-foreground' : 'text-muted-foreground'}>
                {formData.interview_date || '请选择日期'}
              </Text>
              <View className="i-mdi-calendar text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
            </View>
          </View>

          {/* 面试时间 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-2 max-sm:mb-1.5">
              面试时间
            </Text>
            <Picker
              mode="selector"
              range={timeOptions}
              value={timeIndex}
              onChange={(e) => {
                const index = Number(e.detail.value)
                setTimeIndex(index)
                setFormData({...formData, interview_time: timeOptions[index]})
              }}>
              <View className="bg-input rounded-lg px-3 max-sm:px-2 py-3 max-sm:py-2 flex items-center justify-between border border-border">
                <Text className="text-foreground">{formData.interview_time}</Text>
                <View className="i-mdi-clock text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
              </View>
            </Picker>
          </View>

          {/* 面试类型 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-2 max-sm:mb-1.5">
              面试类型
            </Text>
            <Picker
              mode="selector"
              range={interviewTypes}
              value={interviewTypeIndex}
              onChange={(e) => {
                const index = Number(e.detail.value)
                setInterviewTypeIndex(index)
                setFormData({...formData, interview_type: interviewTypes[index]})
              }}>
              <View className="bg-input rounded-lg px-3 max-sm:px-2 py-3 max-sm:py-2 flex items-center justify-between border border-border">
                <Text className="text-foreground">{formData.interview_type}</Text>
                <View className="i-mdi-chevron-down text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
              </View>
            </Picker>
          </View>

          {/* 提交按钮 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
              size="default"
              onClick={handleSubmit}
              disabled={submitting}>
              {submitting ? '安排中...' : '确认安排'}
            </Button>
          </View>

          {/* 底部占位 */}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  )
}
