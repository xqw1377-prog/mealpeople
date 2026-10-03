import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {EmptyState} from '@/components/EmptyState'
import {SkeletonList} from '@/components/Skeleton'
import {
  createTenant,
  deleteTenant,
  getPendingTenantApplications,
  getTenantSettings,
  getTenants,
  updateTenant,
  upsertTenantSettings
} from '@/db/api'
import type {Tenant} from '@/db/types'

export default function TenantManagement() {
  const {user} = useAuth({guard: true})
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0)

  // 表单状态 - 基本信息
  const [showForm, setShowForm] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [name, setName] = useState('')
  const [adminPhone, setAdminPhone] = useState('') // 添加管理员电话
  const [industry, setIndustry] = useState('')
  const [packageType, setPackageType] = useState('基础版')
  const [saving, setSaving] = useState(false)

  // 表单状态 - 配置信息
  const [brandName, setBrandName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [description, setDescription] = useState('')
  const [defaultDailyWorkHours, setDefaultDailyWorkHours] = useState('8')

  // 行业类型选项
  const industryOptions = ['火锅', '快餐', '咖啡', '茶饮', '烧烤', '西餐', '中餐', '日料', '其他']
  const [industryIndex, setIndustryIndex] = useState(0)

  // 套餐类型选项
  const packageOptions = ['基础版', '标准版', '企业版']
  const [packageIndex, setPackageIndex] = useState(0)

  // 加载租户列表
  const loadTenants = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTenants()
      setTenants(data)
    } catch (error) {
      console.error('加载租户列表失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // 加载待审核申请数量
  const loadPendingApplications = useCallback(async () => {
    try {
      const data = await getPendingTenantApplications()
      setPendingApplicationsCount(data.length)
    } catch (error) {
      console.error('加载待审核申请失败:', error)
    }
  }, [])

  // 跳转到租户申请管理页面
  const handleGoToApplications = () => {
    Taro.navigateTo({url: '/packageD/pages/tenant-applications/index'})
  }

  // 打开创建表单
  const handleCreate = () => {
    setEditingTenant(null)
    setName('')
    setAdminPhone('') // 重置管理员电话
    setIndustry('')
    setIndustryIndex(0)
    setPackageType('基础版')
    setPackageIndex(0)
    // 重置配置字段
    setBrandName('')
    setContactPerson('')
    setContactPhone('')
    setContactEmail('')
    setDescription('')
    setDefaultDailyWorkHours('8')
    setShowForm(true)
  }

  // 打开编辑表单
  const handleEdit = async (tenant: Tenant) => {
    setEditingTenant(tenant)
    setName(tenant.name)
    setAdminPhone(tenant.admin_phone || '') // 设置管理员电话
    setIndustry(tenant.industry || '')
    setPackageType(tenant.package_type)

    // 设置行业选择器索引
    if (tenant.industry) {
      const index = industryOptions.indexOf(tenant.industry)
      if (index >= 0) {
        setIndustryIndex(index)
      }
    }

    // 设置套餐选择器索引
    const pkgIndex = packageOptions.indexOf(tenant.package_type)
    if (pkgIndex >= 0) {
      setPackageIndex(pkgIndex)
    }

    // 加载租户配置
    try {
      const settings = await getTenantSettings(tenant.id)
      if (settings) {
        setBrandName(settings.brand_name || '')
        setContactPerson(settings.contact_person || '')
        setContactPhone(settings.contact_phone || '')
        setContactEmail(settings.contact_email || '')
        setDescription(settings.description || '')
        setDefaultDailyWorkHours(String(settings.default_daily_work_hours || 8))
      } else {
        // 没有配置，使用默认值
        setBrandName('')
        setContactPerson('')
        setContactPhone('')
        setContactEmail('')
        setDescription('')
        setDefaultDailyWorkHours('8')
      }
    } catch (error) {
      console.error('加载租户配置失败:', error)
      // 使用默认值
      setBrandName('')
      setContactPerson('')
      setContactPhone('')
      setContactEmail('')
      setDescription('')
      setDefaultDailyWorkHours('8')
    }

    setShowForm(true)
  }

  // 保存租户
  const handleSave = async () => {
    if (!name.trim()) {
      Taro.showToast({title: '请输入租户名称', icon: 'none'})
      return
    }

    // 验证管理员电话（创建时必填）
    if (!editingTenant && !adminPhone.trim()) {
      Taro.showToast({title: '请输入管理员电话', icon: 'none'})
      return
    }

    // 验证电话号码格式
    if (adminPhone.trim() && !/^1[3-9]\d{9}$/.test(adminPhone.trim())) {
      Taro.showToast({title: '请输入正确的手机号码', icon: 'none'})
      return
    }

    // 验证工作小时数
    const hours = Number(defaultDailyWorkHours)
    if (!hours || hours <= 0 || hours > 24) {
      Taro.showToast({title: '请输入有效的工作小时数（1-24）', icon: 'none'})
      return
    }

    setSaving(true)
    try {
      if (editingTenant) {
        // 更新租户
        const result = await updateTenant(editingTenant.id, {
          name: name.trim(),
          admin_phone: adminPhone.trim() || null, // 更新管理员电话
          industry: industry || null,
          package_type: packageType
        })
        if (result) {
          // 同时更新租户配置
          await upsertTenantSettings({
            tenant_id: editingTenant.id,
            daily_work_hours: hours,
            brand_name: brandName || null,
            industry_type: industry || null,
            contact_person: contactPerson || null,
            contact_phone: contactPhone || null,
            contact_email: contactEmail || null
          })
          Taro.showToast({title: '更新成功', icon: 'success'})
          setShowForm(false)
          loadTenants()
        } else {
          Taro.showToast({title: '更新失败', icon: 'none'})
        }
      } else {
        // 创建租户
        const result = await createTenant({
          name: name.trim(),
          admin_phone: adminPhone.trim(), // 保存管理员电话
          industry: industry || null,
          package_type: packageType,
          status: 'active',
          store_count: 0,
          employee_count: 0
        })
        if (result) {
          // 同时创建租户配置
          await upsertTenantSettings({
            tenant_id: result.id,
            daily_work_hours: hours,
            brand_name: brandName || null,
            industry_type: industry || null,
            contact_person: contactPerson || null,
            contact_phone: contactPhone || null,
            contact_email: contactEmail || null
          })
          Taro.showToast({title: '创建成功', icon: 'success'})
          setShowForm(false)
          loadTenants()
        } else {
          Taro.showToast({title: '创建失败', icon: 'none'})
        }
      }
    } finally {
      setSaving(false)
    }
  }

  // 删除租户
  const handleDelete = async (tenant: Tenant) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除租户"${tenant.name}"吗？此操作不可恢复！`,
      confirmText: '删除',
      cancelText: '取消'
    })

    if (!res.confirm) return

    try {
      const result = await deleteTenant(tenant.id)
      if (result) {
        Taro.showToast({title: '删除成功', icon: 'success'})
        loadTenants()
      } else {
        Taro.showToast({title: '删除失败', icon: 'none'})
      }
    } catch (error) {
      console.error('删除租户失败:', error)
      Taro.showToast({title: '删除失败', icon: 'none'})
    }
  }

  // 处理行业选择
  const handleIndustryChange = (e: any) => {
    const index = e.detail.value
    setIndustryIndex(index)
    setIndustry(industryOptions[index])
  }

  // 处理套餐选择
  const handlePackageChange = (e: any) => {
    const index = e.detail.value
    setPackageIndex(index)
    setPackageType(packageOptions[index])
  }

  useDidShow(() => {
    loadTenants()
    loadPendingApplications()
  })

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([loadTenants(), loadPendingApplications()])
  }, [loadTenants, loadPendingApplications])

  if (showForm) {
    return (
      <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-6">
        {/* 表单标题 */}
        <View className="bg-white px-6 py-4 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-foreground">{editingTenant ? '编辑租户' : '创建租户'}</Text>
          <Text className="text-sm text-muted-foreground mt-1">填写租户基本信息</Text>
        </View>

        {/* 表单内容 */}
        <View className="px-4 space-y-4">
          {/* 租户名称 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-3">
              <View className="i-mdi-store text-xl text-blue-500 mr-2" />
              <Text className="text-base font-bold text-foreground">租户名称</Text>
              <Text className="text-red-500 ml-1">*</Text>
            </View>
            <Input
              className="w-full px-4 py-3 bg-muted rounded-xl text-base"
              placeholder="请输入租户名称"
              value={name}
              onInput={(e) => setName(e.detail.value)}
            />
          </View>

          {/* 管理员电话 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-3">
              <View className="i-mdi-phone text-xl text-blue-500 mr-2" />
              <Text className="text-base font-bold text-foreground">管理员电话</Text>
              {!editingTenant && <Text className="text-red-500 ml-1">*</Text>}
            </View>
            <Input
              className="w-full px-4 py-3 bg-muted rounded-xl text-base"
              placeholder="请输入管理员手机号码"
              type="number"
              maxlength={11}
              value={adminPhone}
              onInput={(e) => setAdminPhone(e.detail.value)}
            />
            <Text className="text-xs text-muted-foreground mt-2">该手机号码将用于租户管理员登录系统</Text>
          </View>

          {/* 行业类型 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-3">
              <View className="i-mdi-domain text-xl text-blue-500 mr-2" />
              <Text className="text-base font-bold text-foreground">行业类型</Text>
            </View>
            <Picker mode="selector" range={industryOptions} value={industryIndex} onChange={handleIndustryChange}>
              <View className="w-full px-4 py-3 bg-muted rounded-xl text-base flex items-center justify-between">
                <Text className={industry ? 'text-foreground' : 'text-muted-foreground'}>
                  {industry || '请选择行业类型'}
                </Text>
                <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
              </View>
            </Picker>
          </View>

          {/* 套餐类型 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-3">
              <View className="i-mdi-package-variant text-xl text-blue-500 mr-2" />
              <Text className="text-base font-bold text-foreground">套餐类型</Text>
            </View>
            <Picker mode="selector" range={packageOptions} value={packageIndex} onChange={handlePackageChange}>
              <View className="w-full px-4 py-3 bg-muted rounded-xl text-base flex items-center justify-between">
                <Text className="text-foreground">{packageType}</Text>
                <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
              </View>
            </Picker>
          </View>

          {/* 分隔线 */}
          <View className="flex items-center my-4">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="px-4 text-sm text-muted-foreground">配置信息（可选）</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* 品牌名称 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-3">
              <View className="i-mdi-tag text-xl text-blue-500 mr-2" />
              <Text className="text-base font-bold text-foreground">品牌名称</Text>
            </View>
            <Input
              className="w-full px-4 py-3 bg-muted rounded-xl text-base"
              placeholder="请输入品牌名称"
              value={brandName}
              onInput={(e) => setBrandName(e.detail.value)}
            />
          </View>

          {/* 默认每日工作小时数 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-3">
              <View className="i-mdi-clock-outline text-xl text-blue-500 mr-2" />
              <Text className="text-base font-bold text-foreground">默认每日工作小时数</Text>
              <Text className="text-red-500 ml-1">*</Text>
            </View>
            <Input
              className="w-full px-4 py-3 bg-muted rounded-xl text-base"
              type="digit"
              placeholder="请输入工作小时数（1-24）"
              value={defaultDailyWorkHours}
              onInput={(e) => setDefaultDailyWorkHours(e.detail.value)}
            />
            <Text className="text-xs text-muted-foreground mt-2">用于计算正式员工的工时成本</Text>
          </View>

          {/* 联系人 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-3">
              <View className="i-mdi-account text-xl text-blue-500 mr-2" />
              <Text className="text-base font-bold text-foreground">联系人</Text>
            </View>
            <Input
              className="w-full px-4 py-3 bg-muted rounded-xl text-base"
              placeholder="请输入联系人姓名"
              value={contactPerson}
              onInput={(e) => setContactPerson(e.detail.value)}
            />
          </View>

          {/* 联系电话 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-3">
              <View className="i-mdi-phone text-xl text-blue-500 mr-2" />
              <Text className="text-base font-bold text-foreground">联系电话</Text>
            </View>
            <Input
              className="w-full px-4 py-3 bg-muted rounded-xl text-base"
              type="number"
              placeholder="请输入联系电话"
              value={contactPhone}
              onInput={(e) => setContactPhone(e.detail.value)}
            />
          </View>

          {/* 联系邮箱 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-3">
              <View className="i-mdi-email text-xl text-blue-500 mr-2" />
              <Text className="text-base font-bold text-foreground">联系邮箱</Text>
            </View>
            <Input
              className="w-full px-4 py-3 bg-muted rounded-xl text-base"
              placeholder="请输入联系邮箱"
              value={contactEmail}
              onInput={(e) => setContactEmail(e.detail.value)}
            />
          </View>

          {/* 描述 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-3">
              <View className="i-mdi-text text-xl text-blue-500 mr-2" />
              <Text className="text-base font-bold text-foreground">描述</Text>
            </View>
            <Textarea
              className="w-full px-4 py-3 bg-muted rounded-xl text-base"
              placeholder="请输入租户描述信息"
              value={description}
              onInput={(e) => setDescription(e.detail.value)}
              maxlength={500}
              showConfirmBar={false}
              style={{minHeight: '100px'}}
            />
          </View>

          {/* 操作按钮 */}
          <View className="flex gap-3 mt-6">
            <Button
              className="flex-1 bg-muted text-foreground rounded-xl h-12 leading-12 text-base"
              onClick={() => setShowForm(false)}>
              取消
            </Button>
            <Button
              className="flex-1 bg-blue-100 text-white rounded-xl h-12 leading-12 text-base"
              onClick={handleSave}
              loading={saving}
              disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 页面标题 */}
      <View className="bg-white px-6 py-4 mb-4 shadow-sm">
        <View className="flex items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-foreground">租户管理</Text>
            <Text className="text-sm text-muted-foreground mt-1">管理所有租户信息</Text>
          </View>
          <Button className="bg-blue-100 text-white rounded-xl px-4 py-2 text-sm" size="mini" onClick={handleCreate}>
            <View className="flex items-center">
              <View className="i-mdi-plus text-base mr-1" />
              <Text>创建租户</Text>
            </View>
          </Button>
        </View>
      </View>

      {/* 租户申请管理入口 */}
      {pendingApplicationsCount > 0 && (
        <View className="px-4 mb-4">
          <Button
            className="w-full bg-blue-100 text-white rounded-xl py-3 text-sm"
            size="default"
            onClick={handleGoToApplications}>
            <View className="flex items-center justify-center">
              <View className="i-mdi-bell-ring text-xl mr-2" />
              <Text className="font-semibold">有 {pendingApplicationsCount} 条租户申请待审核</Text>
              <View className="i-mdi-chevron-right text-xl ml-2" />
            </View>
          </Button>
        </View>
      )}

      {/* 快速入口（无待审核时显示） */}
      {pendingApplicationsCount === 0 && (
        <View className="px-4 mb-4">
          <Button
            className="w-full bg-blue-100 text-white rounded-xl py-3 text-sm border border-border"
            size="default"
            onClick={handleGoToApplications}>
            <View className="flex items-center justify-center">
              <View className="i-mdi-file-document-multiple text-base mr-2" />
              <Text>查看租户申请记录</Text>
              <View className="i-mdi-chevron-right text-base ml-2" />
            </View>
          </Button>
        </View>
      )}

      {/* 租户列表 */}
      <ScrollView
        scrollY
        className="h-screen px-4 pb-32"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}>
        {loading ? (
          <SkeletonList count={5} />
        ) : tenants.length === 0 ? (
          <EmptyState
            icon="i-mdi-store-off"
            title="暂无租户"
            description="点击右上角创建租户"
            actionText="创建租户"
            onAction={handleCreate}
          />
        ) : (
          <View className="space-y-3">
            {tenants.map((tenant) => (
              <View key={tenant.id} className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                {/* 租户信息 */}
                <View className="flex items-start justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex items-center mb-2">
                      <View className="i-mdi-store text-xl text-blue-500 mr-2" />
                      <Text className="text-lg font-bold text-foreground">{tenant.name}</Text>
                    </View>
                    <View className="space-y-1">
                      {tenant.industry && (
                        <View className="flex items-center">
                          <View className="i-mdi-domain text-sm text-muted-foreground mr-1" />
                          <Text className="text-sm text-muted-foreground">{tenant.industry}</Text>
                        </View>
                      )}
                      <View className="flex items-center">
                        <View className="i-mdi-package-variant text-sm text-muted-foreground mr-1" />
                        <Text className="text-sm text-muted-foreground">{tenant.package_type}</Text>
                      </View>
                      <View className="flex items-center">
                        <View className="i-mdi-store-marker text-sm text-muted-foreground mr-1" />
                        <Text className="text-sm text-muted-foreground">{tenant.store_count} 个店铺</Text>
                      </View>
                      <View className="flex items-center">
                        <View className="i-mdi-account-group text-sm text-muted-foreground mr-1" />
                        <Text className="text-sm text-muted-foreground">{tenant.employee_count} 名员工</Text>
                      </View>
                    </View>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full ${tenant.status === 'active' ? 'bg-green-100' : 'bg-gray-50'}`}>
                    <Text
                      className={`text-xs ${tenant.status === 'active' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                      {tenant.status === 'active' ? '正常' : '停用'}
                    </Text>
                  </View>
                </View>

                {/* 操作按钮 */}
                <View className="flex gap-2 pt-3 border-t border-border">
                  <Button
                    className="flex-1 bg-blue-100 text-white rounded-xl h-10 leading-10 text-sm"
                    size="mini"
                    onClick={() => handleEdit(tenant)}>
                    <View className="flex items-center justify-center">
                      <View className="i-mdi-pencil text-base mr-1" />
                      <Text>编辑</Text>
                    </View>
                  </Button>
                  <Button
                    className="flex-1 bg-blue-100 text-red-600 rounded-xl h-10 leading-10 text-sm"
                    size="mini"
                    onClick={() => handleDelete(tenant)}>
                    <View className="flex items-center justify-center">
                      <View className="i-mdi-delete text-base mr-1" />
                      <Text>删除</Text>
                    </View>
                  </Button>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
