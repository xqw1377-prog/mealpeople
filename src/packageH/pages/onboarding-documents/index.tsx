/**
 * 入职资料页面
 * 展示和管理员工入职所需的各类资料文档
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {useTenantStore} from '@/store/tenant'

// 资料类型
interface Document {
  id: string
  name: string
  description: string
  required: boolean
  status: 'pending' | 'uploaded' | 'approved' | 'rejected'
  uploadedAt?: string
  reviewedAt?: string
  reviewComment?: string
}

// 资料分类
interface DocumentCategory {
  id: string
  name: string
  icon: string
  documents: Document[]
}

export default function OnboardingDocuments() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<DocumentCategory[]>([])

  // 加载资料数据
  const loadDocuments = useCallback(async () => {
    if (!user?.id || !currentTenant?.id) return

    setLoading(true)
    try {
      // 模拟数据 - 实际应从数据库加载
      const mockCategories: DocumentCategory[] = [
        {
          id: 'personal',
          name: '个人身份资料',
          icon: 'i-mdi-account-card',
          documents: [
            {
              id: 'id_card',
              name: '身份证复印件',
              description: '身份证正反面复印件',
              required: true,
              status: 'uploaded',
              uploadedAt: '2025-11-20 10:30:00'
            },
            {
              id: 'photo',
              name: '个人证件照',
              description: '一寸白底证件照',
              required: true,
              status: 'approved',
              uploadedAt: '2025-11-20 10:35:00',
              reviewedAt: '2025-11-20 14:00:00'
            },
            {
              id: 'household',
              name: '户口本复印件',
              description: '户口本首页及本人页',
              required: false,
              status: 'pending'
            }
          ]
        },
        {
          id: 'education',
          name: '学历学位资料',
          icon: 'i-mdi-school',
          documents: [
            {
              id: 'diploma',
              name: '毕业证书',
              description: '最高学历毕业证书复印件',
              required: true,
              status: 'uploaded',
              uploadedAt: '2025-11-20 11:00:00'
            },
            {
              id: 'degree',
              name: '学位证书',
              description: '学位证书复印件',
              required: true,
              status: 'pending'
            },
            {
              id: 'transcript',
              name: '成绩单',
              description: '大学成绩单',
              required: false,
              status: 'pending'
            }
          ]
        },
        {
          id: 'work',
          name: '工作经历资料',
          icon: 'i-mdi-briefcase',
          documents: [
            {
              id: 'resume',
              name: '个人简历',
              description: '详细个人简历',
              required: true,
              status: 'approved',
              uploadedAt: '2025-11-19 16:00:00',
              reviewedAt: '2025-11-20 09:00:00'
            },
            {
              id: 'resignation_proof',
              name: '离职证明',
              description: '上家公司离职证明',
              required: true,
              status: 'rejected',
              uploadedAt: '2025-11-20 09:30:00',
              reviewedAt: '2025-11-20 15:00:00',
              reviewComment: '离职证明日期不清晰，请重新上传'
            },
            {
              id: 'reference',
              name: '推荐信',
              description: '工作推荐信',
              required: false,
              status: 'pending'
            }
          ]
        },
        {
          id: 'other',
          name: '其他资料',
          icon: 'i-mdi-file-document-multiple',
          documents: [
            {
              id: 'health_check',
              name: '健康证明',
              description: '入职体检报告',
              required: true,
              status: 'pending'
            },
            {
              id: 'bank_card',
              name: '银行卡信息',
              description: '工资卡银行卡号',
              required: true,
              status: 'uploaded',
              uploadedAt: '2025-11-20 12:00:00'
            },
            {
              id: 'emergency_contact',
              name: '紧急联系人',
              description: '紧急联系人信息表',
              required: true,
              status: 'approved',
              uploadedAt: '2025-11-20 10:00:00',
              reviewedAt: '2025-11-20 11:00:00'
            }
          ]
        }
      ]

      setCategories(mockCategories)
    } catch (error) {
      console.error('加载入职资料失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [user, currentTenant])

  useDidShow(() => {
    loadDocuments()
  })

  // 获取状态文本
  const getStatusText = (status: Document['status']) => {
    const statusMap = {
      pending: '待上传',
      uploaded: '待审核',
      approved: '已通过',
      rejected: '已驳回'
    }
    return statusMap[status]
  }

  // 获取状态颜色
  const getStatusColor = (status: Document['status']) => {
    const colorMap = {
      pending: 'bg-gray-50 text-gray-600',
      uploaded: 'bg-blue-100 text-muted-foreground',
      approved: 'bg-green-100 text-muted-foreground',
      rejected: 'bg-red-100 text-red-600'
    }
    return colorMap[status]
  }

  // 上传资料
  const handleUpload = (_doc: Document) => {
    Taro.showToast({
      title: '上传功能开发中',
      icon: 'none'
    })
  }

  // 查看资料
  const handleView = (_doc: Document) => {
    Taro.showToast({
      title: '查看功能开发中',
      icon: 'none'
    })
  }

  // 计算统计数据
  const getTotalStats = () => {
    let total = 0
    let uploaded = 0
    let approved = 0
    let required = 0

    categories.forEach((category) => {
      category.documents.forEach((doc) => {
        total++
        if (doc.required) required++
        if (doc.status === 'uploaded' || doc.status === 'approved') uploaded++
        if (doc.status === 'approved') approved++
      })
    })

    return {total, uploaded, approved, required}
  }

  const stats = getTotalStats()

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4 max-sm:p-3">
          {/* 统计卡片 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <View className="flex items-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="i-mdi-file-document-multiple text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
              <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground">
                资料提交进度
              </Text>
            </View>

            <View className="grid grid-cols-4 gap-2 max-sm:gap-1.5">
              <View className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                  {stats.total}
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">总资料</Text>
              </View>
              <View className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-red-500">
                  {stats.required}
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">必需</Text>
              </View>
              <View className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-500">
                  {stats.uploaded}
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">已上传</Text>
              </View>
              <View className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-green-500">
                  {stats.approved}
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">已通过</Text>
              </View>
            </View>

            {/* 进度条 */}
            <View className="mt-4">
              <View className="flex items-center justify-between mb-2 max-sm:mb-1.5">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">完成度</Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-blue-600">
                  {Math.round((stats.approved / stats.total) * 100)}%
                </Text>
              </View>
              <View className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <View
                  className="h-full bg-blue-100 rounded-full"
                  style={{width: `${(stats.approved / stats.total) * 100}%`}}
                />
              </View>
            </View>
          </View>

          {/* 资料分类列表 */}
          {loading ? (
            <View className="flex items-center justify-center p-8 max-sm:p-6">
              <View className="i-mdi-loading animate-spin text-4xl max-sm:text-3xl text-blue-600" />
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-2">加载中...</Text>
            </View>
          ) : (
            categories.map((category) => (
              <View
                key={category.id}
                className="bg-white rounded-xl mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md overflow-hidden">
                {/* 分类标题 */}
                <View className="p-4 max-sm:p-3 border-b border-border flex items-center">
                  <View
                    className={`${category.icon} text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2`}
                  />
                  <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground">
                    {category.name}
                  </Text>
                  <View className="ml-auto px-2 py-1 bg-blue-100 rounded">
                    <Text className="text-xs max-sm:text-[10px] text-blue-600">
                      {category.documents.filter((d) => d.status === 'approved').length}/{category.documents.length}
                    </Text>
                  </View>
                </View>

                {/* 资料列表 */}
                {category.documents.map((doc) => (
                  <View key={doc.id} className="p-4 max-sm:p-3 border-b border-border last:border-b-0">
                    <View className="flex items-start justify-between mb-2 max-sm:mb-1.5">
                      <View className="flex-1">
                        <View className="flex items-center">
                          <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                            {doc.name}
                          </Text>
                          {doc.required && (
                            <View className="ml-2 px-1.5 py-0.5 bg-red-100 rounded">
                              <Text className="text-xs max-sm:text-[10px] text-red-600">必需</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                          {doc.description}
                        </Text>
                      </View>
                      <View className={`ml-2 px-2 py-1 rounded ${getStatusColor(doc.status)}`}>
                        <Text className="text-xs max-sm:text-[10px]">{getStatusText(doc.status)}</Text>
                      </View>
                    </View>

                    {/* 时间信息 */}
                    {doc.uploadedAt && (
                      <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                        上传时间：{doc.uploadedAt}
                      </Text>
                    )}
                    {doc.reviewedAt && (
                      <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                        审核时间：{doc.reviewedAt}
                      </Text>
                    )}

                    {/* 驳回原因 */}
                    {doc.status === 'rejected' && doc.reviewComment && (
                      <View className="mt-2 p-2 bg-blue-100 rounded">
                        <Text className="text-xs max-sm:text-[10px] text-red-600">驳回原因：{doc.reviewComment}</Text>
                      </View>
                    )}

                    {/* 操作按钮 */}
                    <View className="flex items-center mt-3 gap-2 max-sm:gap-1.5">
                      {doc.status === 'pending' || doc.status === 'rejected' ? (
                        <Button
                          className="flex-1 bg-blue-100 text-white py-2 rounded break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                          size="default"
                          onClick={() => handleUpload(doc)}>
                          {doc.status === 'rejected' ? '重新上传' : '上传资料'}
                        </Button>
                      ) : (
                        <Button
                          className="flex-1 bg-gray-50 text-foreground py-2 rounded break-keep text-sm max-sm:text-xs max-sm:text-[10px] border border-border"
                          size="default"
                          onClick={() => handleView(doc)}>
                          查看资料
                        </Button>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}

          {/* 提示信息 */}
          <View className="bg-blue-100 rounded-xl p-4 max-sm:p-3 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <View className="flex items-start">
              <View className="i-mdi-information text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-500 mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground font-medium block mb-1">
                  温馨提示
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-blue-600 block">
                  1. 请确保上传的资料清晰可见，文件格式为 JPG、PNG 或 PDF
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-blue-600 block">
                  2. 标记为"必需"的资料必须上传才能完成入职
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-blue-600 block">
                  3. 资料审核通过后，如需修改请联系HR
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-blue-600 block">
                  4. 所有资料将严格保密，仅用于入职流程
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
