/**
 * 品牌编辑页面
 */

import {Button, Input, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useLoad, useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useState} from 'react'
import {getBrandById, updateBrand} from '@/db/api'
import type {Brand} from '@/db/types'

export default function BrandEdit() {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const brandId = router.params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [brand, setBrand] = useState<Brand | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    description: '',
    status: 'active' as 'active' | 'inactive'
  })

  // 加载品牌信息
  useLoad(async () => {
    if (!brandId) {
      Taro.showToast({title: '品牌ID不存在', icon: 'none'})
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
      return
    }

    setLoading(true)
    try {
      const brandData = await getBrandById(brandId)
      if (brandData) {
        setBrand(brandData)
        setFormData({
          name: brandData.name,
          industry: brandData.industry || '',
          description: brandData.description || '',
          status: brandData.status
        })
      } else {
        Taro.showToast({title: '品牌不存在', icon: 'none'})
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      }
    } catch (error) {
      console.error('加载品牌信息失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  })

  // 保存修改
  const handleSave = async () => {
    // 验证表单
    if (!formData.name.trim()) {
      Taro.showToast({title: '请输入品牌名称', icon: 'none'})
      return
    }

    if (!brandId) return

    setSaving(true)
    Taro.showLoading({title: '保存中...'})

    try {
      const success = await updateBrand(brandId, {
        name: formData.name.trim(),
        industry: formData.industry.trim() || undefined,
        description: formData.description.trim() || undefined
      })

      Taro.hideLoading()

      if (success) {
        Taro.showToast({title: '保存成功', icon: 'success'})
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({title: '保存失败', icon: 'none'})
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('保存品牌失败:', error)
      Taro.showToast({title: '保存失败', icon: 'none'})
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
        <View className="text-center py-8">
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      </View>
    )
  }

  if (!brand) {
    return (
      <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
        <View className="bg-blue-100 border border-border rounded-lg p-4">
          <View className="flex items-center gap-2">
            <View className="i-mdi-alert text-2xl text-red-600" />
            <Text className="text-red-600">品牌不存在</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4">
          {/* 表单 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm space-y-4">
            {/* 品牌名称 */}
            <View>
              <View className="flex items-center gap-1 mb-2">
                <Text className="text-sm font-bold text-foreground">品牌名称</Text>
                <Text className="text-red-500">*</Text>
              </View>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-muted px-3 py-2 rounded border border-border w-full"
                  value={formData.name}
                  placeholder="请输入品牌名称"
                  onInput={(e) => setFormData({...formData, name: e.detail.value})}
                />
              </View>
            </View>

            {/* 所属行业 */}
            <View>
              <View className="flex items-center gap-1 mb-2">
                <Text className="text-sm font-bold text-foreground">所属行业</Text>
              </View>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-muted px-3 py-2 rounded border border-border w-full"
                  value={formData.industry}
                  placeholder="例如：餐饮、零售、服务等"
                  onInput={(e) => setFormData({...formData, industry: e.detail.value})}
                />
              </View>
            </View>

            {/* 品牌描述 */}
            <View>
              <View className="flex items-center gap-1 mb-2">
                <Text className="text-sm font-bold text-foreground">品牌描述</Text>
              </View>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="bg-muted px-3 py-2 rounded border border-border w-full"
                  value={formData.description}
                  placeholder="请输入品牌描述"
                  maxlength={200}
                  style={{minHeight: '80px'}}
                  onInput={(e) => setFormData({...formData, description: e.detail.value})}
                />
              </View>
              <Text className="text-xs text-muted-foreground mt-1">{formData.description.length}/200</Text>
            </View>

            {/* 品牌状态 */}
            <View>
              <View className="flex items-center gap-1 mb-2">
                <Text className="text-sm font-bold text-foreground">品牌状态</Text>
              </View>
              <View className="flex gap-3">
                <View
                  className={`flex-1 border-2 rounded-lg p-3 text-center ${
                    formData.status === 'active' ? 'border-border bg-blue-100' : 'border-border bg-white'
                  }`}
                  onClick={() => setFormData({...formData, status: 'active'})}>
                  <View className="flex items-center justify-center gap-2">
                    <View
                      className={`i-mdi-check-circle text-xl ${
                        formData.status === 'active' ? 'text-muted-foreground' : 'text-muted-foreground'
                      }`}
                    />
                    <Text
                      className={`text-sm font-bold ${
                        formData.status === 'active' ? 'text-green-600' : 'text-muted-foreground'
                      }`}>
                      活跃
                    </Text>
                  </View>
                </View>
                <View
                  className={`flex-1 border-2 rounded-lg p-3 text-center ${
                    formData.status === 'inactive' ? 'border-border bg-gray-50' : 'border-border bg-white'
                  }`}
                  onClick={() => setFormData({...formData, status: 'inactive'})}>
                  <View className="flex items-center justify-center gap-2">
                    <View
                      className={`i-mdi-close-circle text-xl ${
                        formData.status === 'inactive' ? 'text-muted-foreground' : 'text-muted-foreground'
                      }`}
                    />
                    <Text
                      className={`text-sm font-bold ${
                        formData.status === 'inactive' ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                      停用
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="mt-6 space-y-3">
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded-xl break-keep text-base"
              size="default"
              disabled={saving}
              onClick={handleSave}>
              {saving ? '保存中...' : '保存修改'}
            </Button>
            <Button
              className="w-full bg-muted text-foreground py-4 rounded-xl break-keep text-base"
              size="default"
              disabled={saving}
              onClick={() => Taro.navigateBack()}>
              取消
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
