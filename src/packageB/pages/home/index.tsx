import {Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {navigateTo, showToast, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {SkeletonCard, SkeletonStatCard} from '@/components/Skeleton'
import {getBrandsByTenantId, getEnhancedDashboardData, getStoresByTenantId} from '@/db/api'
import type {Brand, Store} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const Home: React.FC = () => {
  // 认证检查
  const {user} = useAuth({guard: true})

  // 租户和门店状态
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentUser = useTenantStore((state) => state.currentUser)
  const currentStore = useTenantStore((state) => state.currentStore)
  const setCurrentStore = useTenantStore((state) => state.setCurrentStore)

  // 页面状态
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0)
  const [selectedBrandIndex, setSelectedBrandIndex] = useState(0)
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null)
  const [filteredStores, setFilteredStores] = useState<Store[]>([])

  console.log('=== 首页组件渲染 ===', {
    用户ID: user?.id,
    租户: currentTenant?.name,
    门店: currentStore?.name,
    品牌: currentBrand?.name,
    加载中: loading,
    品牌列表长度: brands.length,
    门店列表长度: stores.length,
    过滤后门店长度: filteredStores.length,
    选中品牌索引: selectedBrandIndex,
    选中门店索引: selectedStoreIndex
  })

  // 加载品牌列表（不自动选择，避免覆盖用户选择）
  const loadBrands = useCallback(async () => {
    if (!currentTenant?.id) {
      console.log('=== 租户ID不存在，跳过加载品牌 ===')
      return null
    }

    try {
      console.log('=== 开始加载品牌列表 ===', {tenantId: currentTenant.id})
      const brandList = await getBrandsByTenantId(currentTenant.id)
      console.log('=== 品牌列表加载完成 ===', {品牌数量: brandList.length})

      setBrands(brandList)

      // 🔥 不在这里自动选择品牌，由初始化useEffect处理
      // 这样可以避免覆盖用户的手动选择
      return brandList.length > 0 ? brandList[0] : null
    } catch (error) {
      console.error('=== 加载品牌列表失败 ===', error)
      showToast({
        title: '加载品牌失败',
        icon: 'none',
        duration: 2000
      })
      return null
    }
  }, [currentTenant?.id])

  // 加载门店列表（不依赖currentBrand，避免覆盖用户选择）
  const loadStores = useCallback(async () => {
    if (!currentTenant?.id) {
      console.log('=== 租户ID不存在，跳过加载门店 ===')
      return
    }

    try {
      console.log('=== 开始加载门店列表 ===', {tenantId: currentTenant.id})
      const storeList = await getStoresByTenantId(currentTenant.id)
      console.log('=== 门店列表加载完成 ===', {门店数量: storeList.length})

      setStores(storeList)

      // 🔥 不在这里过滤门店，由handleBrandChange或初始化逻辑处理
      // 这样可以避免覆盖用户的手动选择
    } catch (error) {
      console.error('=== 加载门店列表失败 ===', error)
      showToast({
        title: '加载门店失败',
        icon: 'none',
        duration: 2000
      })
    }
  }, [currentTenant?.id])

  // 处理品牌选择变化
  const handleBrandChange = useCallback(
    (e: any) => {
      try {
        console.log('========== handleBrandChange 被调用 ==========')
        console.log('事件对象:', e)
        console.log('e.detail:', e.detail)
        console.log('e.detail.value:', e.detail.value)

        const index = Number(e.detail.value)
        console.log('选择的索引:', index)
        console.log('品牌列表:', brands)
        console.log('选择的品牌:', brands[index])

        if (!brands[index]) {
          console.error('❌ 品牌索引越界:', index, '品牌列表长度:', brands.length)
          showToast({title: '选择失败，请重试', icon: 'error'})
          return
        }

        setSelectedBrandIndex(index)
        const selectedBrand = brands[index]
        console.log('=== 用户选择品牌 ===', selectedBrand)
        setCurrentBrand(selectedBrand)

        // 过滤门店列表
        const filtered = stores.filter((s) => s.brand_id === selectedBrand.id)
        console.log('过滤后的门店列表:', filtered)
        setFilteredStores(filtered)

        // 如果过滤后有门店，自动选择第一个
        if (filtered.length > 0) {
          setCurrentStore(filtered[0])
          setSelectedStoreIndex(0)
          console.log('✅ 自动选择第一个门店:', filtered[0])
          Taro.eventCenter.trigger('storeChanged', {
            store: filtered[0],
            timestamp: Date.now()
          })
          showToast({title: `已切换到${selectedBrand.name}`, icon: 'success', duration: 1500})
        } else {
          // 如果没有门店，清空当前门店
          setCurrentStore(null)
          setSelectedStoreIndex(0)
          console.log('⚠️ 该品牌下没有门店')
          showToast({title: `${selectedBrand.name}下暂无门店`, icon: 'none', duration: 1500})
        }
      } catch (error) {
        console.error('❌ handleBrandChange 错误:', error)
        showToast({title: '切换失败，请重试', icon: 'error'})
      }
    },
    [brands, stores, setCurrentStore]
  )

  // 处理门店选择变化
  const handleStoreChange = useCallback(
    (e: any) => {
      try {
        console.log('========== handleStoreChange 被调用 ==========')
        console.log('事件对象:', e)
        console.log('e.detail:', e.detail)
        console.log('e.detail.value:', e.detail.value)

        const index = Number(e.detail.value)
        console.log('选择的索引:', index)
        console.log('门店列表:', filteredStores)
        console.log('选择的门店:', filteredStores[index])

        if (!filteredStores[index]) {
          console.error('❌ 门店索引越界:', index, '门店列表长度:', filteredStores.length)
          showToast({title: '选择失败，请重试', icon: 'error'})
          return
        }

        setSelectedStoreIndex(index)
        const selectedStore = filteredStores[index]
        console.log('=== 用户选择门店 ===', selectedStore)
        setCurrentStore(selectedStore)

        // 🔥 发送门店切换事件，通知所有页面刷新数据
        console.log('=== 发送门店切换事件 ===', {
          storeId: selectedStore.id,
          storeName: selectedStore.name,
          timestamp: Date.now()
        })
        Taro.eventCenter.trigger('storeChanged', {
          store: selectedStore,
          timestamp: Date.now()
        })

        // 门店切换后重新加载数据
        showToast({title: `已切换到${selectedStore.name}`, icon: 'success', duration: 1500})
      } catch (error) {
        console.error('❌ handleStoreChange 错误:', error)
        showToast({title: '切换失败，请重试', icon: 'error'})
      }
    },
    [filteredStores, setCurrentStore]
  )

  const loadData = useCallback(async () => {
    console.log('=== loadData 被调用 ===', {
      租户存在: !!currentTenant,
      门店存在: !!currentStore
    })

    if (!currentTenant) {
      console.log('=== 租户未选择，显示租户选择提示 ===')
      setLoading(false)
      return
    }

    if (!currentStore) {
      console.log('=== 等待门店选择 ===')
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      console.log('=== 开始加载仪表盘数据 ===', {
        租户ID: currentTenant.id,
        门店ID: currentStore.id
      })

      const data = await getEnhancedDashboardData(currentTenant.id, {
        storeId: currentStore.id
      })

      console.log('=== 仪表盘数据加载成功 ===', {
        数据结构: data ? '✓' : '✗',
        basic存在: data?.basic ? '✓' : '✗',
        today存在: data?.basic?.today ? '✓' : '✗',
        accumulated存在: data?.basic?.accumulated ? '✓' : '✗',
        完整数据: JSON.stringify(data)
      })

      setDashboardData(data)
    } catch (error) {
      console.error('=== 加载数据失败 ===', error)
      showToast({
        title: error instanceof Error ? error.message : '加载失败，请重试',
        icon: 'none',
        duration: 2000
      })
      setDashboardData(null)
    } finally {
      setLoading(false)
    }
  }, [currentTenant, currentStore])

  // 下拉刷新处理
  const handleRefresh = async () => {
    if (refreshing) return

    setRefreshing(true)
    try {
      await loadData()
      setTimeout(() => {
        setRefreshing(false)
        showToast({title: '刷新成功', icon: 'success', duration: 1500})
      }, 500)
    } catch (_error) {
      setRefreshing(false)
      showToast({title: '刷新失败', icon: 'error'})
    }
  }

  // 首次加载品牌和门店列表
  useEffect(() => {
    console.log('=== 首次加载：开始加载品牌和门店 ===', {
      租户存在: !!currentTenant,
      租户ID: currentTenant?.id,
      租户名称: currentTenant?.name
    })

    if (!currentTenant) {
      console.log('=== 租户未选择，跳过加载 ===')
      setLoading(false)
      return
    }

    loadBrands()
    loadStores()
  }, [loadBrands, loadStores, currentTenant])

  // 🔥 新增：当品牌和门店列表都加载完成后，进行初始化选择
  useEffect(() => {
    console.log('=== 检查是否需要初始化选择 ===', {
      品牌数量: brands.length,
      门店数量: stores.length,
      过滤后门店数量: filteredStores.length,
      当前品牌: currentBrand?.name,
      当前门店: currentStore?.name,
      品牌列表: brands.map((b) => ({id: b.id, name: b.name})),
      门店列表: stores.map((s) => ({id: s.id, name: s.name, brand_id: s.brand_id}))
    })

    // 只在初始化时执行（品牌和门店都已加载，但还没有选择）
    if (brands.length > 0 && stores.length > 0 && !currentBrand && !currentStore) {
      console.log('=== 开始初始化选择 ===')

      // 1. 选择第一个品牌
      const firstBrand = brands[0]
      console.log('=== 初始化：选择第一个品牌 ===', {
        品牌ID: firstBrand.id,
        品牌名称: firstBrand.name
      })

      // 2. 过滤该品牌下的门店
      const filtered = stores.filter((s) => s.brand_id === firstBrand.id)
      console.log('=== 初始化：过滤门店列表 ===', {
        品牌ID: firstBrand.id,
        总门店数: stores.length,
        过滤后数量: filtered.length,
        过滤后门店: filtered.map((s) => ({id: s.id, name: s.name, brand_id: s.brand_id})),
        所有门店的brand_id: stores.map((s) => s.brand_id)
      })

      // 🔥 修复：如果过滤后没有门店，使用所有门店（可能是数据不一致）
      const finalFiltered = filtered.length > 0 ? filtered : stores
      if (filtered.length === 0 && stores.length > 0) {
        console.warn('⚠️ 警告：品牌下没有匹配的门店，使用所有门店作为fallback')
      }

      // 3. 设置状态（批量更新）
      setCurrentBrand(firstBrand)
      setSelectedBrandIndex(0)
      setFilteredStores(finalFiltered)

      // 4. 选择第一个门店
      if (finalFiltered.length > 0) {
        setCurrentStore(finalFiltered[0])
        setSelectedStoreIndex(0)
        console.log('=== 初始化：选择第一个门店 ===', {
          门店ID: finalFiltered[0].id,
          门店名称: finalFiltered[0].name,
          品牌ID: finalFiltered[0].brand_id
        })

        // 发送门店切换事件
        Taro.eventCenter.trigger('storeChanged', {
          store: finalFiltered[0],
          timestamp: Date.now()
        })
      } else {
        console.log('⚠️ 初始化：没有可用的门店')
      }
    } else {
      console.log('=== 不满足初始化条件 ===', {
        原因:
          brands.length === 0
            ? '品牌列表为空'
            : stores.length === 0
              ? '门店列表为空'
              : currentBrand
                ? '已有当前品牌'
                : currentStore
                  ? '已有当前门店'
                  : '未知原因'
      })
    }
  }, [brands, stores, currentBrand, currentStore, setCurrentStore, filteredStores.length])

  // 🔥 新增：当品牌和门店列表加载完成，且已有选中的门店时，自动恢复品牌和门店列表
  // 这个逻辑处理用户登录后从 zustand store 恢复门店选择的情况
  useEffect(() => {
    // 条件：品牌和门店都已加载，有选中的门店（从 zustand 恢复），但品牌和过滤列表未初始化
    if (brands.length > 0 && stores.length > 0 && currentStore && !currentBrand && filteredStores.length === 0) {
      console.log('=== 检测到需要从门店恢复品牌和门店列表 ===', {
        当前门店: currentStore.name,
        门店品牌ID: currentStore.brand_id,
        品牌列表长度: brands.length,
        总门店数: stores.length
      })

      // 根据当前门店的 brand_id 找到对应的品牌
      const storeBrand = brands.find((b) => b.id === currentStore.brand_id)
      if (storeBrand) {
        console.log('=== 恢复品牌信息 ===', {
          品牌ID: storeBrand.id,
          品牌名称: storeBrand.name
        })

        // 设置当前品牌
        setCurrentBrand(storeBrand)

        // 找到该品牌在列表中的索引
        const brandIndex = brands.findIndex((b) => b.id === storeBrand.id)
        if (brandIndex !== -1) {
          setSelectedBrandIndex(brandIndex)
        }

        // 过滤该品牌下的门店
        const filtered = stores.filter((s) => s.brand_id === storeBrand.id)
        console.log('=== 恢复门店列表：过滤结果 ===', {
          过滤后数量: filtered.length,
          过滤后门店: filtered.map((s) => ({id: s.id, name: s.name}))
        })

        if (filtered.length > 0) {
          setFilteredStores(filtered)

          // 找到当前门店在过滤列表中的索引
          const storeIndex = filtered.findIndex((s) => s.id === currentStore.id)
          if (storeIndex !== -1) {
            setSelectedStoreIndex(storeIndex)
            console.log('=== 恢复门店列表：保持当前门店选择 ===', {
              门店: currentStore.name,
              索引: storeIndex
            })
          } else {
            // 如果当前门店不在过滤列表中（数据不一致），选择第一个
            console.warn('⚠️ 当前门店不在品牌门店列表中，选择第一个门店')
            setCurrentStore(filtered[0])
            setSelectedStoreIndex(0)

            // 发送门店切换事件
            Taro.eventCenter.trigger('storeChanged', {
              store: filtered[0],
              timestamp: Date.now()
            })
          }
        }
      } else {
        console.warn('⚠️ 未找到门店对应的品牌，品牌ID:', currentStore.brand_id)
      }
    }
  }, [brands, stores, currentBrand, filteredStores.length, currentStore, setCurrentStore])

  // 门店选择后加载数据
  useEffect(() => {
    if (currentStore) {
      loadData()
    }

    // 监听排班数据更新事件
    const handleScheduleUpdate = (data?: any) => {
      console.log('========== 首页收到排班数据更新事件 ==========')
      console.log('事件数据:', data)
      console.log('当前门店:', currentStore?.name)
      console.log('开始重新加载数据...')
      loadData()
    }

    Taro.eventCenter.on('scheduleDataUpdated', handleScheduleUpdate)

    // 清理事件监听
    return () => {
      Taro.eventCenter.off('scheduleDataUpdated', handleScheduleUpdate)
    }
  }, [loadData, currentStore])

  // 监听租户切换事件（独立的 useEffect，避免与其他逻辑混合）
  useEffect(() => {
    const handleTenantChange = async () => {
      console.log('=== 收到租户切换事件，清空门店并重新加载 ===')
      // 🔥 先清空当前门店，避免使用旧门店数据
      setCurrentStore(null)
      setStores([])
      setFilteredStores([])
      setBrands([])
      setCurrentBrand(null)

      // 然后重新加载品牌和门店（按顺序）
      if (currentTenant?.id) {
        console.log('=== 开始按顺序加载品牌和门店 ===')
        const selectedBrand = await loadBrands()
        console.log('=== 品牌加载完成，开始加载门店 ===', selectedBrand)
        // 等待一小段时间，确保状态更新完成
        await new Promise((resolve) => setTimeout(resolve, 100))
        await loadStores()
      }
    }

    Taro.eventCenter.on('tenantChanged', handleTenantChange)

    return () => {
      Taro.eventCenter.off('tenantChanged', handleTenantChange)
    }
  }, [currentTenant?.id, loadBrands, loadStores, setCurrentStore])

  useDidShow(() => {
    console.log('=== 首页显示，仅重新加载数据 ===')
    // 🔥 只重新加载数据，不重新加载品牌和门店列表
    // 避免重复触发门店自动选择导致闪跳
    if (currentStore) {
      loadData()
    }
  })

  // 🔥 监听品牌和门店数据变化，用于调试
  useEffect(() => {
    console.log('=== 品牌数据变化 ===', {
      品牌列表: brands,
      品牌数量: brands.length,
      品牌名称数组: brands.map((b) => b.name),
      当前品牌: currentBrand,
      选中索引: selectedBrandIndex
    })
  }, [brands, currentBrand, selectedBrandIndex])

  useEffect(() => {
    console.log('=== 门店数据变化 ===', {
      门店列表: stores,
      门店数量: stores.length,
      过滤后门店: filteredStores,
      过滤后数量: filteredStores.length,
      门店名称数组: filteredStores.map((s) => s.name),
      当前门店: currentStore,
      选中索引: selectedStoreIndex
    })
  }, [stores, filteredStores, currentStore, selectedStoreIndex])

  // 评估函数
  // 人力成本占比评估标准：20%以内优秀，20-25%良好，超过25%偏高
  const getCostRatioStatus = (ratio: number) => {
    if (ratio <= 20) return {text: '优秀', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    if (ratio <= 25) return {text: '良好', color: 'text-white', bgColor: 'bg-blue-100'}
    return {text: '偏高', color: 'text-red-600', bgColor: 'bg-blue-100'}
  }

  const getEfficiencyStatus = (efficiency: number) => {
    if (efficiency >= 1500) return {text: '优秀', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    if (efficiency >= 1000) return {text: '良好', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    return {text: '待提升', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
  }

  const getContributionStatus = (contribution: number) => {
    if (contribution >= 4000) return {text: '优秀', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    if (contribution >= 3000) return {text: '良好', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    return {text: '一般', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
  }

  const getOverallStatus = () => {
    if (!dashboardData || !dashboardData.basic)
      return {text: '暂无数据', icon: '📊', color: 'text-muted-foreground', bgColor: 'bg-gray-50'}

    const {accumulated} = dashboardData.basic
    const costStatus = getCostRatioStatus(accumulated.cost_ratio)
    const efficiencyStatus = getEfficiencyStatus(accumulated.efficiency)
    const contributionStatus = getContributionStatus(accumulated.thousand_yuan_contribution)

    // 综合评估
    if (costStatus.text === '优秀' && efficiencyStatus.text === '优秀' && contributionStatus.text === '优秀') {
      return {text: '运营优秀', icon: '🎉', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    }

    if (
      (costStatus.text === '优秀' || costStatus.text === '良好') &&
      (efficiencyStatus.text === '优秀' || efficiencyStatus.text === '良好') &&
      (contributionStatus.text === '优秀' || contributionStatus.text === '良好')
    ) {
      return {text: '运营良好', icon: '👍', color: 'text-white', bgColor: 'bg-blue-100'}
    }

    if (costStatus.text === '偏高' || efficiencyStatus.text === '待提升') {
      return {text: '需要改进', icon: '⚠️', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    }

    return {text: '正常运营', icon: '✓', color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
  }

  const _overallStatus = getOverallStatus()

  // 获取趋势图标
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return {icon: 'i-mdi-trending-up', color: 'text-muted-foreground'}
    if (trend === 'down') return {icon: 'i-mdi-trending-down', color: 'text-red-600'}
    return {icon: 'i-mdi-minus', color: 'text-muted-foreground'}
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView
        scrollY
        className="h-screen bg-transparent"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}>
        {/* 使用容器查询支持WEB端响应式 */}
        <View className="@container">
          <View className="p-4 max-w-7xl mx-auto">
            {/* 🆕 页面更新提示 - 引导用户到"我的"页面查看新功能 */}
            <View className="bg-blue-100 rounded-lg p-4 mb-4 border-2 border-blue-200">
              <View className="flex flex-row items-center gap-3">
                <View className="i-mdi-new-box text-3xl text-blue-600" />
                <View className="flex-1">
                  <Text className="text-foreground font-bold text-base max-sm:text-sm mb-1">🎉 新功能上线！</Text>
                  <Text className="text-blue-600 text-xs">排班管理系统已更新，请点击底部"我的"标签查看</Text>
                </View>
              </View>
              <View
                className="mt-3 bg-white rounded-lg p-3 border-2 border-blue-200 active:bg-blue-50 cursor-pointer transition-all"
                onClick={() => Taro.switchTab({url: '/pages/profile/index'})}>
                <Text className="text-blue-600 text-center font-medium text-sm">立即前往"我的"页面 →</Text>
              </View>
            </View>

            {!currentTenant ? (
              // 未选择租户时，显示提示信息
              <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center shadow-sm">
                <View className="i-mdi-alert-circle-outline text-6xl text-blue-500 mx-auto mb-4" />
                <Text className="text-lg font-bold text-foreground block mb-2">请先登录</Text>
                <Text className="text-sm text-muted-foreground block">登录后即可查看运营数据</Text>
              </View>
            ) : (
              <>
                {/* 体验模式提示卡片 */}
                {currentUser?.role === 'guest' && (
                  <View className="bg-blue-100 rounded-lg p-6 mb-4 border-2 border-blue-200">
                    <View className="flex items-center gap-3 mb-4">
                      <View className="i-mdi-account-circle text-4xl text-blue-600" />
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-foreground block mb-1">体验模式</Text>
                        <Text className="text-sm text-blue-600 block">您正在使用测试餐厅数据，只能查看不能修改</Text>
                      </View>
                    </View>

                    <View className="flex gap-2">
                      <View
                        className="flex-1 bg-white rounded-lg p-3 border-2 border-blue-200 text-center active:bg-blue-50"
                        onClick={() => navigateTo({url: '/packageD/pages/create-tenant/index'})}>
                        <View className="i-mdi-store-plus text-2xl text-blue-600 mx-auto mb-1" />
                        <Text className="text-sm text-blue-600 block">创建我的租户</Text>
                      </View>

                      <View
                        className="flex-1 bg-white rounded-lg p-3 border-2 border-blue-200 text-center active:bg-blue-50"
                        onClick={() =>
                          showToast({
                            title: '请联系管理员获取授权',
                            icon: 'none',
                            duration: 2000
                          })
                        }>
                        <View className="i-mdi-account-plus text-2xl text-blue-600 mx-auto mb-1" />
                        <Text className="text-sm text-blue-600 block">申请授权</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* 品牌选择器 - 始终显示 */}
                {brands.length > 0 && (
                  <View className="bg-blue-100 rounded-xl p-4 mb-3 border-2 border-border">
                    <View className="flex items-center justify-between">
                      <View className="flex items-center gap-2">
                        <View className="i-mdi-tag text-lg text-muted-foreground" />
                        <Text className="text-sm font-bold text-foreground">选择品牌</Text>
                      </View>
                      {/* 🔥 始终显示Picker，即使只有一个品牌 */}
                      <Picker
                        mode="selector"
                        range={brands.map((b) => b.name)}
                        value={selectedBrandIndex}
                        onChange={handleBrandChange}
                        disabled={false}>
                        <View className="flex items-center gap-1 px-4 py-2.5 bg-white rounded-lg active:bg-muted border-2 border-border shadow-sm">
                          <Text className="text-base font-bold text-purple-700">
                            {brands[selectedBrandIndex]?.name || '请选择品牌'}
                          </Text>
                          <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
                        </View>
                      </Picker>
                    </View>
                    {/* 提示文字 */}
                    <View className="mt-2">
                      <Text className="text-xs text-muted-foreground">
                        点击右侧按钮可切换品牌（共{brands.length}个）
                      </Text>
                    </View>
                  </View>
                )}

                {/* 门店选择器 - 始终显示（如果有门店） */}
                {filteredStores.length > 0 ? (
                  <View className="bg-blue-100 rounded-xl p-4 mb-3 border-2 border-border">
                    <View className="flex items-center justify-between">
                      <View className="flex items-center gap-2">
                        <View className="i-mdi-store text-lg text-muted-foreground" />
                        <Text className="text-sm font-bold text-foreground">选择门店</Text>
                      </View>
                      {/* 🔥 始终显示Picker，即使只有一个门店 */}
                      <Picker
                        mode="selector"
                        range={filteredStores.map((s) => s.name)}
                        value={selectedStoreIndex}
                        onChange={handleStoreChange}
                        disabled={false}>
                        <View className="flex items-center gap-1 px-4 py-2.5 bg-white rounded-lg active:bg-muted border-2 border-border shadow-sm">
                          <Text className="text-base font-bold text-blue-600">
                            {filteredStores[selectedStoreIndex]?.name || '请选择门店'}
                          </Text>
                          <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
                        </View>
                      </Picker>
                    </View>
                    {/* 提示文字 */}
                    <View className="mt-2">
                      <Text className="text-xs text-muted-foreground">
                        点击右侧按钮可切换门店（当前品牌下共{filteredStores.length}个）
                      </Text>
                    </View>
                  </View>
                ) : brands.length > 0 && currentBrand ? (
                  <View className="bg-blue-100 rounded-xl p-4 mb-3 shadow-sm border-2 border-yellow-200">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-alert-circle text-lg text-yellow-600" />
                      <Text className="text-sm text-foreground">当前品牌下暂无门店，请先添加门店</Text>
                    </View>
                  </View>
                ) : null}

                {!currentStore ? (
                  <View className="bg-blue-100 rounded-lg p-8 text-center mb-4">
                    <View className="i-mdi-alert-circle-outline text-6xl text-yellow-500 mx-auto mb-4" />
                    <Text className="text-base text-foreground block mb-2">请先选择门店</Text>
                    <Text className="text-sm text-muted-foreground block">选择门店后即可查看运营数据</Text>
                  </View>
                ) : loading ? (
                  <View className="px-4">
                    {/* 统计卡片骨架屏 - WEB端优化 */}
                    <View className="grid grid-cols-2 @md:grid-cols-4 gap-3 mb-4">
                      <SkeletonStatCard />
                      <SkeletonStatCard />
                      <SkeletonStatCard />
                      <SkeletonStatCard />
                    </View>
                    {/* 列表骨架屏 */}
                    <SkeletonCard />
                    <SkeletonCard />
                  </View>
                ) : !dashboardData || !dashboardData.basic ? (
                  <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center mb-4">
                    <View className="i-mdi-chart-box-outline text-6xl text-gray-300 mx-auto mb-4" />
                    <Text className="text-base text-muted-foreground block mb-2">暂无运营数据</Text>
                    <Text className="text-sm text-muted-foreground block">请先完成今日排班</Text>
                  </View>
                ) : (
                  <>
                    {/* 调试信息 */}
                    {dashboardData.basic.days_count === 0 && (
                      <View className="bg-blue-100 rounded-lg p-3 mb-4">
                        <Text className="text-xs text-yellow-800">
                          提示：当前暂无排班数据，以下显示为空状态。请前往"今日排班"完成首次排班。
                        </Text>
                      </View>
                    )}
                    {/* 今日运营仪表盘标题 */}
                    <View className="mb-1.5">
                      <Text className="text-xs font-bold text-foreground block">今日运营仪表盘</Text>
                      <Text className="text-xs text-muted-foreground block mt-0.5">当日数据 vs 本月累计数据对比</Text>
                    </View>

                    {/* 营收对比 */}
                    <View className="bg-white rounded-xl p-2 border-2 border-gray-200 mb-1.5 shadow-sm">
                      <View className="flex items-center gap-1.5 mb-1.5">
                        <View className="i-mdi-currency-cny text-base text-muted-foreground" />
                        <Text className="text-xs font-semibold text-foreground">营收</Text>
                      </View>
                      <View className="grid grid-cols-2 gap-2">
                        <View>
                          <Text className="text-xs text-muted-foreground block mb-0.5">当日营收</Text>
                          <Text className="text-lg font-bold text-muted-foreground block">
                            ¥{dashboardData.basic.today.revenue.toFixed(0)}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-xs text-muted-foreground block mb-0.5">累计营收</Text>
                          <Text className="text-lg font-bold text-indigo-600 block">
                            ¥{dashboardData.basic.accumulated.revenue.toFixed(0)}
                          </Text>
                          <Text className="text-xs text-muted-foreground block mt-0.5">
                            日均 ¥
                            {dashboardData.basic.days_count > 0
                              ? (dashboardData.basic.accumulated.revenue / dashboardData.basic.days_count).toFixed(0)
                              : '0'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 排休人数对比 */}
                    <View className="bg-white rounded-xl p-2 border-2 border-gray-200 mb-1.5 shadow-sm">
                      <View className="flex items-center gap-1.5 mb-1.5">
                        <View className="i-mdi-account-off text-base text-muted-foreground" />
                        <Text className="text-xs font-semibold text-foreground">排休人数</Text>
                      </View>
                      <View className="grid grid-cols-2 gap-2">
                        <View>
                          <Text className="text-xs text-muted-foreground block mb-0.5">当日排休</Text>
                          <Text className="text-lg font-bold text-muted-foreground block">
                            {typeof dashboardData.basic.today.rest_count === 'number'
                              ? dashboardData.basic.today.rest_count.toFixed(2)
                              : '0.00'}{' '}
                            人
                          </Text>
                          {dashboardData.basic.today.rest_days > 0 && (
                            <Text className="text-xs text-muted-foreground block mt-0.5">
                              {dashboardData.basic.today.rest_days}天
                            </Text>
                          )}
                        </View>
                        <View>
                          <Text className="text-xs text-muted-foreground block mb-0.5">累计排休</Text>
                          <Text className="text-lg font-bold text-violet-600 block">
                            {typeof dashboardData.basic.accumulated.rest_count === 'number'
                              ? dashboardData.basic.accumulated.rest_count.toFixed(2)
                              : '0.00'}{' '}
                            人
                          </Text>
                          <Text className="text-xs text-muted-foreground block mt-0.5">
                            日均{' '}
                            {dashboardData.basic.days_count > 0
                              ? (dashboardData.basic.accumulated.rest_count / dashboardData.basic.days_count).toFixed(2)
                              : '0.00'}{' '}
                            人
                            {dashboardData.basic.accumulated.rest_days > 0 &&
                              ` / ${dashboardData.basic.days_count > 0 ? (dashboardData.basic.accumulated.rest_days / dashboardData.basic.days_count).toFixed(1) : '0.0'}天`}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 人效对比 */}
                    <View className="bg-white rounded-xl p-2 border-2 border-gray-200 mb-1.5 shadow-sm">
                      <View className="flex items-center gap-1.5 mb-1.5">
                        <View className="i-mdi-chart-line text-base text-muted-foreground" />
                        <Text className="text-xs font-semibold text-foreground">人效</Text>
                      </View>
                      <View className="grid grid-cols-2 gap-2">
                        <View>
                          <Text className="text-xs text-muted-foreground block mb-0.5">当日人效</Text>
                          <Text className="text-lg font-bold text-muted-foreground block">
                            ¥{dashboardData.basic.today.efficiency.toFixed(0)}
                          </Text>
                          <Text className="text-xs text-muted-foreground block mt-0.5">元/人/日</Text>
                        </View>
                        <View>
                          <Text className="text-xs text-muted-foreground block mb-0.5">累计人效</Text>
                          <Text className="text-lg font-bold text-emerald-600 block">
                            ¥{dashboardData.basic.accumulated.efficiency.toFixed(0)}
                          </Text>
                          <View
                            className={`inline-block px-2 py-0.5 rounded-full mt-1 ${getEfficiencyStatus(dashboardData.basic.accumulated.efficiency).bgColor}`}>
                            <Text
                              className={`text-xs ${getEfficiencyStatus(dashboardData.basic.accumulated.efficiency).color}`}>
                              {getEfficiencyStatus(dashboardData.basic.accumulated.efficiency).text}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* 薪酬对比 */}
                    <View className="bg-white rounded-xl p-2 border-2 border-gray-200 mb-1.5 shadow-sm">
                      <View className="flex items-center gap-1.5 mb-1.5">
                        <View className="i-mdi-cash-multiple text-base text-muted-foreground" />
                        <Text className="text-sm font-semibold text-foreground">薪酬</Text>
                      </View>
                      <View className="grid grid-cols-2 gap-2">
                        <View>
                          <Text className="text-xs text-muted-foreground block mb-0.5">当日薪酬</Text>
                          <Text className="text-lg font-bold text-muted-foreground block">
                            ¥{dashboardData.basic.today.labor_cost.toFixed(0)}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-xs text-muted-foreground block mb-0.5">累计薪酬</Text>
                          <Text className="text-lg font-bold text-amber-600 block">
                            ¥{dashboardData.basic.accumulated.labor_cost.toFixed(0)}
                          </Text>
                          <Text className="text-xs text-muted-foreground block mt-0.5">
                            日均 ¥
                            {dashboardData.basic.days_count > 0
                              ? (dashboardData.basic.accumulated.labor_cost / dashboardData.basic.days_count).toFixed(0)
                              : '0'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 1000元薪酬贡献对比 */}
                    <View className="bg-white rounded-xl p-2 border-2 border-gray-200 mb-1.5 shadow-sm">
                      <View className="flex items-center gap-1.5 mb-1.5">
                        <View className="i-mdi-trending-up text-base text-cyan-600" />
                        <Text className="text-sm font-semibold text-foreground">1000元薪酬贡献</Text>
                      </View>
                      <View className="grid grid-cols-2 gap-2">
                        <View>
                          <Text className="text-xs text-muted-foreground block mb-0.5">当日贡献</Text>
                          <Text className="text-xl font-bold text-cyan-600 block">
                            ¥{dashboardData.basic.today.thousand_yuan_contribution.toFixed(0)}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-xs text-muted-foreground block mb-0.5">累计贡献</Text>
                          <Text className="text-xl font-bold text-sky-600 block">
                            ¥{dashboardData.basic.accumulated.thousand_yuan_contribution.toFixed(0)}
                          </Text>
                          <View
                            className={`inline-block px-2 py-0.5 rounded-full mt-1 ${getContributionStatus(dashboardData.basic.accumulated.thousand_yuan_contribution).bgColor}`}>
                            <Text
                              className={`text-xs ${getContributionStatus(dashboardData.basic.accumulated.thousand_yuan_contribution).color}`}>
                              {getContributionStatus(dashboardData.basic.accumulated.thousand_yuan_contribution).text}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* 人力成本占营收比对比 */}
                    <View className="bg-white rounded-xl p-2 border-2 border-gray-200 mb-1.5 shadow-sm">
                      <View className="flex items-center gap-1.5 mb-1.5">
                        <View className="i-mdi-percent text-base text-red-600" />
                        <Text className="text-sm font-semibold text-foreground">人力成本占营收比</Text>
                      </View>
                      <View className="grid grid-cols-2 gap-2">
                        <View>
                          <Text className="text-xs text-muted-foreground block mb-0.5">当日占比</Text>
                          <Text className="text-lg font-bold text-red-600 block">
                            {dashboardData.basic.today.cost_ratio.toFixed(1)}%
                          </Text>
                        </View>
                        <View>
                          <Text className="text-xs text-muted-foreground block mb-0.5">累计占比</Text>
                          <Text className="text-lg font-bold text-rose-600 block">
                            {dashboardData.basic.accumulated.cost_ratio.toFixed(1)}%
                          </Text>
                          <View
                            className={`inline-block px-2 py-0.5 rounded-full mt-1 ${getCostRatioStatus(dashboardData.basic.accumulated.cost_ratio).bgColor}`}>
                            <Text
                              className={`text-xs ${getCostRatioStatus(dashboardData.basic.accumulated.cost_ratio).color}`}>
                              {getCostRatioStatus(dashboardData.basic.accumulated.cost_ratio).text}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* 趋势分析 - 仅在有趋势数据时显示 */}
                    {dashboardData.trends && (
                      <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                        <View className="flex items-center gap-1.5 mb-1.5">
                          <View className="i-mdi-chart-timeline-variant text-base text-cyan-600" />
                          <Text className="text-sm font-semibold text-foreground">趋势分析</Text>
                          <Text className="text-xs text-muted-foreground">（对比本月平均）</Text>
                        </View>
                        <View className="space-y-3">
                          {/* 营收趋势 */}
                          <View className="flex items-center justify-between">
                            <View className="flex items-center gap-2">
                              <View className="i-mdi-currency-cny text-base text-muted-foreground" />
                              <Text className="text-sm text-foreground">营收趋势</Text>
                            </View>
                            <View className="flex items-center gap-2">
                              <View
                                className={`${getTrendIcon(dashboardData.trends.revenue_trend).icon} text-lg ${getTrendIcon(dashboardData.trends.revenue_trend).color}`}
                              />
                              <Text
                                className={`text-sm font-semibold ${getTrendIcon(dashboardData.trends.revenue_trend).color}`}>
                                {dashboardData.trends.revenue_trend === 'up'
                                  ? '上升'
                                  : dashboardData.trends.revenue_trend === 'down'
                                    ? '下降'
                                    : '平稳'}
                              </Text>
                            </View>
                          </View>

                          {/* 人效趋势 */}
                          <View className="flex items-center justify-between">
                            <View className="flex items-center gap-2">
                              <View className="i-mdi-chart-line text-base text-muted-foreground" />
                              <Text className="text-sm text-foreground">人效趋势</Text>
                            </View>
                            <View className="flex items-center gap-2">
                              <View
                                className={`${getTrendIcon(dashboardData.trends.efficiency_trend).icon} text-lg ${getTrendIcon(dashboardData.trends.efficiency_trend).color}`}
                              />
                              <Text
                                className={`text-sm font-semibold ${getTrendIcon(dashboardData.trends.efficiency_trend).color}`}>
                                {dashboardData.trends.efficiency_trend === 'up'
                                  ? '上升'
                                  : dashboardData.trends.efficiency_trend === 'down'
                                    ? '下降'
                                    : '平稳'}
                              </Text>
                            </View>
                          </View>

                          {/* 成本趋势 */}
                          <View className="flex items-center justify-between">
                            <View className="flex items-center gap-2">
                              <View className="i-mdi-cash-multiple text-base text-muted-foreground" />
                              <Text className="text-sm text-foreground">成本趋势</Text>
                            </View>
                            <View className="flex items-center gap-2">
                              <View
                                className={`${getTrendIcon(dashboardData.trends.cost_trend).icon} text-lg ${getTrendIcon(dashboardData.trends.cost_trend).color}`}
                              />
                              <Text
                                className={`text-sm font-semibold ${getTrendIcon(dashboardData.trends.cost_trend).color}`}>
                                {dashboardData.trends.cost_trend === 'up'
                                  ? '上升'
                                  : dashboardData.trends.cost_trend === 'down'
                                    ? '下降'
                                    : '平稳'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* 数据洞察 */}
                    {dashboardData.basic.days_count >= 3 && (
                      <View className="bg-blue-100 rounded-lg p-4 mb-4 shadow-sm">
                        <View className="flex items-center gap-1.5 mb-1.5">
                          <View className="i-mdi-lightbulb-on text-base text-indigo-600" />
                          <Text className="text-sm font-semibold text-foreground">数据洞察</Text>
                        </View>
                        <View className="space-y-2">
                          {dashboardData.basic.accumulated.cost_ratio > 25 && (
                            <View className="flex items-start gap-2">
                              <Text className="text-muted-foreground">•</Text>
                              <Text className="text-xs text-foreground flex-1">
                                成本率{dashboardData.basic.accumulated.cost_ratio.toFixed(1)}%，建议优化排班或提升营收
                              </Text>
                            </View>
                          )}
                          {dashboardData.basic.accumulated.cost_ratio <= 20 && (
                            <View className="flex items-start gap-2">
                              <Text className="text-muted-foreground">•</Text>
                              <Text className="text-xs text-foreground flex-1">
                                成本率{dashboardData.basic.accumulated.cost_ratio.toFixed(1)}%，成本控制优秀，继续保持
                              </Text>
                            </View>
                          )}
                          {dashboardData.basic.accumulated.thousand_yuan_contribution < 3000 && (
                            <View className="flex items-start gap-2">
                              <Text className="text-muted-foreground">•</Text>
                              <Text className="text-xs text-foreground flex-1">
                                千元贡献{dashboardData.basic.accumulated.thousand_yuan_contribution.toFixed(0)}
                                元，可通过提升人效改善
                              </Text>
                            </View>
                          )}
                          {dashboardData.basic.accumulated.efficiency < 1000 && (
                            <View className="flex items-start gap-2">
                              <Text className="text-muted-foreground">•</Text>
                              <Text className="text-xs text-foreground flex-1">
                                人效{dashboardData.basic.accumulated.efficiency.toFixed(0)}
                                元/人/日，建议优化工作流程或加强员工培训
                              </Text>
                            </View>
                          )}
                          {dashboardData.basic.accumulated.efficiency >= 1500 && (
                            <View className="flex items-start gap-2">
                              <Text className="text-muted-foreground">•</Text>
                              <Text className="text-xs text-foreground flex-1">
                                人效{dashboardData.basic.accumulated.efficiency.toFixed(0)}
                                元/人/日，人效表现优秀，团队效率高
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </>
                )}

                {/* 快捷操作 */}
                <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-3 shadow-sm">
                  <View className="mb-3">
                    <Text className="text-sm font-semibold text-foreground">快捷操作</Text>
                  </View>

                  <View className="grid grid-cols-3 gap-2">
                    <View
                      className="bg-emerald-50 rounded-lg p-3 active:bg-emerald-100"
                      onClick={() => navigateTo({url: '/packageB/pages/schedule-planning/index'})}>
                      <View className="i-mdi-calendar-check text-2xl text-emerald-600 mb-1" />
                      <Text className="text-xs text-emerald-700 block">今日排班</Text>
                    </View>

                    <View
                      className="bg-blue-100 rounded-lg p-3 active:bg-blue-100"
                      onClick={() => navigateTo({url: '/packageB/pages/revenue-prediction/index'})}>
                      <View className="i-mdi-crystal-ball text-2xl text-muted-foreground mb-1" />
                      <Text className="text-xs text-blue-600 block">营收预测</Text>
                    </View>

                    <View
                      className="bg-blue-100 rounded-lg p-3 active:bg-purple-100"
                      onClick={() => navigateTo({url: '/packageB/pages/monthly-schedule/index'})}>
                      <View className="i-mdi-calendar-month text-2xl text-muted-foreground mb-1" />
                      <Text className="text-xs text-purple-700 block">每月排班</Text>
                    </View>

                    <View
                      className="bg-blue-100 rounded-lg p-3 active:bg-green-100"
                      onClick={() => navigateTo({url: '/packageB/pages/data-analytics/index'})}>
                      <View className="i-mdi-chart-line text-2xl text-muted-foreground mb-1" />
                      <Text className="text-xs text-green-600 block">数据分析</Text>
                    </View>

                    <View
                      className="bg-blue-100 rounded-lg p-3 active:bg-indigo-100"
                      onClick={() => navigateTo({url: '/packageF/pages/chain-management/index'})}>
                      <View className="i-mdi-store-cog text-2xl text-indigo-600 mb-1" />
                      <Text className="text-xs text-indigo-700 block">连锁管理</Text>
                    </View>

                    <View
                      className="bg-blue-100 rounded-lg p-3 active:bg-orange-100"
                      onClick={() => navigateTo({url: '/packageF/pages/risk-alerts/index'})}>
                      <View className="i-mdi-shield-alert text-2xl text-muted-foreground mb-1" />
                      <Text className="text-xs text-orange-600 block">风险预警</Text>
                    </View>

                    <View
                      className="bg-cyan-50 rounded-lg p-3 active:bg-cyan-100 cursor-pointer transition-all"
                      onClick={() => navigateTo({url: '/packageH/pages/onboarding/probation-conversion/index'})}>
                      <View className="i-mdi-account-convert text-2xl text-cyan-600 mb-1" />
                      <Text className="text-xs text-cyan-700 block">试用转正</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default Home
