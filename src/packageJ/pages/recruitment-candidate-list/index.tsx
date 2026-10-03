/**
 * 候选人列表页面 - 招聘管理
 */

import {Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getCandidates} from '@/db/api-lifecycle'
import type {Candidate} from '@/db/types-lifecycle'
import {useTenantStore} from '@/store/tenant'

export default function RecruitmentCandidateList() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'interview' | 'offer' | 'hired' | 'rejected'>(
    'all'
  )

  // 加载候选人列表
  const loadCandidates = useCallback(async () => {
    if (!currentTenant?.id) return

    setLoading(true)
    try {
      const data = await getCandidates(currentTenant.id)
      setCandidates(data)
      setFilteredCandidates(data)
    } catch (error) {
      console.error('加载候选人列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useDidShow(() => {
    loadCandidates()
  })

  // 筛选候选人
  const filterCandidates = useCallback(
    (text: string, status: 'all' | 'pending' | 'interview' | 'offer' | 'hired' | 'rejected') => {
      let filtered = candidates

      // 状态筛选
      if (status !== 'all') {
        filtered = filtered.filter((c) => c.status === status)
      }

      // 搜索筛选
      if (text) {
        filtered = filtered.filter(
          (c) =>
            c.name?.toLowerCase().includes(text.toLowerCase()) || c.phone?.includes(text) || c.email?.includes(text)
        )
      }

      setFilteredCandidates(filtered)
    },
    [candidates]
  )

  // 搜索和筛选
  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text)
      filterCandidates(text, statusFilter)
    },
    [statusFilter, filterCandidates]
  )

  const handleStatusFilter = useCallback(
    (status: 'all' | 'pending' | 'interview' | 'offer' | 'hired' | 'rejected') => {
      setStatusFilter(status)
      filterCandidates(searchText, status)
    },
    [searchText, filterCandidates]
  )

  // 获取状态文本和颜色
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, {text: string; color: string; bgColor: string}> = {
      pending: {text: '待处理', color: 'text-muted-foreground', bgColor: 'bg-gray-50'},
      interview: {text: '面试中', color: 'text-accent', bgColor: 'bg-accent/10'},
      offer: {text: '已发Offer', color: 'text-secondary', bgColor: 'bg-secondary/10'},
      hired: {text: '已录用', color: 'text-blue-600', bgColor: 'bg-blue-100'},
      rejected: {text: '已拒绝', color: 'text-destructive', bgColor: 'bg-destructive/10'}
    }
    return statusMap[status] || {text: '未知', color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
  }

  // 获取来源图标
  const getSourceIcon = (source: string) => {
    const sourceMap: Record<string, string> = {
      内推: 'i-mdi-account-group',
      招聘网站: 'i-mdi-web',
      校园招聘: 'i-mdi-school',
      其他: 'i-mdi-dots-horizontal'
    }
    return sourceMap[source] || 'i-mdi-help-circle'
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4 max-sm:p-3">
          {/* 搜索框 */}
          <View className="bg-white rounded-xl p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <View className="flex items-center bg-gray-50 rounded-lg px-3 max-sm:px-2 py-2">
              <View className="i-mdi-magnify text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-2" />
              <Input
                className="flex-1 text-sm max-sm:text-xs max-sm:text-[10px] text-foreground"
                placeholder="搜索姓名、手机号或邮箱"
                value={searchText}
                onInput={(e) => handleSearch(e.detail.value)}
              />
            </View>
          </View>

          {/* 状态筛选 */}
          <ScrollView scrollX className="mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <View className="flex gap-2 max-sm:gap-1.5" style={{width: 'max-content'}}>
              <View
                className={`py-2 px-4 max-sm:px-3 max-sm:px-2 rounded-lg whitespace-nowrap ${
                  statusFilter === 'all' ? 'bg-blue-100 text-white' : 'bg-white text-foreground'
                }`}
                onClick={() => handleStatusFilter('all')}>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium">全部</Text>
              </View>
              <View
                className={`py-2 px-4 max-sm:px-3 max-sm:px-2 rounded-lg whitespace-nowrap ${
                  statusFilter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-white text-foreground'
                }`}
                onClick={() => handleStatusFilter('pending')}>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium">待处理</Text>
              </View>
              <View
                className={`py-2 px-4 max-sm:px-3 max-sm:px-2 rounded-lg whitespace-nowrap ${
                  statusFilter === 'interview' ? 'bg-blue-100 text-white' : 'bg-white text-foreground'
                }`}
                onClick={() => handleStatusFilter('interview')}>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium">面试中</Text>
              </View>
              <View
                className={`py-2 px-4 max-sm:px-3 max-sm:px-2 rounded-lg whitespace-nowrap ${
                  statusFilter === 'offer' ? 'bg-blue-100 text-white' : 'bg-white text-foreground'
                }`}
                onClick={() => handleStatusFilter('offer')}>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium">已发Offer</Text>
              </View>
              <View
                className={`py-2 px-4 max-sm:px-3 max-sm:px-2 rounded-lg whitespace-nowrap ${
                  statusFilter === 'hired' ? 'bg-blue-100 text-white' : 'bg-white text-foreground'
                }`}
                onClick={() => handleStatusFilter('hired')}>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium">已录用</Text>
              </View>
              <View
                className={`py-2 px-4 max-sm:px-3 max-sm:px-2 rounded-lg whitespace-nowrap ${
                  statusFilter === 'rejected' ? 'bg-blue-100 text-white' : 'bg-white text-foreground'
                }`}
                onClick={() => handleStatusFilter('rejected')}>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium">已拒绝</Text>
              </View>
            </View>
          </ScrollView>

          {/* 候选人列表 */}
          {loading ? (
            <View className="bg-white rounded-xl p-8 max-sm:p-6 border-2 border-gray-200 shadow-md text-center">
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">加载中...</Text>
            </View>
          ) : filteredCandidates.length === 0 ? (
            <View className="bg-white rounded-xl p-8 max-sm:p-6 border-2 border-gray-200 shadow-md text-center">
              <View className="i-mdi-account-search text-4xl max-sm:text-3xl text-muted-foreground mb-2 max-sm:mb-1.5" />
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">暂无候选人</Text>
            </View>
          ) : (
            <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {filteredCandidates.map((candidate) => {
                const statusInfo = getStatusInfo(candidate.status)
                const sourceIcon = getSourceIcon(candidate.source || '')
                return (
                  <View
                    key={candidate.id}
                    className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 shadow-md"
                    onClick={() =>
                      Taro.navigateTo({
                        url: `/pages/recruitment-candidate-detail/index?id=${candidate.id}`
                      })
                    }>
                    {/* 头部：姓名和状态 */}
                    <View className="flex items-start justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
                      <View className="flex items-center gap-3 max-sm:gap-2 max-sm:gap-1.5">
                        <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <View className="i-mdi-account text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600" />
                        </View>
                        <View>
                          <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground mb-1">
                            {candidate.name}
                          </Text>
                          <View className="flex items-center gap-2 max-sm:gap-1.5">
                            {candidate.source && (
                              <View className="flex items-center">
                                <View
                                  className={`${sourceIcon} text-xs max-sm:text-[10px] text-muted-foreground mr-1`}
                                />
                                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                                  {candidate.source}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                      <View className={`px-2 py-1 rounded-full ${statusInfo.bgColor}`}>
                        <Text className={`text-xs max-sm:text-[10px] font-medium ${statusInfo.color}`}>
                          {statusInfo.text}
                        </Text>
                      </View>
                    </View>

                    {/* 联系方式 */}
                    <View className="space-y-2 max-sm:space-y-1.5 mb-3 max-sm:mb-2 max-sm:mb-1.5">
                      {candidate.phone && (
                        <View className="flex items-center">
                          <View className="i-mdi-phone text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-2" />
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                            {candidate.phone}
                          </Text>
                        </View>
                      )}
                      {candidate.email && (
                        <View className="flex items-center">
                          <View className="i-mdi-email text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-2" />
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                            {candidate.email}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* 底部：时间和操作 */}
                    <View className="flex items-center justify-between pt-3 border-t border-border">
                      <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                        投递时间：{new Date(candidate.created_at).toLocaleDateString()}
                      </Text>
                      <View className="flex items-center gap-2 max-sm:gap-1.5">
                        {candidate.status === 'pending' && (
                          <View
                            className="px-3 max-sm:px-2 py-1 bg-accent/10 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              Taro.showToast({
                                title: '安排面试功能开发中',
                                icon: 'none'
                              })
                            }}>
                            <Text className="text-xs max-sm:text-[10px] text-accent font-medium">安排面试</Text>
                          </View>
                        )}
                        {candidate.status === 'interview' && (
                          <View
                            className="px-3 max-sm:px-2 py-1 bg-secondary/10 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              Taro.showToast({
                                title: '发放Offer功能开发中',
                                icon: 'none'
                              })
                            }}>
                            <Text className="text-xs max-sm:text-[10px] text-secondary font-medium">发放Offer</Text>
                          </View>
                        )}
                        {candidate.status === 'offer' && (
                          <View
                            className="px-3 max-sm:px-2 py-1 bg-blue-100 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              Taro.showToast({
                                title: '确认录用功能开发中',
                                icon: 'none'
                              })
                            }}>
                            <Text className="text-xs max-sm:text-[10px] text-blue-600 font-medium">确认录用</Text>
                          </View>
                        )}
                        <View
                          className="px-3 max-sm:px-2 py-1 bg-gray-50 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            Taro.showToast({
                              title: '查看详情功能开发中',
                              icon: 'none'
                            })
                          }}>
                          <Text className="text-xs max-sm:text-[10px] text-foreground font-medium">详情</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* 底部占位 */}
          <View className="h-20" />
        </View>
      </ScrollView>

      {/* 悬浮添加按钮 */}
      <View
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center shadow-lg"
        style={{zIndex: 100}}
        onClick={() =>
          Taro.showToast({
            title: '添加候选人功能开发中',
            icon: 'none'
          })
        }>
        <View className="i-mdi-plus text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600" />
      </View>
    </View>
  )
}
