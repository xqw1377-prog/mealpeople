/**
 * 工作记录页面 - 合并版
 * 功能：查看工作记录列表、添加记录（抽屉）、查看详情（抽屉）、类别设置
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import Drawer from '@/components/Drawer'
import type {WorkRecord} from '@/components/WorkLog'
import {AddRecordForm, RecordDetail} from '@/components/WorkLog'
import {getEmployeeByUserId} from '@/db/api'
import type {Employee} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

// 统计数据接口
interface Stats {
  today: number
  week: number
  month: number
}

const WorkLog: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [_employee, setEmployee] = useState<Employee | null>(null)
  const [records, setRecords] = useState<WorkRecord[]>([])
  const [stats, setStats] = useState<Stats>({today: 0, week: 0, month: 0})
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // 抽屉状态 - 默认打开添加抽屉
  const [drawerType, setDrawerType] = useState<'add' | 'detail' | null>('add')
  const [selectedRecord, setSelectedRecord] = useState<WorkRecord | null>(null)

  // 加载数据
  const loadData = useCallback(async () => {
    if (!user || !currentTenant) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 1. 加载员工信息
      const emp = await getEmployeeByUserId(user.id)
      if (!emp) {
        Taro.showToast({title: '未找到员工信息', icon: 'none'})
        setLoading(false)
        return
      }
      setEmployee(emp)

      // 2. 检查是否是管理员
      const {data: profile} = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      setIsAdmin(profile?.role === 'admin')

      // 3. 查询记录
      const {data, error} = await supabase
        .from('work_records')
        .select(
          `
          id,
          content,
          images,
          videos,
          voice_duration,
          created_at,
          category:work_log_categories(id, name, icon, color)
        `
        )
        .eq('tenant_id', currentTenant.id)
        .eq('employee_id', emp.id)
        .order('created_at', {ascending: false})
        .limit(50)

      if (error) {
        console.error('查询记录失败:', error)
        throw error
      }

      const formattedRecords: WorkRecord[] = (data || []).map((record: any) => ({
        id: record.id,
        content: record.content,
        images: record.images || [],
        videos: record.videos || [],
        voice_duration: record.voice_duration || 0,
        created_at: record.created_at,
        category: Array.isArray(record.category)
          ? record.category[0] || {id: '', name: '未分类', icon: 'i-mdi-file-document', color: 'gray'}
          : record.category || {id: '', name: '未分类', icon: 'i-mdi-file-document', color: 'gray'}
      }))

      setRecords(formattedRecords)

      // 4. 计算统计数据
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      const todayCount = formattedRecords.filter((r) => new Date(r.created_at) >= today).length
      const weekCount = formattedRecords.filter((r) => new Date(r.created_at) >= weekAgo).length
      const monthCount = formattedRecords.filter((r) => new Date(r.created_at) >= monthAgo).length

      setStats({
        today: todayCount,
        week: weekCount,
        month: monthCount
      })
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({title: '加载失败，请重试', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [user, currentTenant])

  useDidShow(() => {
    loadData()
  })

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  // 打开添加抽屉
  const handleAdd = () => {
    setDrawerType('add')
  }

  // 打开详情抽屉
  const handleViewDetail = (record: WorkRecord) => {
    setSelectedRecord(record)
    setDrawerType('detail')
  }

  // 关闭抽屉
  const closeDrawer = () => {
    setDrawerType(null)
    setSelectedRecord(null)
  }

  // 添加成功回调
  const handleAddSuccess = () => {
    closeDrawer()
    loadData() // 重新加载数据
  }

  // 删除成功回调
  const handleDeleteSuccess = (_id: string) => {
    closeDrawer()
    loadData() // 重新加载数据
  }

  // 跳转到类别设置
  const handleCategorySettings = () => {
    Taro.navigateTo({url: '/pages/work-log/category-settings/index'})
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center min-h-screen bg-gray-50">
        <View className="flex flex-col items-center gap-4">
          <View className="i-mdi-loading animate-spin text-5xl text-primary" />
          <Text className="text-muted-foreground text-sm">加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4 max-sm:p-3 pb-6">
          {/* 统计卡片 */}
          <View className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-3xl p-6 max-sm:p-5 mb-5 max-sm:mb-4 shadow-xl">
            <View className="flex items-center justify-between mb-5 max-sm:mb-4">
              <View>
                <Text className="text-white text-xl max-sm:text-lg font-bold mb-1">工作记录统计</Text>
                <Text className="text-blue-100 text-xs">实时数据更新</Text>
              </View>
              <View className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                <View className="i-mdi-chart-line text-2xl text-white" />
              </View>
            </View>
            <View className="grid grid-cols-3 gap-4 max-sm:gap-3">
              <View className="bg-white bg-opacity-10 rounded-2xl p-4 max-sm:p-3 backdrop-blur-sm">
                <Text className="text-white text-4xl max-sm:text-3xl font-bold mb-2">{stats.today}</Text>
                <Text className="text-blue-100 text-sm max-sm:text-xs font-medium">今日</Text>
              </View>
              <View className="bg-white bg-opacity-10 rounded-2xl p-4 max-sm:p-3 backdrop-blur-sm">
                <Text className="text-white text-4xl max-sm:text-3xl font-bold mb-2">{stats.week}</Text>
                <Text className="text-blue-100 text-sm max-sm:text-xs font-medium">本周</Text>
              </View>
              <View className="bg-white bg-opacity-10 rounded-2xl p-4 max-sm:p-3 backdrop-blur-sm">
                <Text className="text-white text-4xl max-sm:text-3xl font-bold mb-2">{stats.month}</Text>
                <Text className="text-blue-100 text-sm max-sm:text-xs font-medium">本月</Text>
              </View>
            </View>
          </View>

          {/* 快捷操作 */}
          <View className="grid grid-cols-2 gap-3 max-sm:gap-2.5 mb-5 max-sm:mb-4">
            <View
              className="bg-white rounded-2xl p-5 max-sm:p-4 active:scale-95 transition-all shadow-md border border-gray-100"
              onClick={handleAdd}>
              <View className="flex items-center gap-3 max-sm:gap-2.5">
                <View className="w-14 h-14 max-sm:w-12 max-sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <View className="i-mdi-plus text-3xl max-sm:text-2xl text-white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base max-sm:text-sm font-bold text-foreground mb-0.5">添加记录</Text>
                  <Text className="text-xs max-sm:text-[10px] text-muted-foreground">快速记录工作</Text>
                </View>
              </View>
            </View>

            {isAdmin && (
              <View
                className="bg-white rounded-2xl p-5 max-sm:p-4 active:scale-95 transition-all shadow-md border border-gray-100"
                onClick={handleCategorySettings}>
                <View className="flex items-center gap-3 max-sm:gap-2.5">
                  <View className="w-14 h-14 max-sm:w-12 max-sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <View className="i-mdi-cog text-3xl max-sm:text-2xl text-white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base max-sm:text-sm font-bold text-foreground mb-0.5">类别设置</Text>
                    <Text className="text-xs max-sm:text-[10px] text-muted-foreground">管理分类</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* 记录列表标题 */}
          {records.length > 0 && (
            <View className="flex items-center justify-between mb-4 max-sm:mb-3">
              <View className="flex items-center gap-2">
                <View className="i-mdi-format-list-bulleted text-xl text-primary" />
                <Text className="text-lg max-sm:text-base font-bold text-foreground">最近记录</Text>
              </View>
              <Text className="text-xs text-muted-foreground">共 {records.length} 条</Text>
            </View>
          )}

          {/* 记录列表 */}
          <View className="space-y-3 max-sm:space-y-2.5">
            {records.map((record) => {
              const colorMap: Record<string, string> = {
                blue: 'bg-blue-50 border-blue-200',
                green: 'bg-green-50 border-green-200',
                orange: 'bg-orange-50 border-orange-200',
                purple: 'bg-purple-50 border-purple-200',
                red: 'bg-red-50 border-red-200',
                cyan: 'bg-cyan-50 border-cyan-200',
                pink: 'bg-pink-50 border-pink-200',
                gray: 'bg-gray-50 border-gray-200'
              }
              const categoryBg = colorMap[record.category.color] || colorMap.gray

              return (
                <View
                  key={record.id}
                  className="bg-white rounded-2xl p-5 max-sm:p-4 shadow-md border border-gray-100 active:scale-98 transition-all"
                  onClick={() => handleViewDetail(record)}>
                  {/* 头部：类别和时间 */}
                  <View className="flex items-center justify-between mb-4 max-sm:mb-3">
                    <View className="flex items-center gap-2.5 max-sm:gap-2">
                      <View
                        className={`w-10 h-10 max-sm:w-9 max-sm:h-9 ${categoryBg} rounded-xl flex items-center justify-center border`}>
                        <View className={`${record.category.icon} text-xl max-sm:text-lg`} />
                      </View>
                      <View>
                        <Text className="text-sm max-sm:text-xs font-bold text-foreground">{record.category.name}</Text>
                        <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                          {formatTime(record.created_at)}
                        </Text>
                      </View>
                    </View>
                    <View className="i-mdi-chevron-right text-xl text-gray-400" />
                  </View>

                  {/* 内容 */}
                  {record.content && (
                    <Text className="text-sm max-sm:text-xs text-gray-700 mb-4 max-sm:mb-3 leading-relaxed line-clamp-3">
                      {record.content}
                    </Text>
                  )}

                  {/* 多媒体信息 */}
                  <View className="flex items-center gap-4 max-sm:gap-3 flex-wrap">
                    {/* 图片 */}
                    {record.images.length > 0 && (
                      <View className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full">
                        <View className="i-mdi-image text-sm text-blue-600" />
                        <Text className="text-xs text-blue-700 font-medium">{record.images.length} 张照片</Text>
                      </View>
                    )}

                    {/* 视频 */}
                    {record.videos.length > 0 && (
                      <View className="flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-full">
                        <View className="i-mdi-video text-sm text-purple-600" />
                        <Text className="text-xs text-purple-700 font-medium">视频</Text>
                      </View>
                    )}

                    {/* 语音时长 */}
                    {record.voice_duration > 0 && (
                      <View className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full">
                        <View className="i-mdi-microphone text-sm text-green-600" />
                        <Text className="text-xs text-green-700 font-medium">{record.voice_duration}秒</Text>
                      </View>
                    )}
                  </View>
                </View>
              )
            })}

            {records.length === 0 && (
              <View className="bg-white rounded-3xl p-12 max-sm:p-8 text-center shadow-md border border-gray-100">
                <View className="w-24 h-24 max-sm:w-20 max-sm:h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 max-sm:mb-4">
                  <View className="i-mdi-notebook-outline text-5xl max-sm:text-4xl text-blue-600" />
                </View>
                <Text className="text-lg max-sm:text-base font-bold text-foreground mb-2">暂无工作记录</Text>
                <Text className="text-sm max-sm:text-xs text-muted-foreground mb-6 max-sm:mb-5">
                  开始记录您的第一条工作内容吧
                </Text>
                <Button
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 max-sm:px-6 py-3.5 max-sm:py-3 rounded-2xl break-keep text-sm max-sm:text-xs font-bold shadow-lg active:scale-95 transition-all"
                  size="default"
                  onClick={handleAdd}>
                  <View className="flex items-center gap-2">
                    <View className="i-mdi-plus text-lg" />
                    <Text>添加第一条记录</Text>
                  </View>
                </Button>
              </View>
            )}
          </View>
        </View>

        {/* 底部占位 */}
        <View className="h-24" />
      </ScrollView>

      {/* 悬浮添加按钮 */}
      {records.length > 0 && (
        <View
          className="fixed bottom-20 right-4 w-14 h-14 max-sm:w-12 max-sm:h-12 bg-primary rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
          onClick={handleAdd}>
          <View className="i-mdi-plus text-3xl max-sm:text-2xl text-white" />
        </View>
      )}

      {/* 添加记录抽屉 */}
      <Drawer visible={drawerType === 'add'} onClose={closeDrawer} title="添加记录" height="85vh">
        <AddRecordForm onSuccess={handleAddSuccess} onCancel={closeDrawer} />
      </Drawer>

      {/* 记录详情抽屉 */}
      <Drawer visible={drawerType === 'detail'} onClose={closeDrawer} title="记录详情" height="80vh">
        <RecordDetail record={selectedRecord} onDelete={handleDeleteSuccess} onClose={closeDrawer} />
      </Drawer>
    </View>
  )
}

export default WorkLog
