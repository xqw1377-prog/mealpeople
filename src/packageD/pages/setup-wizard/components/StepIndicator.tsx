import {Text, View} from '@tarojs/components'
import type React from 'react'

interface StepIndicatorProps {
  currentStep: number
  completedSteps: number[]
}

const steps = [
  {id: 1, name: '品牌信息'},
  {id: 2, name: '门店信息'},
  {id: 3, name: '人员信息'},
  {id: 4, name: '排班配置'},
  {id: 5, name: '完成'}
]

const StepIndicator: React.FC<StepIndicatorProps> = ({currentStep, completedSteps}) => {
  const getStepStatus = (stepId: number) => {
    if (completedSteps.includes(stepId)) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'pending'
  }

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-blue-100 text-white'
      case 'current':
        return 'bg-blue-100 text-white'
      default:
        return 'bg-gray-300 text-gray-600'
    }
  }

  return (
    <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
      <View className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id)
          const colorClass = getStepColor(status)

          return (
            <View key={step.id} className="flex items-center flex-1">
              {/* 步骤圆圈 */}
              <View className="flex flex-col items-center">
                <View className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                  {status === 'completed' ? (
                    <View className="i-mdi-check text-lg" />
                  ) : (
                    <Text className="text-sm font-bold">{step.id}</Text>
                  )}
                </View>
                <Text
                  className={`text-xs mt-1 ${status === 'current' ? 'text-muted-foreground font-bold' : 'text-gray-600'}`}>
                  {step.name}
                </Text>
              </View>

              {/* 连接线 */}
              {index < steps.length - 1 && (
                <View
                  className={`flex-1 h-0.5 mx-2 ${completedSteps.includes(step.id) ? 'bg-blue-100' : 'bg-gray-300'}`}
                />
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}

export default StepIndicator
