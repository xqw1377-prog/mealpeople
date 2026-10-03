/**
 * 物品领取管理页面
 * HR管理物品发放和归还
 */

import {Button, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {LoadingCards} from '@/components/common'
import {getEmployeeByUserId, getEmployeesByTenantId} from '@/db/api'
import type {Employee} from '@/db/types'

// 物品记录接口
interface ItemRecord {
  id: string
  employee_id: string
  employee_name: string
  item_name: string
  item_category: string
  quantity: number
  issue_date: string
  return_date?: string
  status: 'issued' | 'returned'
  notes?: string
}

export default function ItemManagement() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [_employees, setEmployees] = useState<Employee[]>([])
  const [itemRecords, setItemRecords] = useState<ItemRecord[]>([])
  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // 加载数据
  const loadData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      const employeeList = await getEmployeesByTenantId(employee.tenant_id)
      setEmployees(employeeList)

      // TODO: 从数据库加载物品记录
      // 这里使用模拟数据
      const mockRecords: ItemRecord[] = []
      setItemRecords(mockRecords)
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useDidShow(() => {
    loadData()
  })

  // 过滤物品记录
  const filteredRecords = itemRecords.filter((record) => {
    const matchSearch =
      searchText === '' || record.employee_name.includes(searchText) || record.item_name.includes(searchText)
    const matchStatus = filterStatus === 'all' || record.status === filterStatus
    return matchSearch && matchStatus
  })

  // 发放物品
  const handleIssueItem = () => {
    Taro.navigateTo({
      url: '/pages/onboarding/item-issue/index'
    })
  }

  // 归还物品
  const handleReturnItem = (_recordId: string) => {
    Taro.showModal({
      title: '确认归还',
      content: '确认该物品已归还？',
      success: (res) => {
        if (res.confirm) {
          // TODO: 更新物品状态为已归还
          Taro.showToast({
            title: '归还成功',
            icon: 'success'
          })
          loadData()
        }
      }
    })
  }

  if (loading) {
    return <LoadingCards />
  }

  return (
    <View className="min-h-screen" style={{background: 'linear-gradient(to bottom, #f0f9ff, #ffffff)'}}>
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="bg-white rounded-xl p-6 mb-4 border border-border">
            <View className="flex items-center mb-3">
              <View className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mr-3">
                <View className="i-mdi-package-variant text-3xl text-indigo-600" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground block mb-1">物品领取管理</Text>
                <Text className="text-sm text-muted-foreground block">管理物品发放和归还</Text>
              </View>
            </View>

            {/* 统计信息 */}
            <View className="grid grid-cols-3 gap-3 mt-4">
              <View className="bg-blue-50 rounded-lg p-3 text-center">
                <Text className="text-2xl font-bold text-blue-600 block mb-1">{itemRecords.length}</Text>
                <Text className="text-xs text-muted-foreground block">总记录</Text>
              </View>
              <View className="bg-green-50 rounded-lg p-3 text-center">
                <Text className="text-2xl font-bold text-green-600 block mb-1">
                  {itemRecords.filter((r) => r.status === 'issued').length}
                </Text>
                <Text className="text-xs text-muted-foreground block">已发放</Text>
              </View>
              <View className="bg-gray-50 rounded-lg p-3 text-center">
                <Text className="text-2xl font-bold text-gray-600 block mb-1">
                  {itemRecords.filter((r) => r.status === 'returned').length}
                </Text>
                <Text className="text-xs text-muted-foreground block">已归还</Text>
              </View>
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="mb-4">
            <Button
              className="w-full bg-primary text-white py-4 rounded-lg break-keep text-base"
              size="default"
              onClick={handleIssueItem}>
              <View className="flex items-center justify-center gap-2">
                <View className="i-mdi-plus-circle text-xl" />
                <Text>发放物品</Text>
              </View>
            </Button>
          </View>

          {/* 搜索和筛选 */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-border">
            <View style={{overflow: 'hidden'}} className="mb-3">
              <Input
                className="bg-muted text-foreground px-4 py-3 rounded-lg border border-border w-full"
                placeholder="搜索员工或物品名称"
                value={searchText}
                onInput={(e) => setSearchText(e.detail.value)}
              />
            </View>

            <View className="flex flex-wrap gap-2">
              <View
                className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
                  filterStatus === 'all' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => setFilterStatus('all')}>
                <Text className="text-sm">全部</Text>
              </View>
              <View
                className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
                  filterStatus === 'issued' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => setFilterStatus('issued')}>
                <Text className="text-sm">已发放</Text>
              </View>
              <View
                className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
                  filterStatus === 'returned' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => setFilterStatus('returned')}>
                <Text className="text-sm">已归还</Text>
              </View>
            </View>
          </View>

          {/* 物品记录列表 */}
          {filteredRecords.length === 0 ? (
            <View className="bg-white rounded-xl p-8 text-center border border-border">
              <View className="i-mdi-inbox text-6xl text-muted-foreground mb-4" />
              <Text className="text-base text-muted-foreground block mb-2">暂无物品记录</Text>
              <Text className="text-sm text-muted-foreground block">点击上方按钮发放物品</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {filteredRecords.map((record) => (
                <View key={record.id} className="bg-white rounded-xl p-4 border border-border">
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-foreground block mb-1">{record.item_name}</Text>
                      <Text className="text-sm text-muted-foreground block">{record.employee_name}</Text>
                    </View>
                    <View
                      className={`px-3 py-1 rounded-full ${
                        record.status === 'issued' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                      <Text className="text-xs font-medium">{record.status === 'issued' ? '已发放' : '已归还'}</Text>
                    </View>
                  </View>

                  <View className="grid grid-cols-2 gap-2 mb-3">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-tag text-base text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">{record.item_category}</Text>
                    </View>
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-counter text-base text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">数量: {record.quantity}</Text>
                    </View>
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-calendar text-base text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">
                        发放: {new Date(record.issue_date).toLocaleDateString()}
                      </Text>
                    </View>
                    {record.return_date && (
                      <View className="flex items-center gap-2">
                        <View className="i-mdi-calendar-check text-base text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">
                          归还: {new Date(record.return_date).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>

                  {record.notes && (
                    <View className="bg-muted rounded-lg p-3 mb-3">
                      <Text className="text-sm text-muted-foreground">{record.notes}</Text>
                    </View>
                  )}

                  {record.status === 'issued' && (
                    <Button
                      className="w-full bg-muted text-foreground py-3 rounded-lg break-keep text-sm"
                      size="default"
                      onClick={() => handleReturnItem(record.id)}>
                      确认归还
                    </Button>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
