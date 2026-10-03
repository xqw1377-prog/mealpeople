/**
 * 离职流程办理页面 - 离职管理
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow, useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'

interface ProcessItem {
  id: string
  name: string
  description: string
  completed: boolean
  completed_at: string | null
}

interface ResignationProcess {
  id: string
  resignation_id: string
  work_handover: ProcessItem[]
  asset_return: ProcessItem[]
  procedures: ProcessItem[]
  overall_progress: number
}

export default function ResignationProcess() {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const resignationId = router.params.id || ''

  const [loading, setLoading] = useState(true)
  const [process, setProcess] = useState<ResignationProcess | null>(null)
  const [resignation, setResignation] = useState<any>(null)

  // 加载离职流程
  const loadProcess = useCallback(async () => {
    if (!resignationId) return

    setLoading(true)
    try {
      // 加载离职申请信息
      const {data: resignData, error: resignError} = await supabase
        .from('resignation_records')
        .select('*')
        .eq('id', resignationId)
        .maybeSingle()

      if (resignError) throw resignError
      setResignation(resignData)

      // 加载或创建离职流程
      let {data: processData, error: processError} = await supabase
        .from('resignation_process')
        .select('*')
        .eq('resignation_id', resignationId)
        .maybeSingle()

      if (processError && processError.code !== 'PGRST116') throw processError

      // 如果没有流程记录，创建默认流程
      if (!processData) {
        const defaultProcess = {
          resignation_id: resignationId,
          work_handover: [
            {
              id: '1',
              name: '工作文档整理',
              description: '整理并归档所有工作文档',
              completed: false,
              completed_at: null
            },
            {
              id: '2',
              name: '项目交接',
              description: '与接手人完成项目交接',
              completed: false,
              completed_at: null
            },
            {
              id: '3',
              name: '客户信息移交',
              description: '移交客户联系方式和沟通记录',
              completed: false,
              completed_at: null
            }
          ],
          asset_return: [
            {
              id: '1',
              name: '办公设备归还',
              description: '归还电脑、鼠标、键盘等办公设备',
              completed: false,
              completed_at: null
            },
            {
              id: '2',
              name: '门禁卡归还',
              description: '归还公司门禁卡和工牌',
              completed: false,
              completed_at: null
            },
            {
              id: '3',
              name: '办公用品归还',
              description: '归还文具、书籍等办公用品',
              completed: false,
              completed_at: null
            }
          ],
          procedures: [
            {
              id: '1',
              name: '人事手续办理',
              description: '完成人事部门的离职手续',
              completed: false,
              completed_at: null
            },
            {
              id: '2',
              name: '财务结算',
              description: '完成工资、报销等财务结算',
              completed: false,
              completed_at: null
            },
            {
              id: '3',
              name: '社保公积金转移',
              description: '办理社保和公积金转移手续',
              completed: false,
              completed_at: null
            }
          ],
          overall_progress: 0
        }

        const {data: newProcess, error: createError} = await supabase
          .from('resignation_process')
          .insert(defaultProcess)
          .select()
          .maybeSingle()

        if (createError) throw createError
        processData = newProcess
      }

      setProcess(processData)
    } catch (error) {
      console.error('加载离职流程失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [resignationId])

  useDidShow(() => {
    loadProcess()
  })

  // 切换任务完成状态
  const toggleTaskCompletion = async (category: 'work_handover' | 'asset_return' | 'procedures', taskId: string) => {
    if (!process) return

    try {
      const categoryData = process[category]
      const updatedData = categoryData.map((item) => {
        if (item.id === taskId) {
          return {
            ...item,
            completed: !item.completed,
            completed_at: !item.completed ? new Date().toISOString() : null
          }
        }
        return item
      })

      // 计算总进度
      const allTasks = [
        ...updatedData,
        ...process.work_handover.filter((_t) => category !== 'work_handover'),
        ...process.asset_return.filter((_t) => category !== 'asset_return'),
        ...process.procedures.filter((_t) => category !== 'procedures')
      ]
      const completedCount = allTasks.filter((t) => t.completed).length
      const totalCount = allTasks.length
      const progress = Math.round((completedCount / totalCount) * 100)

      const {error} = await supabase
        .from('resignation_process')
        .update({
          [category]: updatedData,
          overall_progress: progress
        })
        .eq('id', process.id)

      if (error) throw error

      Taro.showToast({
        title: '更新成功',
        icon: 'success'
      })

      loadProcess()
    } catch (error) {
      console.error('更新任务状态失败:', error)
      Taro.showToast({
        title: '更新失败',
        icon: 'none'
      })
    }
  }

  // 渲染任务列表
  const renderTaskList = (
    title: string,
    icon: string,
    tasks: ProcessItem[],
    category: 'work_handover' | 'asset_return' | 'procedures'
  ) => {
    const completedCount = tasks.filter((t) => t.completed).length
    const totalCount = tasks.length

    return (
      <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
        <View className="flex items-center justify-between mb-3">
          <View className="flex items-center gap-2">
            <View className={`${icon} text-xl text-blue-600`} />
            <Text className="text-base font-semibold text-foreground">{title}</Text>
          </View>
          <Text className="text-sm text-muted-foreground">
            {completedCount}/{totalCount}
          </Text>
        </View>

        <View className="space-y-2">
          {tasks.map((task) => (
            <View
              key={task.id}
              className={`p-3 rounded-lg border ${task.completed ? 'bg-blue-100 border-green-200' : 'bg-gray-50/50 border-border'}`}
              onClick={() => toggleTaskCompletion(category, task.id)}>
              <View className="flex items-start gap-3">
                <View
                  className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${task.completed ? 'bg-green-600' : 'bg-muted border-2 border-border'}`}>
                  {task.completed && <View className="i-mdi-check text-sm text-blue-600" />}
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-sm font-medium mb-1 ${task.completed ? 'text-green-600 line-through' : 'text-foreground'}`}>
                    {task.name}
                  </Text>
                  <Text className={`text-xs ${task.completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                    {task.description}
                  </Text>
                  {task.completed && task.completed_at && (
                    <Text className="text-xs text-muted-foreground mt-1">
                      完成时间：{new Date(task.completed_at).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {loading ? (
            <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center shadow-sm">
              <Text className="text-sm text-muted-foreground">加载中...</Text>
            </View>
          ) : (
            <>
              {/* 员工信息 */}
              {resignation && (
                <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
                  <View className="flex items-center gap-3 mb-3">
                    <View className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <View className="i-mdi-account text-2xl text-blue-600" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">{resignation.employee_name}</Text>
                      <Text className="text-sm text-muted-foreground">
                        {resignation.position} · {resignation.department}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* 总体进度 */}
              {process && (
                <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
                  <Text className="text-base font-semibold text-foreground mb-3">总体进度</Text>
                  <View className="flex items-center gap-3">
                    <View className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <View
                        className="h-full bg-blue-100 rounded-full transition-all"
                        style={{width: `${process.overall_progress}%`}}
                      />
                    </View>
                    <Text className="text-lg font-bold text-blue-600">{process.overall_progress}%</Text>
                  </View>
                </View>
              )}

              {/* 工作交接 */}
              {process && renderTaskList('工作交接', 'i-mdi-briefcase-outline', process.work_handover, 'work_handover')}

              {/* 物品归还 */}
              {process && renderTaskList('物品归还', 'i-mdi-package-variant', process.asset_return, 'asset_return')}

              {/* 离职手续 */}
              {process && renderTaskList('离职手续', 'i-mdi-file-document-outline', process.procedures, 'procedures')}

              {/* 完成按钮 */}
              {process && process.overall_progress === 100 && (
                <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
                  <Button
                    className="w-full bg-blue-100 text-white py-4 rounded-lg break-keep text-base"
                    size="default"
                    onClick={() => {
                      Taro.showToast({
                        title: '流程已完成',
                        icon: 'success'
                      })
                      setTimeout(() => {
                        Taro.navigateBack()
                      }, 1500)
                    }}>
                    确认完成所有流程
                  </Button>
                </View>
              )}

              {/* 底部占位 */}
              <View className="h-20" />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
