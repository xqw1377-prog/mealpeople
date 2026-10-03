/**
 * 部门管理页面
 * 组织架构和部门设置
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {EmptyState, LoadingCards, PageHeader} from '@/components/common'
import {deleteDepartment, getDepartmentStats, getDepartmentTree, toggleDepartmentStatus} from '@/db/api-department'
import type {DepartmentStats, DepartmentTreeNode} from '@/db/types-department'
import {useTenantStore} from '@/store/tenant'

// 部门树节点组件
interface DepartmentNodeProps {
  node: DepartmentTreeNode
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string) => void
}

const DepartmentNode: React.FC<DepartmentNodeProps> = ({node, onEdit, onDelete, onToggleStatus}) => {
  const [expanded, setExpanded] = useState(true)

  return (
    <View className="mb-2">
      {/* 部门节点 */}
      <View className="bg-white rounded-lg p-3 border border-border" style={{marginLeft: `${node.level * 16}px`}}>
        <View className="flex items-center justify-between">
          <View className="flex items-center gap-2 flex-1">
            {/* 展开/收起按钮 */}
            {node.children.length > 0 && (
              <View
                className={`${expanded ? 'i-mdi-chevron-down' : 'i-mdi-chevron-right'} text-lg text-muted-foreground`}
                onClick={() => setExpanded(!expanded)}
              />
            )}

            {/* 部门图标 */}
            <View className="i-mdi-sitemap text-lg text-primary" />

            {/* 部门信息 */}
            <View className="flex-1">
              <View className="flex items-center gap-2">
                <Text className="text-sm font-medium text-foreground">{node.name}</Text>
                {node.code && <Text className="text-xs text-muted-foreground">({node.code})</Text>}
              </View>
              <View className="flex items-center gap-3 mt-1">
                {node.manager_name && (
                  <Text className="text-xs text-muted-foreground">
                    <Text className="i-mdi-account text-xs" /> {node.manager_name}
                  </Text>
                )}
                <Text className="text-xs text-muted-foreground">
                  <Text className="i-mdi-account-group text-xs" /> {node.employee_count}人
                </Text>
              </View>
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="flex items-center gap-2">
            <Button
              size="mini"
              className="text-xs px-2 py-1 bg-primary/10 text-primary border-0"
              onClick={() => onEdit(node.id)}>
              编辑
            </Button>
            <Button
              size="mini"
              className="text-xs px-2 py-1 bg-red-500/10 text-red-600 border-0"
              onClick={() => onDelete(node.id)}>
              删除
            </Button>
          </View>
        </View>
      </View>

      {/* 子部门 */}
      {expanded &&
        node.children.length > 0 &&
        node.children.map((child) => (
          <DepartmentNode
            key={child.id}
            node={child}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
          />
        ))}
    </View>
  )
}

export default function DepartmentManagement() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [loading, setLoading] = useState(true)
  const [departmentTree, setDepartmentTree] = useState<DepartmentTreeNode[]>([])
  const [stats, setStats] = useState<DepartmentStats | null>(null)

  // 加载部门数据
  const loadData = useCallback(async () => {
    if (!currentTenant?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [tree, statsData] = await Promise.all([
        getDepartmentTree(currentTenant.id),
        getDepartmentStats(currentTenant.id)
      ])

      setDepartmentTree(tree)
      setStats(statsData)
    } catch (error) {
      console.error('[部门管理] 加载数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id])

  useDidShow(() => {
    loadData()
  })

  // 新增部门
  const handleAdd = () => {
    Taro.navigateTo({
      url: '/packageD/pages/department-form/index'
    })
  }

  // 编辑部门
  const handleEdit = (id: string) => {
    Taro.navigateTo({
      url: `/packageD/pages/department-form/index?id=${id}`
    })
  }

  // 删除部门
  const handleDelete = async (id: string) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个部门吗？'
    })

    if (!res.confirm) return

    try {
      await deleteDepartment(id)
      Taro.showToast({
        title: '删除成功',
        icon: 'success'
      })
      loadData()
    } catch (error: unknown) {
      console.error('[部门管理] 删除失败:', error)
      Taro.showToast({
        title: error instanceof Error ? error.message : '删除失败',
        icon: 'none'
      })
    }
  }

  // 切换状态
  const handleToggleStatus = async (id: string) => {
    try {
      await toggleDepartmentStatus(id, 'inactive')
      Taro.showToast({
        title: '操作成功',
        icon: 'success'
      })
      loadData()
    } catch (error) {
      console.error('[部门管理] 操作失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  }

  if (!user) return null

  return (
    <View className="min-h-screen" style={{background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)'}}>
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          <PageHeader icon="i-mdi-sitemap" title="部门管理" description="组织架构和部门设置" />

          {loading ? (
            <LoadingCards count={3} />
          ) : (
            <>
              {/* 统计卡片 */}
              {stats && (
                <View className="grid grid-cols-3 gap-3 mb-4">
                  <View className="bg-white rounded-lg p-3 border border-border">
                    <Text className="text-xs text-muted-foreground block mb-1">总部门数</Text>
                    <Text className="text-xl font-bold text-primary">{stats.total_departments}</Text>
                  </View>
                  <View className="bg-white rounded-lg p-3 border border-border">
                    <Text className="text-xs text-muted-foreground block mb-1">启用中</Text>
                    <Text className="text-xl font-bold text-green-600">{stats.active_departments}</Text>
                  </View>
                  <View className="bg-white rounded-lg p-3 border border-border">
                    <Text className="text-xs text-muted-foreground block mb-1">总员工</Text>
                    <Text className="text-xl font-bold text-blue-600">{stats.total_employees}</Text>
                  </View>
                </View>
              )}

              {/* 新增按钮 */}
              <View className="mb-4">
                <Button
                  className="w-full bg-primary text-white py-3 rounded-lg break-keep text-base border-0"
                  size="default"
                  onClick={handleAdd}>
                  <View className="i-mdi-plus text-lg" /> 新增部门
                </Button>
              </View>

              {/* 部门树 */}
              {departmentTree.length > 0 ? (
                <View>
                  {departmentTree.map((node) => (
                    <DepartmentNode
                      key={node.id}
                      node={node}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState
                  icon="i-mdi-sitemap"
                  title="暂无部门"
                  description="点击上方按钮创建第一个部门"
                  action={{
                    label: '新增部门',
                    onClick: handleAdd
                  }}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
