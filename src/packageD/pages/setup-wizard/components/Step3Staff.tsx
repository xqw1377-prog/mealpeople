import {Button, Input, Picker, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import type React from 'react'
import {useState} from 'react'
import type {StaffInfo, StoreInfo} from '../types'

interface Step3StaffProps {
  initialData: StaffInfo[]
  stores: StoreInfo[]
  onComplete: (data: StaffInfo[]) => void
}

const positions = ['店长', '副店长', '服务员', '厨师', '主厨', '收银员', '保洁', '其他']

const Step3Staff: React.FC<Step3StaffProps> = ({initialData, stores, onComplete}) => {
  const [staff, setStaff] = useState<StaffInfo[]>(
    initialData.length > 0
      ? initialData
      : [
          {
            name: '',
            position: '服务员',
            store_id: stores[0]?.id || '',
            base_salary: 0,
            phone: ''
          }
        ]
  )

  const [editingIndex, setEditingIndex] = useState<number>(0)

  const handleAddStaff = () => {
    setStaff([
      ...staff,
      {
        name: '',
        position: '服务员',
        store_id: stores[0]?.id || '',
        base_salary: 0,
        phone: ''
      }
    ])
    setEditingIndex(staff.length)
  }

  const handleRemoveStaff = (index: number) => {
    if (staff.length === 1) {
      Taro.showToast({
        title: '至少保留一名员工',
        icon: 'none'
      })
      return
    }
    const newStaff = staff.filter((_, i) => i !== index)
    setStaff(newStaff)
    if (editingIndex >= newStaff.length) {
      setEditingIndex(newStaff.length - 1)
    }
  }

  const handleUpdateStaff = (index: number, field: keyof StaffInfo, value: string | number) => {
    const newStaff = [...staff]
    newStaff[index] = {...newStaff[index], [field]: value}
    setStaff(newStaff)
  }

  const currentStaff = staff[editingIndex]

  return (
    <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
      {/* 标题和说明 */}
      <View className="mb-6">
        <View className="flex items-center gap-2 mb-2">
          <View className="i-mdi-account-group text-2xl text-blue-500" />
          <Text className="text-lg font-bold text-gray-800">人员信息配置</Text>
        </View>
        <Text className="text-sm text-gray-600">添加您的员工信息。这是排班管理的基础。</Text>
      </View>

      {/* 员工列表 */}
      {staff.length > 1 && (
        <View className="mb-4">
          <Text className="text-xs text-gray-600 mb-2">已添加 {staff.length} 名员工</Text>
          <View className="flex gap-2 flex-wrap">
            {staff.map((emp, index) => (
              <View
                key={index}
                className={`px-3 py-2 rounded-lg border ${
                  index === editingIndex ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-gray-50'
                }`}
                onClick={() => setEditingIndex(index)}>
                <Text
                  className={`text-sm ${index === editingIndex ? 'text-muted-foreground font-bold' : 'text-gray-700'}`}>
                  {emp.name || `员工${index + 1}`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 当前编辑的员工表单 */}
      <View className="space-y-4">
        <View className="flex items-center justify-between mb-2">
          <Text className="text-sm font-bold text-gray-700">
            {staff.length > 1 ? `编辑员工 ${editingIndex + 1}` : '员工信息'}
          </Text>
          {staff.length > 1 && (
            <Button
              className="bg-blue-100 text-red-600 px-3 py-1 rounded text-xs break-keep"
              size="mini"
              onClick={() => handleRemoveStaff(editingIndex)}>
              删除
            </Button>
          )}
        </View>

        {/* 员工姓名 */}
        <View>
          <View className="flex items-center gap-1 mb-2">
            <Text className="text-sm text-gray-700">员工姓名</Text>
            <Text className="text-red-500">*</Text>
          </View>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-gray-50 rounded-lg px-3 py-3 text-sm border border-gray-200 w-full"
              placeholder="请输入员工姓名"
              value={currentStaff.name}
              onInput={(e) => handleUpdateStaff(editingIndex, 'name', e.detail.value)}
            />
          </View>
        </View>

        {/* 岗位 */}
        <View>
          <View className="flex items-center gap-1 mb-2">
            <Text className="text-sm text-gray-700">岗位</Text>
            <Text className="text-red-500">*</Text>
          </View>
          <Picker
            mode="selector"
            range={positions}
            value={positions.indexOf(currentStaff.position)}
            onChange={(e) => {
              handleUpdateStaff(editingIndex, 'position', positions[e.detail.value])
            }}>
            <View className="bg-gray-50 rounded-lg px-3 py-3 flex items-center justify-between border border-gray-200">
              <Text className="text-sm text-gray-800">{currentStaff.position}</Text>
              <View className="i-mdi-chevron-down text-gray-400" />
            </View>
          </Picker>
        </View>

        {/* 所属门店 */}
        <View>
          <View className="flex items-center gap-1 mb-2">
            <Text className="text-sm text-gray-700">所属门店</Text>
            <Text className="text-red-500">*</Text>
          </View>
          <Picker
            mode="selector"
            range={stores.map((s) => s.name)}
            value={stores.findIndex((s) => s.id === currentStaff.store_id)}
            onChange={(e) => {
              handleUpdateStaff(editingIndex, 'store_id', stores[e.detail.value].id || '')
            }}>
            <View className="bg-gray-50 rounded-lg px-3 py-3 flex items-center justify-between border border-gray-200">
              <Text className="text-sm text-gray-800">
                {stores.find((s) => s.id === currentStaff.store_id)?.name || stores[0]?.name || '请选择'}
              </Text>
              <View className="i-mdi-chevron-down text-gray-400" />
            </View>
          </Picker>
        </View>

        {/* 基础工资 */}
        <View>
          <View className="flex items-center gap-1 mb-2">
            <Text className="text-sm text-gray-700">基础工资（元/月）</Text>
            <Text className="text-red-500">*</Text>
          </View>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-gray-50 rounded-lg px-3 py-3 text-sm border border-gray-200 w-full"
              placeholder="请输入基础工资"
              type="number"
              value={currentStaff.base_salary.toString()}
              onInput={(e) => handleUpdateStaff(editingIndex, 'base_salary', Number(e.detail.value) || 0)}
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
              placeholder="请输入联系电话"
              value={currentStaff.phone}
              onInput={(e) => handleUpdateStaff(editingIndex, 'phone', e.detail.value)}
            />
          </View>
        </View>
      </View>

      {/* 添加员工按钮 */}
      <Button
        className="w-full bg-blue-100 text-white py-3 rounded-lg mt-4 text-sm break-keep border border-blue-200"
        size="default"
        onClick={handleAddStaff}>
        <View className="flex items-center justify-center gap-2">
          <View className="i-mdi-plus-circle" />
          <Text>添加更多员工</Text>
        </View>
      </Button>

      {/* 批量导入提示 */}
      <View className="mt-4 bg-blue-100 rounded-lg p-3">
        <View className="flex items-start gap-2">
          <View className="i-mdi-information text-blue-500 mt-0.5" />
          <Text className="text-xs text-blue-700 flex-1">
            至少需要添加一名员工。如需批量导入员工，可在完成设置后前往管理中心使用Excel导入功能。
          </Text>
        </View>
      </View>
    </View>
  )
}

export default Step3Staff
export type {Step3StaffProps}
