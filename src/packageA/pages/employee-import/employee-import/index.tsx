/**
 * 员工批量导入页面
 * 支持Excel文件导入，数据验证和预览
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {batchCreateEmployees} from '@/db/api-employee-hub'
import type {Employee} from '@/db/types-employee-hub'

// 导入数据接口
interface ImportData {
  name: string
  phone: string
  email?: string
  department?: string
  position?: string
  employment_type?: string
  monthly_salary?: number
  status?: string
}

// 验证结果接口
interface ValidationResult {
  valid: boolean
  errors: string[]
}

export default function EmployeeImport() {
  const {user} = useAuth({guard: true})
  const [importData, setImportData] = useState<ImportData[]>([])
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [importing, setImporting] = useState(false)
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [importResult, setImportResult] = useState<{success: number; failed: number}>({
    success: 0,
    failed: 0
  })

  // 下载Excel模板
  const downloadTemplate = useCallback(() => {
    Taro.showModal({
      title: '下载模板',
      content: '模板包含以下字段：\n姓名*、手机号*、邮箱、部门、岗位、雇佣类型、月薪、状态\n\n*为必填项',
      confirmText: '我知道了',
      showCancel: false
    })
  }, [])

  // 验证数据
  const validateData = useCallback((data: ImportData[]) => {
    const results: ValidationResult[] = data.map((item) => {
      const errors: string[] = []

      // 必填字段验证
      if (!item.name || item.name.trim() === '') {
        errors.push('姓名不能为空')
      }
      if (!item.phone || item.phone.trim() === '') {
        errors.push('手机号不能为空')
      } else if (!/^1[3-9]\d{9}$/.test(item.phone)) {
        errors.push('手机号格式不正确')
      }

      // 邮箱格式验证
      if (item.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) {
        errors.push('邮箱格式不正确')
      }

      // 月薪验证
      if (item.monthly_salary && item.monthly_salary < 0) {
        errors.push('月薪不能为负数')
      }

      return {
        valid: errors.length === 0,
        errors
      }
    })

    setValidationResults(results)
  }, [])

  // 选择文件（模拟）
  const selectFile = useCallback(() => {
    // 在实际应用中，这里应该调用文件选择API
    // 由于小程序环境限制，这里提供一个模拟的数据输入方式
    Taro.showModal({
      title: '文件选择',
      content: '在WEB端，您可以选择Excel文件上传。\n在小程序端，建议使用手动录入或WEB端导入。',
      confirmText: '使用示例数据',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 使用示例数据
          const sampleData: ImportData[] = [
            {
              name: '张三',
              phone: '13800138001',
              email: 'zhangsan@example.com',
              department: '前厅部',
              position: '服务员',
              employment_type: 'full_time',
              monthly_salary: 5000,
              status: 'active'
            },
            {
              name: '李四',
              phone: '13800138002',
              email: 'lisi@example.com',
              department: '后厨部',
              position: '厨师',
              employment_type: 'full_time',
              monthly_salary: 6000,
              status: 'active'
            },
            {
              name: '王五',
              phone: '13800138003',
              department: '前厅部',
              position: '收银员',
              employment_type: 'part_time',
              monthly_salary: 3000,
              status: 'active'
            }
          ]
          setImportData(sampleData)
          validateData(sampleData)
          setStep('preview')
        }
      }
    })
  }, [validateData])

  // 执行导入
  const executeImport = useCallback(async () => {
    if (!user?.id) return

    // 检查是否有验证错误
    const hasErrors = validationResults.some((result) => !result.valid)
    if (hasErrors) {
      Taro.showToast({
        title: '请先修复数据错误',
        icon: 'none'
      })
      return
    }

    setImporting(true)
    try {
      // 转换数据格式
      const employees: Omit<Employee, 'id' | 'created_at' | 'updated_at'>[] = importData.map((item) => ({
        tenant_id: user.id,
        name: item.name,
        phone: item.phone,
        email: item.email || null,
        department: item.department || null,
        position: item.position || null,
        employment_type: (item.employment_type as 'full_time' | 'part_time' | 'intern') || 'full_time',
        monthly_salary: item.monthly_salary || null,
        status: (item.status as 'active' | 'on_leave' | 'resigned' | 'terminated') || 'active',
        hire_date: new Date().toISOString().split('T')[0]
      }))

      // 批量创建员工
      const result = await batchCreateEmployees(employees)

      setImportResult({
        success: result.length,
        failed: importData.length - result.length
      })

      setStep('result')

      Taro.showToast({
        title: `成功导入${result.length}条数据`,
        icon: 'success'
      })
    } catch (error) {
      console.error('导入失败:', error)
      Taro.showToast({
        title: '导入失败',
        icon: 'none'
      })
    } finally {
      setImporting(false)
    }
  }, [user, importData, validationResults])

  // 返回员工中心
  const backToEmployeeHub = useCallback(() => {
    Taro.navigateBack()
  }, [])

  // 重新导入
  const resetImport = useCallback(() => {
    setImportData([])
    setValidationResults([])
    setImportResult({success: 0, failed: 0})
    setStep('upload')
  }, [])

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        {/* 使用容器查询支持WEB端响应式 */}
        <View className="@container">
          <View className="p-4 max-w-7xl mx-auto">
            {/* 页面标题 */}
            <View className="mb-6">
              <View className="flex items-center gap-3 mb-2">
                <View className="w-12 h-12 rounded-lg bg-white backdrop-blur flex items-center justify-center">
                  <View className="i-mdi-file-import text-3xl text-blue-600" />
                </View>
                <View>
                  <Text className="text-2xl max-sm:text-xl font-bold text-foreground">员工批量导入</Text>
                  <Text className="text-sm text-blue-600/80">Excel文件导入</Text>
                </View>
              </View>
            </View>

            {/* 步骤1: 上传文件 */}
            {step === 'upload' && (
              <View>
                {/* 使用说明 */}
                <View className="bg-white backdrop-blur rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-md">
                  <View className="flex items-center gap-3 mb-4">
                    <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <View className="i-mdi-information text-2xl text-blue-600" />
                    </View>
                    <Text className="text-lg max-sm:text-base font-bold text-foreground">使用说明</Text>
                  </View>

                  <View className="space-y-3">
                    <View className="flex items-start gap-2">
                      <View className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Text className="text-xs text-blue-600 font-bold">1</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm max-sm:text-xs text-foreground">下载Excel模板文件</Text>
                      </View>
                    </View>

                    <View className="flex items-start gap-2">
                      <View className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Text className="text-xs text-blue-600 font-bold">2</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm max-sm:text-xs text-foreground">
                          按照模板格式填写员工信息（姓名和手机号为必填项）
                        </Text>
                      </View>
                    </View>

                    <View className="flex items-start gap-2">
                      <View className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Text className="text-xs text-blue-600 font-bold">3</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm max-sm:text-xs text-foreground">上传填写好的Excel文件</Text>
                      </View>
                    </View>

                    <View className="flex items-start gap-2">
                      <View className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Text className="text-xs text-blue-600 font-bold">4</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm max-sm:text-xs text-foreground">预览并确认导入数据</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 模板字段说明 */}
                <View className="bg-white backdrop-blur rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-md">
                  <View className="flex items-center gap-3 mb-4">
                    <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <View className="i-mdi-table text-2xl text-blue-600" />
                    </View>
                    <Text className="text-lg max-sm:text-base font-bold text-foreground">模板字段说明</Text>
                  </View>

                  <View className="space-y-2">
                    <View className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <View className="w-2 h-2 rounded-full bg-red-500" />
                      <Text className="text-sm max-sm:text-xs text-foreground flex-1">
                        <Text className="font-bold">姓名*</Text> - 员工姓名（必填）
                      </Text>
                    </View>

                    <View className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <View className="w-2 h-2 rounded-full bg-red-500" />
                      <Text className="text-sm max-sm:text-xs text-foreground flex-1">
                        <Text className="font-bold">手机号*</Text> - 11位手机号码（必填）
                      </Text>
                    </View>

                    <View className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <View className="w-2 h-2 rounded-full bg-gray-400" />
                      <Text className="text-sm max-sm:text-xs text-foreground flex-1">
                        <Text className="font-bold">邮箱</Text> - 电子邮箱地址（选填）
                      </Text>
                    </View>

                    <View className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <View className="w-2 h-2 rounded-full bg-gray-400" />
                      <Text className="text-sm max-sm:text-xs text-foreground flex-1">
                        <Text className="font-bold">部门</Text> - 所属部门（选填）
                      </Text>
                    </View>

                    <View className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <View className="w-2 h-2 rounded-full bg-gray-400" />
                      <Text className="text-sm max-sm:text-xs text-foreground flex-1">
                        <Text className="font-bold">岗位</Text> - 工作岗位（选填）
                      </Text>
                    </View>

                    <View className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <View className="w-2 h-2 rounded-full bg-gray-400" />
                      <Text className="text-sm max-sm:text-xs text-foreground flex-1">
                        <Text className="font-bold">雇佣类型</Text> - full_time/part_time/intern（选填）
                      </Text>
                    </View>

                    <View className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <View className="w-2 h-2 rounded-full bg-gray-400" />
                      <Text className="text-sm max-sm:text-xs text-foreground flex-1">
                        <Text className="font-bold">月薪</Text> - 月薪金额（选填）
                      </Text>
                    </View>

                    <View className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <View className="w-2 h-2 rounded-full bg-gray-400" />
                      <Text className="text-sm max-sm:text-xs text-foreground flex-1">
                        <Text className="font-bold">状态</Text> - active/on_leave/resigned（选填）
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 操作按钮 */}
                <View className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                  <Button
                    className="bg-white text-blue-600 border-2 border-blue-600 py-4 rounded-lg break-keep text-base font-bold"
                    size="default"
                    onClick={downloadTemplate}>
                    <View className="flex items-center justify-center gap-2">
                      <View className="i-mdi-download text-xl" />
                      <Text>下载模板</Text>
                    </View>
                  </Button>

                  <Button
                    className="bg-blue-600 text-white py-4 rounded-lg break-keep text-base font-bold"
                    size="default"
                    onClick={selectFile}>
                    <View className="flex items-center justify-center gap-2">
                      <View className="i-mdi-file-upload text-xl" />
                      <Text>选择文件</Text>
                    </View>
                  </Button>
                </View>
              </View>
            )}

            {/* 步骤2: 预览数据 */}
            {step === 'preview' && (
              <View>
                {/* 数据统计 */}
                <View className="bg-white backdrop-blur rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-md">
                  <View className="flex items-center gap-3 mb-4">
                    <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <View className="i-mdi-chart-box text-2xl text-blue-600" />
                    </View>
                    <Text className="text-lg max-sm:text-base font-bold text-foreground">数据统计</Text>
                  </View>

                  <View className="grid grid-cols-3 gap-3">
                    <View className="text-center p-3 bg-gray-50 rounded-lg">
                      <Text className="text-2xl max-sm:text-xl font-bold text-foreground">{importData.length}</Text>
                      <Text className="text-xs text-muted-foreground mt-1">总数</Text>
                    </View>

                    <View className="text-center p-3 bg-blue-50 rounded-lg">
                      <Text className="text-2xl max-sm:text-xl font-bold text-blue-600">
                        {validationResults.filter((r) => r.valid).length}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-1">有效</Text>
                    </View>

                    <View className="text-center p-3 bg-red-50 rounded-lg">
                      <Text className="text-2xl max-sm:text-xl font-bold text-red-600">
                        {validationResults.filter((r) => !r.valid).length}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-1">错误</Text>
                    </View>
                  </View>
                </View>

                {/* 数据列表 */}
                <View className="mb-4">
                  <Text className="text-lg max-sm:text-base font-bold text-foreground mb-3">数据预览</Text>

                  {importData.map((item, index) => (
                    <View
                      key={index}
                      className={`bg-white backdrop-blur rounded-lg p-4 border-2 mb-3 shadow-sm ${
                        validationResults[index]?.valid ? 'border-blue-200' : 'border-red-200'
                      }`}>
                      <View className="flex items-center justify-between mb-3">
                        <View className="flex items-center gap-2">
                          <View
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              validationResults[index]?.valid ? 'bg-blue-100' : 'bg-red-100'
                            }`}>
                            <View
                              className={`text-xl ${
                                validationResults[index]?.valid
                                  ? 'i-mdi-check text-blue-600'
                                  : 'i-mdi-alert text-red-600'
                              }`}
                            />
                          </View>
                          <Text className="text-base max-sm:text-sm font-bold text-foreground">{item.name}</Text>
                        </View>
                        <View
                          className={`px-3 py-1 rounded-full ${
                            validationResults[index]?.valid ? 'bg-blue-100' : 'bg-red-100'
                          }`}>
                          <Text
                            className={`text-xs ${
                              validationResults[index]?.valid ? 'text-blue-600' : 'text-red-600'
                            } font-bold`}>
                            {validationResults[index]?.valid ? '有效' : '错误'}
                          </Text>
                        </View>
                      </View>

                      <View className="space-y-2">
                        <View className="flex items-center gap-2">
                          <View className="i-mdi-phone text-base text-muted-foreground" />
                          <Text className="text-sm max-sm:text-xs text-foreground">{item.phone}</Text>
                        </View>

                        {item.email && (
                          <View className="flex items-center gap-2">
                            <View className="i-mdi-email text-base text-muted-foreground" />
                            <Text className="text-sm max-sm:text-xs text-foreground">{item.email}</Text>
                          </View>
                        )}

                        {item.department && (
                          <View className="flex items-center gap-2">
                            <View className="i-mdi-office-building text-base text-muted-foreground" />
                            <Text className="text-sm max-sm:text-xs text-foreground">{item.department}</Text>
                          </View>
                        )}

                        {item.position && (
                          <View className="flex items-center gap-2">
                            <View className="i-mdi-briefcase text-base text-muted-foreground" />
                            <Text className="text-sm max-sm:text-xs text-foreground">{item.position}</Text>
                          </View>
                        )}
                      </View>

                      {/* 错误信息 */}
                      {!validationResults[index]?.valid && validationResults[index]?.errors.length > 0 && (
                        <View className="mt-3 p-3 bg-red-50 rounded-lg">
                          {validationResults[index].errors.map((error, errorIndex) => (
                            <View key={errorIndex} className="flex items-center gap-2 mb-1">
                              <View className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              <Text className="text-xs text-red-600">{error}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                {/* 操作按钮 */}
                <View className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                  <Button
                    className="bg-white text-foreground border-2 border-gray-200 py-4 rounded-lg break-keep text-base"
                    size="default"
                    onClick={resetImport}>
                    <View className="flex items-center justify-center gap-2">
                      <View className="i-mdi-arrow-left text-xl" />
                      <Text>重新选择</Text>
                    </View>
                  </Button>

                  <Button
                    className={`py-4 rounded-lg break-keep text-base font-bold ${
                      validationResults.some((r) => !r.valid) ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white'
                    }`}
                    size="default"
                    disabled={validationResults.some((r) => !r.valid) || importing}
                    onClick={executeImport}>
                    <View className="flex items-center justify-center gap-2">
                      {importing ? (
                        <>
                          <View className="i-mdi-loading text-xl animate-spin" />
                          <Text>导入中...</Text>
                        </>
                      ) : (
                        <>
                          <View className="i-mdi-check text-xl" />
                          <Text>确认导入</Text>
                        </>
                      )}
                    </View>
                  </Button>
                </View>
              </View>
            )}

            {/* 步骤3: 导入结果 */}
            {step === 'result' && (
              <View>
                {/* 结果展示 */}
                <View className="bg-white backdrop-blur rounded-lg p-8 border-2 border-gray-200 mb-4 shadow-md text-center">
                  <View className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <View className="i-mdi-check-circle text-5xl text-blue-600" />
                  </View>

                  <Text className="text-2xl max-sm:text-xl font-bold text-foreground mb-2">导入完成</Text>
                  <Text className="text-sm text-muted-foreground mb-6">员工数据已成功导入系统</Text>

                  <View className="grid grid-cols-2 gap-4 mb-6">
                    <View className="p-4 bg-blue-50 rounded-lg">
                      <Text className="text-3xl max-sm:text-2xl font-bold text-blue-600 mb-1">
                        {importResult.success}
                      </Text>
                      <Text className="text-sm text-muted-foreground">成功导入</Text>
                    </View>

                    <View className="p-4 bg-gray-50 rounded-lg">
                      <Text className="text-3xl max-sm:text-2xl font-bold text-foreground mb-1">
                        {importResult.failed}
                      </Text>
                      <Text className="text-sm text-muted-foreground">导入失败</Text>
                    </View>
                  </View>
                </View>

                {/* 操作按钮 */}
                <View className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                  <Button
                    className="bg-white text-foreground border-2 border-gray-200 py-4 rounded-lg break-keep text-base"
                    size="default"
                    onClick={resetImport}>
                    <View className="flex items-center justify-center gap-2">
                      <View className="i-mdi-refresh text-xl" />
                      <Text>继续导入</Text>
                    </View>
                  </Button>

                  <Button
                    className="bg-blue-600 text-white py-4 rounded-lg break-keep text-base font-bold"
                    size="default"
                    onClick={backToEmployeeHub}>
                    <View className="flex items-center justify-center gap-2">
                      <View className="i-mdi-arrow-left text-xl" />
                      <Text>返回员工中心</Text>
                    </View>
                  </Button>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
