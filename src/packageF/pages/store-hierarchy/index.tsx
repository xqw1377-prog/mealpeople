/**
 * 门店组织架构配置页面
 * 功能：
 * 1. 店铺选择
 * 2. 顶岗原则配置
 * 3. 组织架构展示
 */

import {Button, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useState} from 'react'
import {getEmployeesByStoreId, getPositionsByTenantId, getStoresByTenantId} from '@/db/api'
import {getStoreHierarchy, upsertStoreHierarchy} from '@/db/api-store-hierarchy'
import type {Employee, PositionConfig, Store} from '@/db/types'
import type {StoreHierarchy} from '@/db/types-v2'
import {useTenantStore} from '@/store/tenant'

type TabType = 'tree' | 'principle'

// 组织架构节点
interface HierarchyNode {
  position: PositionConfig
  employees: Employee[]
  displayOrder: number
}

const StoreHierarchyPage: React.FC = () => {
  const {user} = useAuth({guard: true})
  // 使用 selector 方式获取 store 状态
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // 状态管理
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<TabType>('principle')
  const [loading, setLoading] = useState(false)

  // 顶岗原则配置
  const [config, setConfig] = useState<StoreHierarchy | null>(null)
  const [schedulingPrinciple, setSchedulingPrinciple] = useState<'top_only' | 'top_and_down'>('top_only')

  // 组织架构数据
  const [_positions, setPositions] = useState<PositionConfig[]>([])
  const [_employees, setEmployees] = useState<Employee[]>([])
  const [hierarchyNodes, setHierarchyNodes] = useState<HierarchyNode[]>([])

  // 加载店铺列表
  const loadStores = async () => {
    if (!currentTenant) {
      console.log('⚠️ 没有当前租户')
      return
    }

    try {
      console.log('=== 开始加载店铺列表 ===', {tenantId: currentTenant.id})
      const storeList = await getStoresByTenantId(currentTenant.id)
      console.log('=== 店铺列表加载成功 ===', {count: storeList.length})
      setStores(storeList)

      if (storeList.length > 0) {
        console.log('=== 自动选择第一个店铺 ===', {storeId: storeList[0].id})
        setSelectedStoreIndex(0)
        // 加载第一个店铺的配置
        await loadConfig(storeList[0].id)
      }

      setError('')
    } catch (err) {
      console.error('❌ 加载店铺失败:', err)
      setError(`加载店铺失败: ${err instanceof Error ? err.message : String(err)}`)
      Taro.showToast({
        title: '加载店铺失败',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 加载顶岗原则配置
  const loadConfig = async (storeId: string) => {
    if (!storeId) return

    setLoading(true)
    try {
      console.log('=== 加载顶岗原则配置 ===', {storeId})
      const storeConfig = await getStoreHierarchy(storeId)
      if (storeConfig) {
        console.log('=== 配置加载成功 ===', storeConfig)
        setConfig(storeConfig)
        setSchedulingPrinciple(storeConfig.scheduling_principle)
      } else {
        console.log('=== 暂无配置，使用默认值 ===')
        setConfig(null)
        setSchedulingPrinciple('top_only')
      }
    } catch (err) {
      console.error('❌ 加载配置失败:', err)
      Taro.showToast({
        title: '加载配置失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  // 保存顶岗原则配置
  const handleSaveConfig = async () => {
    const selectedStore = stores[selectedStoreIndex]
    if (!selectedStore || !currentTenant) return

    setLoading(true)
    try {
      console.log('=== 保存顶岗原则配置 ===', {
        storeId: selectedStore.id,
        principle: schedulingPrinciple
      })

      const configData = {
        store_id: selectedStore.id,
        tenant_id: currentTenant.id,
        scheduling_principle: schedulingPrinciple
      }

      const result = await upsertStoreHierarchy(configData)
      if (result) {
        console.log('=== 配置保存成功 ===')
        Taro.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 2000
        })
        setConfig(result)
      } else {
        throw new Error('保存失败')
      }
    } catch (err) {
      console.error('❌ 保存配置失败:', err)
      Taro.showToast({
        title: '保存失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  // 加载组织架构数据
  const loadHierarchyData = async () => {
    const selectedStore = stores[selectedStoreIndex]
    if (!selectedStore || !currentTenant) return

    setLoading(true)
    try {
      console.log('=== 加载组织架构数据 ===', {storeId: selectedStore.id})

      // 加载岗位配置
      const positionList = await getPositionsByTenantId(currentTenant.id)
      console.log('=== 岗位列表 ===', {count: positionList.length})
      setPositions(positionList)

      // 加载员工列表
      const employeeList = await getEmployeesByStoreId(selectedStore.id)
      console.log('=== 员工列表 ===', {count: employeeList.length})
      setEmployees(employeeList)

      // 构建组织架构树
      const nodes: HierarchyNode[] = positionList
        .sort((a, b) => a.display_order - b.display_order)
        .map((position) => ({
          position,
          employees: employeeList.filter((emp) => emp.position === position.position_name),
          displayOrder: position.display_order
        }))

      console.log('=== 组织架构节点 ===', {count: nodes.length})
      setHierarchyNodes(nodes)
    } catch (err) {
      console.error('❌ 加载组织架构数据失败:', err)
      Taro.showToast({
        title: '加载数据失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  // 页面初始化
  useDidShow(() => {
    console.log('=== 页面显示 ===')
    const initPage = async () => {
      try {
        setPageLoading(true)
        setError('')
        console.log('=== 开始初始化页面 ===')
        await loadStores()
        console.log('=== 页面初始化完成 ===')
      } catch (err) {
        console.error('❌ 页面初始化失败:', err)
        setError(`页面初始化失败: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setPageLoading(false)
      }
    }
    initPage()
  })

  // 处理店铺切换
  const handleStoreChange = async (e: any) => {
    const newIndex = Number(e.detail.value)
    setSelectedStoreIndex(newIndex)
    const selectedStore = stores[newIndex]
    if (selectedStore) {
      await loadConfig(selectedStore.id)
      if (activeTab === 'tree') {
        await loadHierarchyData()
      }
    }
  }

  // 处理Tab切换
  const handleTabChange = async (tab: TabType) => {
    setActiveTab(tab)
    if (tab === 'tree' && stores[selectedStoreIndex]) {
      await loadHierarchyData()
    }
  }

  // 检查租户
  if (!user) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Text className="text-muted-foreground">请先登录</Text>
      </View>
    )
  }

  if (!currentTenant) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Text className="text-muted-foreground">请先选择租户</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-4">
            <Text className="text-xl font-bold text-foreground block mb-1">门店组织架构</Text>
            <Text className="text-sm text-foreground block">配置排班原则和组织架构</Text>
          </View>

          {/* 页面加载状态 */}
          {pageLoading && (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center shadow-sm mb-4">
              <View className="i-mdi-loading text-4xl text-blue-500 animate-spin mx-auto mb-4" />
              <Text className="text-sm text-muted-foreground block">正在加载页面...</Text>
            </View>
          )}

          {/* 错误提示 */}
          {error && (
            <View className="bg-blue-100 border border-red-200 rounded-lg p-4 mb-4">
              <View className="flex items-start gap-3">
                <View className="i-mdi-alert-circle text-2xl text-red-500 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-sm font-bold text-red-600 block mb-2">加载失败</Text>
                  <Text className="text-xs text-red-600 block mb-3">{error}</Text>
                  <Button
                    className="bg-blue-100 text-white rounded text-xs break-keep px-4 py-2"
                    size="mini"
                    onClick={() => {
                      setError('')
                      setPageLoading(true)
                      loadStores().finally(() => setPageLoading(false))
                    }}>
                    重新加载
                  </Button>
                </View>
              </View>
            </View>
          )}

          {/* 主要内容 */}
          {!pageLoading && !error && (
            <View>
              {/* 店铺选择 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                <Text className="text-sm font-bold text-foreground mb-3 block">选择店铺</Text>
                {stores.length === 0 ? (
                  <View className="text-center py-8">
                    <View className="i-mdi-store-off text-6xl text-gray-300 mx-auto mb-4" />
                    <Text className="text-sm text-muted-foreground block mb-2">暂无店铺</Text>
                    <Text className="text-xs text-muted-foreground block">请先在管理中心添加店铺</Text>
                  </View>
                ) : (
                  <Picker
                    mode="selector"
                    range={stores.map((s) => s.name)}
                    value={selectedStoreIndex}
                    onChange={handleStoreChange}>
                    <View className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
                      <Text className="text-base text-foreground">
                        {stores[selectedStoreIndex]?.name || '请选择店铺'}
                      </Text>
                    </View>
                  </Picker>
                )}
              </View>

              {/* Tab切换 */}
              {stores.length > 0 && (
                <View className="bg-white rounded-lg p-2 mb-4 shadow-sm flex gap-2 border-2 border-gray-200">
                  <Button
                    className={`flex-1 py-2 rounded text-sm break-keep ${
                      activeTab === 'principle' ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'
                    }`}
                    size="default"
                    onClick={() => handleTabChange('principle')}>
                    顶岗原则
                  </Button>
                  <Button
                    className={`flex-1 py-2 rounded text-sm break-keep ${
                      activeTab === 'tree' ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'
                    }`}
                    size="default"
                    onClick={() => handleTabChange('tree')}>
                    组织架构
                  </Button>
                </View>
              )}

              {/* 顶岗原则Tab */}
              {stores.length > 0 && activeTab === 'principle' && (
                <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                  <View className="mb-4">
                    <Text className="text-base font-bold text-foreground block mb-2">顶岗原则配置</Text>
                    <Text className="text-xs text-muted-foreground block">
                      配置员工顶岗时的岗位选择原则，影响排班时的岗位分配逻辑
                    </Text>
                  </View>

                  {loading ? (
                    <View className="text-center py-8">
                      <View className="i-mdi-loading text-4xl text-blue-500 animate-spin mx-auto mb-4" />
                      <Text className="text-sm text-muted-foreground block">加载中...</Text>
                    </View>
                  ) : (
                    <View>
                      {/* 原则选择 */}
                      <View className="space-y-3 mb-6">
                        <View
                          className={`border-2 rounded-lg p-4 cursor-pointer ${
                            schedulingPrinciple === 'top_only'
                              ? 'border-blue-500 bg-blue-100'
                              : 'border-gray-200 bg-white'
                          }`}
                          onClick={() => setSchedulingPrinciple('top_only')}>
                          <View className="flex items-start gap-3">
                            <View
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                schedulingPrinciple === 'top_only' ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
                              }`}>
                              {schedulingPrinciple === 'top_only' && <View className="w-2 h-2 rounded-full bg-white" />}
                            </View>
                            <View className="flex-1">
                              <Text className="text-sm font-bold text-foreground block mb-1">只能顶上级岗位</Text>
                              <Text className="text-xs text-muted-foreground block">
                                员工只能顶替比自己岗位等级高的岗位，不能顶替同级或下级岗位
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View
                          className={`border-2 rounded-lg p-4 cursor-pointer ${
                            schedulingPrinciple === 'top_and_down'
                              ? 'border-blue-500 bg-blue-100'
                              : 'border-gray-200 bg-white'
                          }`}
                          onClick={() => setSchedulingPrinciple('top_and_down')}>
                          <View className="flex items-start gap-3">
                            <View
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                schedulingPrinciple === 'top_and_down'
                                  ? 'border-blue-500 bg-blue-100'
                                  : 'border-gray-300'
                              }`}>
                              {schedulingPrinciple === 'top_and_down' && (
                                <View className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </View>
                            <View className="flex-1">
                              <Text className="text-sm font-bold text-foreground block mb-1">可以顶上级和下级岗位</Text>
                              <Text className="text-xs text-muted-foreground block">
                                员工可以顶替任何岗位，包括上级、同级和下级岗位
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* 保存按钮 */}
                      <Button
                        className="w-full bg-blue-100 text-white rounded-lg py-3 text-base break-keep"
                        size="default"
                        onClick={handleSaveConfig}
                        loading={loading}>
                        保存配置
                      </Button>

                      {/* 当前配置状态 */}
                      {config && (
                        <View className="mt-4 p-3 bg-blue-100 border border-green-200 rounded-lg">
                          <Text className="text-xs text-green-600 block">
                            ✓ 当前配置：
                            {config.scheduling_principle === 'top_only' ? '只能顶上级岗位' : '可以顶上级和下级岗位'}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* 组织架构Tab */}
              {stores.length > 0 && activeTab === 'tree' && (
                <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                  <View className="mb-4">
                    <Text className="text-base font-bold text-foreground block mb-2">组织架构</Text>
                    <Text className="text-xs text-muted-foreground block">查看当前店铺的岗位层级和员工分布</Text>
                  </View>

                  {loading ? (
                    <View className="text-center py-8">
                      <View className="i-mdi-loading text-4xl text-blue-500 animate-spin mx-auto mb-4" />
                      <Text className="text-sm text-muted-foreground block">加载中...</Text>
                    </View>
                  ) : hierarchyNodes.length === 0 ? (
                    <View className="text-center py-8">
                      <View className="i-mdi-file-tree-outline text-6xl text-gray-300 mx-auto mb-4" />
                      <Text className="text-sm text-muted-foreground block mb-2">暂无组织架构数据</Text>
                      <Text className="text-xs text-muted-foreground block">请先配置岗位和员工</Text>
                    </View>
                  ) : (
                    <View className="space-y-4">
                      {hierarchyNodes.map((node) => (
                        <View key={node.position.id} className="border border-gray-200 rounded-lg p-4">
                          {/* 岗位信息 */}
                          <View className="flex items-center gap-3 mb-3">
                            <View
                              className="w-8 h-8 rounded-full bg-blue-100 text-white flex items-center justify-center text-sm font-bold"
                              style={{paddingLeft: `${node.displayOrder * 8}px`}}>
                              {node.displayOrder}
                            </View>
                            <View className="flex-1">
                              <Text className="text-base font-bold text-foreground block">
                                {node.position.position_name}
                              </Text>
                              <Text className="text-xs text-muted-foreground block">
                                Order {node.displayOrder} · {node.employees.length} employees
                              </Text>
                            </View>
                          </View>

                          {/* 员工列表 */}
                          {node.employees.length > 0 && (
                            <View className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                              {node.employees.map((emp) => (
                                <View key={emp.id} className="px-3 py-1 bg-muted rounded-full">
                                  <Text className="text-xs text-foreground">{emp.name}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default StoreHierarchyPage
