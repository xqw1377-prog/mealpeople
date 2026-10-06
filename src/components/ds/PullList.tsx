/**
 * 工作旅途 DS · PullList 列表容器
 * 四合一：下拉刷新 + 触底分页 + 骨架屏 + 空态（带引导动作）
 *
 * 用法：
 * <PullList
 *   fetchPage={(page) => api.list({page, size: 20})}  // 返回 T[]；空数组=结束
 *   renderItem={(item) => <View>...</View>}
 *   keyExtractor={(item) => item.id}
 *   emptyAction={{text: '去创建', onClick: () => Taro.navigateTo({url: '...'})}}
 * />
 */
import {ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import type {ReactNode} from 'react'
import {useCallback, useEffect, useRef, useState} from 'react'

export interface PullListProps<T> {
  fetchPage: (page: number) => Promise<T[]>
  renderItem: (item: T, index: number) => ReactNode
  keyExtractor: (item: T, index: number) => string
  /** 首屏骨架条数（默认 4） */
  skeletonCount?: number
  /** 空态配置 */
  emptyAction?: {text: string; onClick: () => void}
  emptyText?: string
  /** 空态图标 iconify 类名 */
  emptyIcon?: string
  className?: string
  /** 初始自动加载（默认 true） */
  auto?: boolean
}

const PAGE_SIZE_HINT = 20

export function PullList<T>(props: PullListProps<T>) {
  const {
    fetchPage,
    renderItem,
    keyExtractor,
    skeletonCount = 4,
    emptyAction,
    emptyText = '暂无数据',
    emptyIcon = 'i-mdi-inbox-outline',
    className = '',
    auto = true
  } = props

  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [firstLoaded, setFirstLoaded] = useState(false)
  const [finished, setFinished] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  /**
   * P1-C Gate4：独立 error 态。
   * - 首屏失败 → error=true → 渲染错误视图（带重试），绝不落入空态
   * - 翻页失败 → 列表保留，toast 提示（error 保持 false，避免已加载内容被错误视图顶掉）
   */
  const [error, setError] = useState<string | null>(null)
  const reqId = useRef(0)

  const load = useCallback(
    async (targetPage: number, isRefresh: boolean) => {
      const id = ++reqId.current
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      try {
        const rows = await fetchPage(targetPage)
        if (id !== reqId.current) return // 过期响应丢弃
        const done = rows.length < PAGE_SIZE_HINT
        setFinished(done)
        setItems((prev) => (isRefresh ? rows : [...prev, ...rows]))
        setPage(targetPage)
        setError(null)
      } catch (e: any) {
        if (id !== reqId.current) return
        console.error('[PullList] 加载失败', e)
        const msg = e?.message || '加载失败，请检查网络'
        if (isRefresh) {
          // 首屏/刷新失败：进入可见错误态（而非空态）
          setError(msg)
        } else {
          // 翻页失败：保留已有内容，轻提示
          Taro.showToast({title: '加载更多失败，请重试', icon: 'none'})
        }
      } finally {
        if (id === reqId.current) {
          setRefreshing(false)
          setLoading(false)
          setFirstLoaded(true)
        }
      }
    },
    [fetchPage]
  )

  useEffect(() => {
    if (auto) load(1, true)
  }, [load, auto]) // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = useCallback(async () => {
    load(1, true)
  }, [load])
  const onReachEnd = useCallback(() => {
    if (loading || refreshing || finished) return
    load(page + 1, false)
  }, [loading, refreshing, finished, page, load])

  // 首屏骨架
  if (!firstLoaded && refreshing) {
    return (
      <View className={`px-4 ${className}`}>
        {Array.from({length: skeletonCount}).map((_, i) => (
          <View key={i} className="mb-3 h-20 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </View>
    )
  }

  // 错误态（首屏失败）：可见错误 + 重试，绝不落入空态（P1-C Gate4）
  if (firstLoaded && error !== null) {
    return (
      <View className="flex flex-col items-center justify-center py-24 px-8">
        <Text className="i-mdi-cloud-alert-outline text-5xl text-gray-300" />
        <Text className="mt-4 text-sm text-gray-500">{error}</Text>
        <View
          className="mt-6 px-8 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium"
          hoverClass="opacity-80"
          onClick={() => load(1, true)}>
          重新加载
        </View>
      </View>
    )
  }

  // 空态（仅当确实无错误且无数据）
  if (firstLoaded && items.length === 0 && error === null) {
    return (
      <View className="flex flex-col items-center justify-center py-24 px-8">
        <Text className={`${emptyIcon} text-5xl text-gray-300`} />
        <Text className="mt-4 text-sm text-gray-400">{emptyText}</Text>
        {emptyAction && (
          <View
            className="mt-6 px-6 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium"
            onClick={emptyAction.onClick}
            hoverClass="opacity-80">
            {emptyAction.text}
          </View>
        )}
      </View>
    )
  }

  return (
    <ScrollView
      scrollY
      className={`h-full ${className}`}
      refresherEnabled
      refresherTriggered={refreshing}
      onRefresherRefresh={onRefresh}
      onScrollToLower={onReachEnd}
      lowerThreshold={120}>
      {items.map((item, i) => (
        <View key={keyExtractor(item, i)}>{renderItem(item, i)}</View>
      ))}
      {loading && !refreshing && (
        <View className="py-4 flex items-center justify-center">
          <Text className="i-mdi-loading text-xl text-gray-300 animate-spin" />
        </View>
      )}
      {finished && items.length > 0 && (
        <View className="py-4 flex items-center justify-center">
          <Text className="text-xs text-gray-300">— 已经到底啦 —</Text>
        </View>
      )}
    </ScrollView>
  )
}
