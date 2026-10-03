/**
 * 工作记录类别设置页面
 * 功能：管理工作记录的分类
 */

import {Button, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {useTenantStore} from '@/store/tenant'

// 类别接口
interface WorkLogCategory {
  id: string
  tenant_id: string
  name: string
  icon: string
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// 颜色选项
const COLOR_OPTIONS = [
  {name: '蓝色', value: 'blue', class: 'bg-blue-500'},
  {name: '绿色', value: 'green', class: 'bg-green-500'},
  {name: '橙色', value: 'orange', class: 'bg-orange-500'},
  {name: '紫色', value: 'purple', class: 'bg-purple-500'},
  {name: '红色', value: 'red', class: 'bg-red-500'},
  {name: '青色', value: 'cyan', class: 'bg-cyan-500'},
  {name: '粉色', value: 'pink', class: 'bg-pink-500'},
  {name: '灰色', value: 'gray', class: 'bg-gray-500'}
]

// 图标选项
const ICON_OPTIONS = [
  {name: '客户', value: 'i-mdi-account-group'},
  {name: '清洁', value: 'i-mdi-broom'},
  {name: '工具', value: 'i-mdi-tools'},
  {name: '包裹', value: 'i-mdi-package-variant'},
  {name: '安全', value: 'i-mdi-shield-check'},
  {name: '学习', value: 'i-mdi-school'},
  {name: '日历', value: 'i-mdi-calendar-text'},
  {name: '文档', value: 'i-mdi-file-document'},
  {name: '餐饮', value: 'i-mdi-food'},
  {name: '购物', value: 'i-mdi-cart'},
  {name: '电话', value: 'i-mdi-phone'},
  {name: '邮件', value: 'i-mdi-email'}
]

const CategorySettings: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [categories, setCategories] = useState<WorkLogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<WorkLogCategory | null>(null)

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    icon: 'i-mdi-file-document',
    color: 'blue'
  })

  // 加载类别列表
  const loadCategories = useCallback(async () => {
    if (!currentTenant) return

    try {
      setLoading(true)
      const {data, error} = await supabase
        .from('work_log_categories')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('sort_order', {ascending: true})

      if (error) throw error

      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('加载类别失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useDidShow(() => {
    loadCategories()
  })

  // 打开添加弹窗
  const handleAdd = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      icon: 'i-mdi-file-document',
      color: 'blue'
    })
    setShowAddModal(true)
  }

  // 打开编辑弹窗
  const handleEdit = (category: WorkLogCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color
    })
    setShowAddModal(true)
  }

  // 保存类别
  const handleSave = async () => {
    if (!currentTenant || !user) return

    if (!formData.name.trim()) {
      Taro.showToast({title: '请输入类别名称', icon: 'none'})
      return
    }

    try {
      if (editingCategory) {
        // 更新
        const {error} = await supabase
          .from('work_log_categories')
          .update({
            name: formData.name.trim(),
            icon: formData.icon,
            color: formData.color,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCategory.id)

        if (error) throw error

        Taro.showToast({title: '更新成功', icon: 'success'})
      } else {
        // 新增
        const maxOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) : 0

        const {error} = await supabase.from('work_log_categories').insert({
          tenant_id: currentTenant.id,
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color,
          sort_order: maxOrder + 1,
          is_active: true
        })

        if (error) throw error

        Taro.showToast({title: '添加成功', icon: 'success'})
      }

      setShowAddModal(false)
      loadCategories()
    } catch (error) {
      console.error('保存类别失败:', error)
      Taro.showToast({title: '保存失败', icon: 'none'})
    }
  }

  // 删除类别
  const handleDelete = async (category: WorkLogCategory) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除"${category.name}"吗？`
    })

    if (!result.confirm) return

    try {
      const {error} = await supabase.from('work_log_categories').delete().eq('id', category.id)

      if (error) throw error

      Taro.showToast({title: '删除成功', icon: 'success'})
      loadCategories()
    } catch (error) {
      console.error('删除类别失败:', error)
      Taro.showToast({title: '删除失败，可能有记录正在使用此类别', icon: 'none', duration: 3000})
    }
  }

  // 切换启用状态
  const toggleActive = async (category: WorkLogCategory) => {
    try {
      const {error} = await supabase
        .from('work_log_categories')
        .update({
          is_active: !category.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', category.id)

      if (error) throw error

      Taro.showToast({title: category.is_active ? '已禁用' : '已启用', icon: 'success'})
      loadCategories()
    } catch (error) {
      console.error('切换状态失败:', error)
      Taro.showToast({title: '操作失败', icon: 'none'})
    }
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center min-h-screen bg-background">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-background">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4 max-sm:p-3">
          {/* 顶部说明 */}
          <View className="bg-blue-50 rounded-xl p-4 max-sm:p-3 mb-4 max-sm:mb-3">
            <View className="flex items-center gap-2 max-sm:gap-1.5 mb-2 max-sm:mb-1.5">
              <View className="i-mdi-information text-xl max-sm:text-lg text-blue-600" />
              <Text className="text-sm max-sm:text-xs font-bold text-blue-900">类别管理说明</Text>
            </View>
            <Text className="text-xs max-sm:text-[10px] text-blue-700 leading-relaxed">
              工作记录类别用于分类管理员工的日常工作记录，可以自定义类别名称、图标和颜色。
            </Text>
          </View>

          {/* 类别列表 */}
          <View className="space-y-3 max-sm:space-y-2">
            {categories.map((category) => (
              <View
                key={category.id}
                className={`bg-white rounded-xl p-4 max-sm:p-3 border-2 ${
                  category.is_active ? 'border-gray-200' : 'border-gray-300 opacity-60'
                }`}>
                <View className="flex items-center justify-between">
                  <View className="flex items-center gap-3 max-sm:gap-2 flex-1">
                    <View
                      className={`w-12 h-12 max-sm:w-10 max-sm:h-10 bg-${category.color}-100 rounded-xl flex items-center justify-center`}>
                      <View className={`${category.icon} text-2xl max-sm:text-xl text-${category.color}-600`} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base max-sm:text-sm font-bold text-foreground mb-1">{category.name}</Text>
                      <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                        {category.is_active ? '已启用' : '已禁用'}
                      </Text>
                    </View>
                  </View>

                  {/* 操作按钮 */}
                  <View className="flex items-center gap-2 max-sm:gap-1.5">
                    <View
                      className="w-8 h-8 max-sm:w-7 max-sm:h-7 bg-blue-100 rounded-lg flex items-center justify-center active:scale-95 transition-all"
                      onClick={() => handleEdit(category)}>
                      <View className="i-mdi-pencil text-lg max-sm:text-base text-blue-600" />
                    </View>
                    <View
                      className="w-8 h-8 max-sm:w-7 max-sm:h-7 bg-orange-100 rounded-lg flex items-center justify-center active:scale-95 transition-all"
                      onClick={() => toggleActive(category)}>
                      <View
                        className={`${category.is_active ? 'i-mdi-eye-off' : 'i-mdi-eye'} text-lg max-sm:text-base text-orange-600`}
                      />
                    </View>
                    <View
                      className="w-8 h-8 max-sm:w-7 max-sm:h-7 bg-red-100 rounded-lg flex items-center justify-center active:scale-95 transition-all"
                      onClick={() => handleDelete(category)}>
                      <View className="i-mdi-delete text-lg max-sm:text-base text-red-600" />
                    </View>
                  </View>
                </View>
              </View>
            ))}

            {categories.length === 0 && (
              <View className="text-center py-12 max-sm:py-8">
                <View className="i-mdi-folder-open text-6xl max-sm:text-5xl text-muted-foreground mb-4 max-sm:mb-3" />
                <Text className="text-sm max-sm:text-xs text-muted-foreground">暂无类别，点击下方按钮添加</Text>
              </View>
            )}
          </View>
        </View>

        {/* 底部占位 */}
        <View className="h-24" />
      </ScrollView>

      {/* 添加按钮 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 max-sm:p-3 bg-white border-t border-border">
        <Button
          className="w-full bg-primary text-white py-4 max-sm:py-3 rounded-xl break-keep text-base max-sm:text-sm font-bold"
          size="default"
          onClick={handleAdd}>
          <View className="flex items-center justify-center gap-2 max-sm:gap-1.5">
            <View className="i-mdi-plus text-xl max-sm:text-lg" />
            <Text>添加类别</Text>
          </View>
        </Button>
      </View>

      {/* 添加/编辑弹窗 */}
      {showAddModal && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 max-sm:p-3">
          <View className="bg-white rounded-2xl p-6 max-sm:p-4 w-full max-w-md">
            <Text className="text-lg max-sm:text-base font-bold text-foreground mb-4 max-sm:mb-3">
              {editingCategory ? '编辑类别' : '添加类别'}
            </Text>

            {/* 类别名称 */}
            <View className="mb-4 max-sm:mb-3">
              <Text className="text-sm max-sm:text-xs text-foreground mb-2 max-sm:mb-1.5">类别名称</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-input text-foreground px-4 max-sm:px-3 py-3 max-sm:py-2 rounded-xl border border-border w-full text-sm max-sm:text-xs"
                  placeholder="请输入类别名称"
                  value={formData.name}
                  onInput={(e) => setFormData({...formData, name: e.detail.value})}
                />
              </View>
            </View>

            {/* 选择图标 */}
            <View className="mb-4 max-sm:mb-3">
              <Text className="text-sm max-sm:text-xs text-foreground mb-2 max-sm:mb-1.5">选择图标</Text>
              <View className="grid grid-cols-6 gap-2 max-sm:gap-1.5">
                {ICON_OPTIONS.map((icon) => (
                  <View
                    key={icon.value}
                    className={`w-full aspect-square rounded-lg flex items-center justify-center active:scale-95 transition-all ${
                      formData.icon === icon.value ? 'bg-primary' : 'bg-gray-100'
                    }`}
                    onClick={() => setFormData({...formData, icon: icon.value})}>
                    <View
                      className={`${icon.value} text-xl max-sm:text-lg ${
                        formData.icon === icon.value ? 'text-white' : 'text-gray-600'
                      }`}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* 选择颜色 */}
            <View className="mb-6 max-sm:mb-4">
              <Text className="text-sm max-sm:text-xs text-foreground mb-2 max-sm:mb-1.5">选择颜色</Text>
              <View className="grid grid-cols-4 gap-2 max-sm:gap-1.5">
                {COLOR_OPTIONS.map((color) => (
                  <View
                    key={color.value}
                    className={`flex items-center gap-2 max-sm:gap-1.5 p-2 max-sm:p-1.5 rounded-lg active:scale-95 transition-all ${
                      formData.color === color.value ? 'bg-gray-100' : 'bg-white'
                    }`}
                    onClick={() => setFormData({...formData, color: color.value})}>
                    <View className={`w-6 h-6 max-sm:w-5 max-sm:h-5 ${color.class} rounded-full`} />
                    <Text className="text-xs max-sm:text-[10px] text-foreground">{color.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 按钮 */}
            <View className="flex gap-3 max-sm:gap-2">
              <Button
                className="flex-1 bg-gray-100 text-foreground py-3 max-sm:py-2 rounded-xl break-keep text-sm max-sm:text-xs"
                size="default"
                onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button
                className="flex-1 bg-primary text-white py-3 max-sm:py-2 rounded-xl break-keep text-sm max-sm:text-xs font-bold"
                size="default"
                onClick={handleSave}>
                保存
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default CategorySettings
