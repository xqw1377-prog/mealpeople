import {Button, Input, Picker, Text, View} from '@tarojs/components'
import {getCurrentInstance, navigateBack, showToast} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {createStore, getBrandsByTenantId, getStoreById, updateStore} from '@/db/api'
import type {Brand} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const StoreForm: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    brand_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [storeId, setStoreId] = useState<string>('')
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrandIndex, setSelectedBrandIndex] = useState(0)

  // 加载品牌列表
  const loadBrands = useCallback(async () => {
    if (!currentTenant?.id) return

    try {
      const brandList = await getBrandsByTenantId(currentTenant.id)
      setBrands(brandList)

      // 如果有品牌且表单中没有选择品牌，默认选择第一个
      if (brandList.length > 0) {
        setFormData((prev) => {
          if (!prev.brand_id) {
            return {...prev, brand_id: brandList[0].id}
          }
          return prev
        })
      }
    } catch (error) {
      console.error('加载品牌列表失败:', error)
      showToast({title: '加载品牌失败', icon: 'none'})
    }
  }, [currentTenant?.id])

  const loadStore = useCallback(
    async (id: string) => {
      try {
        const store = await getStoreById(id)
        if (store) {
          setFormData({
            name: store.name,
            address: store.address || '',
            brand_id: store.brand_id || ''
          })

          // 设置品牌选择器的索引
          if (store.brand_id && brands.length > 0) {
            const index = brands.findIndex((b) => b.id === store.brand_id)
            if (index >= 0) {
              setSelectedBrandIndex(index)
            } else {
              // 如果找不到对应的品牌，重置为第一个
              setSelectedBrandIndex(0)
              setFormData((prev) => ({...prev, brand_id: brands[0]?.id || ''}))
            }
          }
        } else {
          showToast({title: '店铺不存在', icon: 'none'})
          setTimeout(() => navigateBack(), 1000)
        }
      } catch (error) {
        console.error('加载店铺数据失败:', error)
        showToast({title: '加载失败', icon: 'none'})
      }
    },
    [brands]
  )

  useEffect(() => {
    // 先加载品牌列表
    loadBrands()
  }, [loadBrands])

  useEffect(() => {
    // 检查是否为编辑模式
    const instance = getCurrentInstance()
    const id = instance.router?.params?.id
    if (id && brands.length > 0) {
      setIsEditMode(true)
      setStoreId(id)
      loadStore(id)
    }
  }, [brands.length, loadStore])

  // 同步品牌索引
  useEffect(() => {
    if (formData.brand_id && brands.length > 0) {
      const index = brands.findIndex((b) => b.id === formData.brand_id)
      if (index >= 0 && index !== selectedBrandIndex) {
        setSelectedBrandIndex(index)
      }
    }
  }, [formData.brand_id, brands, selectedBrandIndex])

  // 处理品牌选择变化
  const handleBrandChange = (e: any) => {
    const index = Number(e.detail.value)
    setSelectedBrandIndex(index)
    const selectedBrand = brands[index]
    setFormData((prev) => ({...prev, brand_id: selectedBrand.id}))
  }

  const handleSubmit = async () => {
    if (!currentTenant) return

    // 验证必填字段
    if (!formData.name.trim()) {
      showToast({title: '请输入店铺名称', icon: 'none'})
      return
    }

    // 验证品牌选择
    if (!formData.brand_id) {
      showToast({title: '请选择所属品牌', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      if (isEditMode) {
        // 更新店铺
        const success = await updateStore(storeId, {
          name: formData.name.trim(),
          address: formData.address.trim() || null,
          brand_id: formData.brand_id
        })

        if (success) {
          showToast({title: '更新成功', icon: 'success'})
          setTimeout(() => {
            navigateBack()
          }, 500)
        } else {
          showToast({title: '更新失败', icon: 'none'})
        }
      } else {
        // 创建店铺
        const result = await createStore({
          tenant_id: currentTenant.id,
          name: formData.name.trim(),
          address: formData.address.trim() || null,
          brand_id: formData.brand_id,
          status: 'active'
        })

        if (result) {
          showToast({title: '添加成功', icon: 'success'})
          setTimeout(() => {
            navigateBack()
          }, 500)
        } else {
          showToast({title: '添加失败', icon: 'none'})
        }
      }
    } catch (error) {
      console.error('操作失败:', error)
      showToast({title: '操作失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  if (!currentTenant) {
    return null
  }

  return (
    <View className="min-h-screen bg-muted p-4">
      <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
        {/* 店铺名称 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground block mb-2">
            店铺名称 <Text className="text-red-500">*</Text>
          </Text>
          <Input
            className="w-full px-4 py-3 border border-gray-200 rounded-xl"
            placeholder="请输入店铺名称"
            value={formData.name}
            onInput={(e) => setFormData({...formData, name: e.detail.value})}
          />
        </View>

        {/* 所属品牌 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground block mb-2">
            所属品牌 <Text className="text-red-500">*</Text>
          </Text>
          {brands.length > 0 ? (
            <Picker
              mode="selector"
              range={brands}
              rangeKey="name"
              value={selectedBrandIndex}
              onChange={handleBrandChange}>
              <View className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between">
                <Text className={formData.brand_id ? 'text-foreground' : 'text-muted-foreground'}>
                  {formData.brand_id ? brands[selectedBrandIndex]?.name : '请选择所属品牌'}
                </Text>
                <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
              </View>
            </Picker>
          ) : (
            <View className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
              <Text className="text-muted-foreground">暂无品牌，请先添加品牌</Text>
            </View>
          )}
        </View>

        {/* 店铺地址 */}
        <View className="mb-6">
          <Text className="text-sm text-foreground block mb-2">店铺地址</Text>
          <Input
            className="w-full px-4 py-3 border border-gray-200 rounded-xl"
            placeholder="请输入店铺地址"
            value={formData.address}
            onInput={(e) => setFormData({...formData, address: e.detail.value})}
          />
        </View>

        {/* 提交按钮 */}
        <View className="flex gap-3">
          <Button
            className="flex-1 bg-muted text-foreground rounded-xl text-sm break-keep"
            size="default"
            onClick={() => navigateBack()}>
            取消
          </Button>
          <Button
            className="flex-1 bg-blue-100 text-white rounded-xl text-sm break-keep"
            size="default"
            loading={loading}
            disabled={loading}
            onClick={handleSubmit}>
            {loading ? '提交中...' : isEditMode ? '确认更新' : '确认添加'}
          </Button>
        </View>
      </View>
    </View>
  )
}

export default StoreForm
