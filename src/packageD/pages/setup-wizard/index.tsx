import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {createEmployee, createStore, updateTenant} from '@/db/api'
import {useTenantStore} from '@/store/tenant'
import Step1Brand from './components/Step1Brand'
import Step2Stores from './components/Step2Stores'
import Step3Staff from './components/Step3Staff'
import Step4Schedule from './components/Step4Schedule'
import Step5Complete from './components/Step5Complete'
import StepIndicator from './components/StepIndicator'
import type {BrandInfo, ScheduleConfig, StaffInfo, StoreInfo} from './types'

const SetupWizard: React.FC = () => {
  const {user} = useAuth({guard: true})
  // 使用 selector 方式获取 store 状态
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  // 各步骤数据
  const [brandInfo, setBrandInfo] = useState<BrandInfo | null>(null)
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [staff, setStaff] = useState<StaffInfo[]>([])
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig | null>(null)

  // 验证当前步骤
  const validateCurrentStep = useCallback(() => {
    switch (currentStep) {
      case 1:
        if (!brandInfo?.name.trim()) {
          Taro.showToast({title: '请输入租户名称', icon: 'none'})
          return false
        }
        return true
      case 2:
        if (stores.length === 0) {
          Taro.showToast({title: '请至少添加一家门店', icon: 'none'})
          return false
        }
        for (const store of stores) {
          if (!store.name.trim()) {
            Taro.showToast({title: '请填写门店名称', icon: 'none'})
            return false
          }
          if (!store.address.trim()) {
            Taro.showToast({title: '请填写门店地址', icon: 'none'})
            return false
          }
        }
        return true
      case 3:
        if (staff.length === 0) {
          Taro.showToast({title: '请至少添加一名员工', icon: 'none'})
          return false
        }
        for (const emp of staff) {
          if (!emp.name.trim()) {
            Taro.showToast({title: '请填写员工姓名', icon: 'none'})
            return false
          }
          if (!emp.base_salary || emp.base_salary <= 0) {
            Taro.showToast({title: '请填写员工工资', icon: 'none'})
            return false
          }
        }
        return true
      case 4:
        if (!scheduleConfig) {
          Taro.showToast({title: '请完成排班配置', icon: 'none'})
          return false
        }
        return true
      default:
        return true
    }
  }, [currentStep, brandInfo, stores, staff, scheduleConfig])

  // 保存数据到数据库
  const saveToDatabase = useCallback(async () => {
    if (!currentTenant || !brandInfo) return false

    try {
      setLoading(true)

      // 1. 更新租户信息
      await updateTenant(currentTenant.id, {
        name: brandInfo.name,
        industry: brandInfo.industry
      })

      // 2. 创建门店
      const createdStores = []
      for (const store of stores) {
        const newStore = await createStore({
          tenant_id: currentTenant.id,
          name: store.name,
          address: store.address
        })
        createdStores.push(newStore)
      }

      // 3. 创建员工
      for (const emp of staff) {
        // 找到对应的门店ID
        const storeIndex = stores.findIndex((s) => s.id === emp.store_id)
        const actualStoreId = createdStores[storeIndex]?.id

        if (actualStoreId) {
          await createEmployee({
            tenant_id: currentTenant.id,
            store_id: actualStoreId,
            name: emp.name,
            position: emp.position,
            phone: emp.phone || null,
            employee_type: 'full_time'
          })
        }
      }

      // 4. 保存排班配置（这里可以扩展保存到配置表）
      // TODO: 实现配置保存逻辑

      return true
    } catch (error) {
      console.error('保存数据失败:', error)
      Taro.showToast({
        title: '保存失败，请重试',
        icon: 'error'
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [currentTenant, brandInfo, stores, staff])

  // 下一步
  const handleNext = useCallback(async () => {
    if (!validateCurrentStep()) return

    if (currentStep === 5) {
      // 最后一步，保存数据
      const success = await saveToDatabase()
      if (success) {
        Taro.showToast({
          title: '设置完成！',
          icon: 'success'
        })
      }
      return
    }

    // 标记当前步骤为已完成
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep])
    }

    // 进入下一步
    setCurrentStep(currentStep + 1)
  }, [currentStep, completedSteps, validateCurrentStep, saveToDatabase])

  // 上一步
  const handlePrev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  // 跳过（仅用于可选步骤）
  const _handleSkip = useCallback(() => {
    setCurrentStep(currentStep + 1)
  }, [currentStep])

  // 渲染当前步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Brand initialData={brandInfo} onComplete={setBrandInfo} />
      case 2:
        return <Step2Stores initialData={stores} onComplete={setStores} />
      case 3:
        return <Step3Staff initialData={staff} stores={stores} onComplete={setStaff} />
      case 4:
        return <Step4Schedule initialData={scheduleConfig} onComplete={setScheduleConfig} />
      case 5:
        return <Step5Complete brandInfo={brandInfo} stores={stores} staff={staff} scheduleConfig={scheduleConfig} />
      default:
        return null
    }
  }

  if (!currentTenant) {
    return (
      <View
        className="min-h-screen flex items-center justify-center"
        style={{background: 'linear-gradient(to bottom, #dbeafe, #bfdbfe)'}}>
        <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center mx-4">
          <View className="i-mdi-alert-circle-outline text-6xl text-blue-500 mx-auto mb-4" />
          <Text className="text-base text-foreground block mb-2">请先选择租户</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4">
          {/* 头部标题 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center gap-3">
              <View className="i-mdi-wizard-hat text-3xl text-blue-500" />
              <View className="flex-1">
                <Text className="text-lg font-bold text-foreground block mb-1">系统设置向导</Text>
                <Text className="text-xs text-muted-foreground block">按照步骤完成系统配置，开始使用</Text>
              </View>
            </View>
          </View>

          {/* 进度指示器 */}
          <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

          {/* 当前步骤内容 */}
          {renderStepContent()}

          {/* 底部操作按钮 */}
          {currentStep < 5 && (
            <View className="mt-4 space-y-3">
              <View className="flex gap-3">
                {currentStep > 1 && (
                  <Button
                    className="flex-1 bg-white text-foreground py-4 rounded-lg text-base break-keep border border-gray-300"
                    size="default"
                    onClick={handlePrev}
                    disabled={loading}>
                    上一步
                  </Button>
                )}
                <Button
                  className={`${currentStep === 1 ? 'w-full' : 'flex-1'} bg-blue-100 text-white py-4 rounded-lg text-base break-keep`}
                  size="default"
                  onClick={handleNext}
                  disabled={loading}>
                  {loading ? '保存中...' : currentStep === 4 ? '完成设置' : '下一步'}
                </Button>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default SetupWizard
