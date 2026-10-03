import {Button, Input, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import type React from 'react'
import {useState} from 'react'
import type {StoreInfo} from '../types'

interface Step2StoresProps {
  initialData: StoreInfo[]
  onComplete: (data: StoreInfo[]) => void
}

const Step2Stores: React.FC<Step2StoresProps> = ({initialData, onComplete}) => {
  const [stores, setStores] = useState<StoreInfo[]>(
    initialData.length > 0
      ? initialData
      : [
          {
            name: '',
            address: '',
            business_hours: '',
            phone: ''
          }
        ]
  )

  const [editingIndex, setEditingIndex] = useState<number>(0)

  const handleAddStore = () => {
    setStores([
      ...stores,
      {
        name: '',
        address: '',
        business_hours: '',
        phone: ''
      }
    ])
    setEditingIndex(stores.length)
  }

  const handleRemoveStore = (index: number) => {
    if (stores.length === 1) {
      Taro.showToast({
        title: '至少保留一家门店',
        icon: 'none'
      })
      return
    }
    const newStores = stores.filter((_, i) => i !== index)
    setStores(newStores)
    if (editingIndex >= newStores.length) {
      setEditingIndex(newStores.length - 1)
    }
  }

  const handleUpdateStore = (index: number, field: keyof StoreInfo, value: string) => {
    const newStores = [...stores]
    newStores[index] = {...newStores[index], [field]: value}
    setStores(newStores)
  }

  const currentStore = stores[editingIndex]

  return (
    <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
      {/* 标题和说明 */}
      <View className="mb-6">
        <View className="flex items-center gap-2 mb-2">
          <View className="i-mdi-store text-2xl text-blue-500" />
          <Text className="text-lg font-bold text-gray-800">门店信息配置</Text>
        </View>
        <Text className="text-sm text-gray-600">添加您的门店信息。您可以添加多家门店，后续可以分别管理。</Text>
      </View>

      {/* 门店列表 */}
      {stores.length > 1 && (
        <View className="mb-4">
          <Text className="text-xs text-gray-600 mb-2">已添加 {stores.length} 家门店</Text>
          <View className="flex gap-2 flex-wrap">
            {stores.map((store, index) => (
              <View
                key={index}
                className={`px-3 py-2 rounded-lg border ${
                  index === editingIndex ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-gray-50'
                }`}
                onClick={() => setEditingIndex(index)}>
                <Text
                  className={`text-sm ${index === editingIndex ? 'text-muted-foreground font-bold' : 'text-gray-700'}`}>
                  {store.name || `门店${index + 1}`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 当前编辑的门店表单 */}
      <View className="space-y-4">
        <View className="flex items-center justify-between mb-2">
          <Text className="text-sm font-bold text-gray-700">
            {stores.length > 1 ? `编辑门店 ${editingIndex + 1}` : '门店信息'}
          </Text>
          {stores.length > 1 && (
            <Button
              className="bg-blue-100 text-red-600 px-3 py-1 rounded text-xs break-keep"
              size="mini"
              onClick={() => handleRemoveStore(editingIndex)}>
              删除
            </Button>
          )}
        </View>

        {/* 门店名称 */}
        <View>
          <View className="flex items-center gap-1 mb-2">
            <Text className="text-sm text-gray-700">门店名称</Text>
            <Text className="text-red-500">*</Text>
          </View>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-gray-50 rounded-lg px-3 py-3 text-sm border border-gray-200 w-full"
              placeholder="如：海底捞王府井店"
              value={currentStore.name}
              onInput={(e) => handleUpdateStore(editingIndex, 'name', e.detail.value)}
            />
          </View>
        </View>

        {/* 门店地址 */}
        <View>
          <View className="flex items-center gap-1 mb-2">
            <Text className="text-sm text-gray-700">门店地址</Text>
            <Text className="text-red-500">*</Text>
          </View>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-gray-50 rounded-lg px-3 py-3 text-sm border border-gray-200 w-full"
              placeholder="请输入详细地址"
              value={currentStore.address}
              onInput={(e) => handleUpdateStore(editingIndex, 'address', e.detail.value)}
            />
          </View>
        </View>

        {/* 营业时间 */}
        <View>
          <View className="flex items-center gap-1 mb-2">
            <Text className="text-sm text-gray-700">营业时间</Text>
            <Text className="text-xs text-gray-400">（可选）</Text>
          </View>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-gray-50 rounded-lg px-3 py-3 text-sm border border-gray-200 w-full"
              placeholder="如：10:00-22:00"
              value={currentStore.business_hours}
              onInput={(e) => handleUpdateStore(editingIndex, 'business_hours', e.detail.value)}
            />
          </View>
        </View>

        {/* 联系电话 */}
        <View>
          <View className="flex items-center gap-1 mb-2">
            <Text className="text-sm text-gray-700">联系电话</Text>
            <Text className="text-xs text-gray-400">（可选）</Text>
          </View>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-gray-50 rounded-lg px-3 py-3 text-sm border border-gray-200 w-full"
              placeholder="请输入门店电话"
              value={currentStore.phone}
              onInput={(e) => handleUpdateStore(editingIndex, 'phone', e.detail.value)}
            />
          </View>
        </View>
      </View>

      {/* 添加门店按钮 */}
      <Button
        className="w-full bg-blue-100 text-white py-3 rounded-lg mt-4 text-sm break-keep border border-blue-200"
        size="default"
        onClick={handleAddStore}>
        <View className="flex items-center justify-center gap-2">
          <View className="i-mdi-plus-circle" />
          <Text>添加更多门店</Text>
        </View>
      </Button>

      {/* 提示信息 */}
      <View className="mt-4 bg-blue-100 rounded-lg p-3">
        <View className="flex items-start gap-2">
          <View className="i-mdi-information text-blue-500 mt-0.5" />
          <Text className="text-xs text-blue-700 flex-1">
            至少需要添加一家门店。您可以在管理中心随时添加、编辑或删除门店信息。
          </Text>
        </View>
      </View>
    </View>
  )
}

export default Step2Stores
export type {Step2StoresProps}
