import {Input, Picker, Text, Textarea, View} from '@tarojs/components'
import type React from 'react'
import {useState} from 'react'
import type {BrandInfo} from '../types'

interface Step1BrandProps {
  initialData: BrandInfo | null
  onComplete: (data: BrandInfo) => void
}

const industries = ['火锅', '快餐', '咖啡', '茶饮', '烧烤', '西餐', '中餐', '其他']

const Step1Brand: React.FC<Step1BrandProps> = ({initialData, onComplete}) => {
  const [brandInfo, setBrandInfo] = useState<BrandInfo>(
    initialData || {
      name: '',
      industry: '火锅',
      description: '',
      contact: ''
    }
  )

  const _handleSubmit = () => {
    if (!brandInfo.name.trim()) {
      return {valid: false, message: '请输入租户名称'}
    }
    onComplete(brandInfo)
    return {valid: true}
  }

  return (
    <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
      {/* 标题和说明 */}
      <View className="mb-6">
        <View className="flex items-center gap-2 mb-2">
          <View className="i-mdi-office-building text-2xl text-blue-500" />
          <Text className="text-lg font-bold text-gray-800">品牌信息配置</Text>
        </View>
        <Text className="text-sm text-gray-600">欢迎使用餐时间日人力成本管控助手！让我们先完善您的品牌信息。</Text>
      </View>

      {/* 表单 */}
      <View className="space-y-4">
        {/* 租户名称 */}
        <View>
          <View className="flex items-center gap-1 mb-2">
            <Text className="text-sm text-gray-700">租户名称</Text>
            <Text className="text-red-500">*</Text>
          </View>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-gray-50 rounded-lg px-3 py-3 text-sm border border-gray-200 w-full"
              placeholder="请输入您的品牌名称，如：海底捞火锅"
              value={brandInfo.name}
              onInput={(e) => setBrandInfo({...brandInfo, name: e.detail.value})}
            />
          </View>
        </View>

        {/* 行业类型 */}
        <View>
          <View className="flex items-center gap-1 mb-2">
            <Text className="text-sm text-gray-700">行业类型</Text>
            <Text className="text-red-500">*</Text>
          </View>
          <Picker
            mode="selector"
            range={industries}
            value={industries.indexOf(brandInfo.industry)}
            onChange={(e) => {
              setBrandInfo({...brandInfo, industry: industries[e.detail.value]})
            }}>
            <View className="bg-gray-50 rounded-lg px-3 py-3 flex items-center justify-between border border-gray-200">
              <Text className="text-sm text-gray-800">{brandInfo.industry}</Text>
              <View className="i-mdi-chevron-down text-gray-400" />
            </View>
          </Picker>
        </View>

        {/* 品牌简介 */}
        <View>
          <View className="flex items-center gap-1 mb-2">
            <Text className="text-sm text-gray-700">品牌简介</Text>
            <Text className="text-xs text-gray-400">（可选）</Text>
          </View>
          <View style={{overflow: 'hidden'}}>
            <Textarea
              className="bg-gray-50 rounded-lg px-3 py-3 text-sm border border-gray-200 w-full"
              placeholder="简单介绍您的品牌特色和经营理念"
              value={brandInfo.description}
              maxlength={200}
              onInput={(e) => setBrandInfo({...brandInfo, description: e.detail.value})}
              style={{minHeight: '80px'}}
            />
          </View>
        </View>

        {/* 联系方式 */}
        <View>
          <View className="flex items-center gap-1 mb-2">
            <Text className="text-sm text-gray-700">联系方式</Text>
            <Text className="text-xs text-gray-400">（可选）</Text>
          </View>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-gray-50 rounded-lg px-3 py-3 text-sm border border-gray-200 w-full"
              placeholder="请输入联系电话或邮箱"
              value={brandInfo.contact}
              onInput={(e) => setBrandInfo({...brandInfo, contact: e.detail.value})}
            />
          </View>
        </View>
      </View>

      {/* 提示信息 */}
      <View className="mt-4 bg-blue-100 rounded-lg p-3">
        <View className="flex items-start gap-2">
          <View className="i-mdi-information text-blue-500 mt-0.5" />
          <Text className="text-xs text-blue-700 flex-1">
            这些信息将用于系统配置和数据展示，您可以随时在管理中心修改。
          </Text>
        </View>
      </View>
    </View>
  )
}

export default Step1Brand
export type {Step1BrandProps}
