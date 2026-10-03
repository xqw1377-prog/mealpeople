import {Button, Image, Input, Picker, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow, useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getTenantById, getTenantSettings, updateTenant, upsertTenantSettings} from '@/db/api'
import type {Tenant} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

// Logo上传相关类型
interface UploadFileInput {
  path: string
  size: number
  name?: string
  originalFileObj?: File
}

export default function TenantSettings() {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // 从URL参数获取租户ID（超级管理员从租户管理页面跳转过来）
  const urlTenantId = router.params.tenantId
  const [targetTenant, setTargetTenant] = useState<Tenant | null>(null)
  const [targetTenantLoaded, setTargetTenantLoaded] = useState(false)

  // 使用目标租户（如果有URL参数）或当前租户
  const activeTenant = urlTenantId ? targetTenant : currentTenant

  // 表单状态
  const [brandName, setBrandName] = useState('')
  const [industry, setIndustry] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [description, setDescription] = useState('')
  const [defaultDailyWorkHours, setDefaultDailyWorkHours] = useState('8')
  const [defaultMonthlyWorkDays, setDefaultMonthlyWorkDays] = useState('26')
  const [defaultPartTimeHourlyRate, setDefaultPartTimeHourlyRate] = useState('20')
  const [costWarningThreshold, setCostWarningThreshold] = useState('35')
  const [efficiencyWarningThreshold, setEfficiencyWarningThreshold] = useState('80')
  const [logoUrl, setLogoUrl] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 行业类型选项
  const industryOptions = ['火锅', '快餐', '咖啡', '茶饮', '烧烤', '西餐', '中餐', '日料', '其他']
  const [industryIndex, setIndustryIndex] = useState(0)

  // 加载目标租户信息（如果有URL参数）
  useEffect(() => {
    const loadTargetTenant = async () => {
      if (urlTenantId) {
        setTargetTenantLoaded(false)
        try {
          console.log('加载目标租户:', urlTenantId)
          const tenant = await getTenantById(urlTenantId)
          console.log('目标租户加载成功:', tenant)
          setTargetTenant(tenant)
          setTargetTenantLoaded(true)
        } catch (error) {
          console.error('加载租户信息失败:', error)
          Taro.showToast({title: '加载租户信息失败', icon: 'none'})
          setTargetTenantLoaded(true)
        }
      } else {
        // 没有URL参数，使用当前租户
        setTargetTenantLoaded(true)
      }
    }
    loadTargetTenant()
  }, [urlTenantId])

  // 加载租户配置
  const loadSettings = useCallback(async () => {
    // 确保租户已加载完成
    if (!targetTenantLoaded) {
      console.log('等待租户加载完成...')
      return
    }

    if (!activeTenant?.id) {
      console.log('没有活动租户')
      return
    }

    console.log('加载租户配置:', activeTenant.id, activeTenant?.name)
    setLoading(true)
    try {
      const settings = await getTenantSettings(activeTenant.id)
      console.log('租户配置加载结果:', settings)
      if (settings) {
        setDefaultDailyWorkHours(settings.default_daily_work_hours?.toString() || '8')
        setDefaultMonthlyWorkDays(settings.default_monthly_work_days?.toString() || '26')
        setDefaultPartTimeHourlyRate(settings.default_part_time_hourly_rate?.toString() || '20')
        setCostWarningThreshold((Number(settings.cost_warning_threshold || 0.35) * 100).toString())
        setEfficiencyWarningThreshold((Number(settings.efficiency_warning_threshold || 0.8) * 100).toString())
        setBrandName(settings.brand_name || '')
        setIndustry(settings.industry || '')
        setContactPerson(settings.contact_person || '')
        setContactPhone(settings.contact_phone || '')
        setContactEmail(settings.contact_email || '')
        setDescription(settings.description || '')
        setLogoUrl(settings.logo_url || '')

        // 设置行业选择器索引
        if (settings.industry) {
          const index = industryOptions.indexOf(settings.industry)
          if (index >= 0) {
            setIndustryIndex(index)
          }
        }
      }
    } finally {
      setLoading(false)
    }
  }, [activeTenant?.id, targetTenantLoaded, activeTenant?.name])

  // Logo上传函数
  const handleUploadLogo = async () => {
    if (!activeTenant?.id) {
      Taro.showToast({title: '缺少租户信息', icon: 'none'})
      return
    }

    try {
      // 选择图片
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      const tempFile = res.tempFiles[0]
      console.log('选择的图片:', tempFile)

      // 检查文件大小（1MB限制）
      if (tempFile.size > 1048576) {
        Taro.showToast({
          title: '图片大小不能超过1MB，请选择较小的图片',
          icon: 'none',
          duration: 3000
        })
        return
      }

      setUploadingLogo(true)

      // 生成唯一文件名
      const fileExt = tempFile.path.split('.').pop() || 'jpg'
      const fileName = `${activeTenant.id}_${Date.now()}.${fileExt}`

      console.log('开始上传Logo:', fileName)

      // 准备文件内容
      const fileContent = (tempFile as any).originalFileObj || {tempFilePath: tempFile.path}

      // 上传到Supabase Storage
      const {data, error} = await supabase.storage.from('app-7daop8q0sxdt_brand_logos').upload(fileName, fileContent, {
        contentType: `image/${fileExt}`,
        upsert: true
      })

      if (error) {
        console.error('上传Logo失败:', error)
        Taro.showToast({
          title: `上传失败: ${error.message}`,
          icon: 'none',
          duration: 3000
        })
        return
      }

      console.log('Logo上传成功:', data)

      // 获取公开URL
      const {data: urlData} = supabase.storage.from('app-7daop8q0sxdt_brand_logos').getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl
      console.log('Logo公开URL:', publicUrl)

      // 更新状态
      setLogoUrl(publicUrl)

      Taro.showToast({
        title: '上传成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('上传Logo异常:', error)
      Taro.showToast({
        title: '上传失败，请重试',
        icon: 'none',
        duration: 2000
      })
    } finally {
      setUploadingLogo(false)
    }
  }

  // 删除Logo
  const handleDeleteLogo = async () => {
    if (!logoUrl) return

    const result = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除品牌Logo吗？'
    })

    if (!result.confirm) return

    try {
      setLogoUrl('')
      Taro.showToast({
        title: 'Logo已删除，请保存配置',
        icon: 'success'
      })
    } catch (error) {
      console.error('删除Logo失败:', error)
      Taro.showToast({
        title: '删除失败',
        icon: 'none'
      })
    }
  }

  // 保存配置
  const handleSave = async () => {
    if (!activeTenant?.id) {
      Taro.showToast({title: '缺少租户信息', icon: 'none'})
      return
    }

    // 验证品牌名称必填
    if (!brandName.trim()) {
      Taro.showToast({title: '请输入品牌名称', icon: 'none', duration: 2000})
      return
    }

    // 验证工作小时数
    const hours = Number(defaultDailyWorkHours)
    if (!hours || hours <= 0 || hours > 24) {
      Taro.showToast({title: '请输入有效的工作小时数（1-24）', icon: 'none'})
      return
    }

    // 验证每月工作天数
    const workDays = Number(defaultMonthlyWorkDays)
    if (!workDays || workDays <= 0 || workDays > 31) {
      Taro.showToast({title: '请输入有效的每月工作天数（1-31）', icon: 'none'})
      return
    }

    // 验证兼职时薪
    const hourlyRate = Number(defaultPartTimeHourlyRate)
    if (!hourlyRate || hourlyRate <= 0) {
      Taro.showToast({title: '请输入有效的兼职时薪', icon: 'none'})
      return
    }

    // 验证成本预警阈值
    const costThreshold = Number(costWarningThreshold)
    if (Number.isNaN(costThreshold) || costThreshold < 0 || costThreshold > 100) {
      Taro.showToast({title: '请输入有效的成本预警阈值（0-100）', icon: 'none'})
      return
    }

    // 验证效能预警阈值
    const efficiencyThreshold = Number(efficiencyWarningThreshold)
    if (Number.isNaN(efficiencyThreshold) || efficiencyThreshold < 0 || efficiencyThreshold > 100) {
      Taro.showToast({title: '请输入有效的效能预警阈值（0-100）', icon: 'none'})
      return
    }

    setSaving(true)
    try {
      console.log('准备保存租户配置:', {
        tenant_id: activeTenant.id,
        default_daily_work_hours: hours,
        default_monthly_work_days: workDays,
        default_part_time_hourly_rate: hourlyRate,
        cost_warning_threshold: costThreshold / 100,
        efficiency_warning_threshold: efficiencyThreshold / 100,
        brand_name: brandName,
        industry: industry
      })

      // 保存租户配置
      const result = await upsertTenantSettings({
        tenant_id: activeTenant.id,
        brand_name: brandName || undefined,
        industry_type: industry || undefined,
        contact_person: contactPerson || undefined,
        contact_phone: contactPhone || undefined,
        contact_email: contactEmail || undefined
      })

      console.log('保存租户配置结果:', result)

      // 同时更新租户表的行业信息
      if (result && industry) {
        console.log('更新租户行业信息:', industry)
        await updateTenant(activeTenant.id, {
          industry: industry
        })
      }

      if (result) {
        Taro.showToast({title: '保存成功', icon: 'success'})
        // 重新加载数据
        loadSettings()
      } else {
        Taro.showToast({title: '保存失败，请查看控制台日志', icon: 'none', duration: 3000})
      }
    } catch (error) {
      console.error('保存租户配置异常:', error)
      Taro.showToast({title: '保存异常，请查看控制台日志', icon: 'none', duration: 3000})
    } finally {
      setSaving(false)
    }
  }

  // 处理行业选择
  const handleIndustryChange = (e: any) => {
    const index = e.detail.value
    setIndustryIndex(index)
    setIndustry(industryOptions[index])
  }

  useDidShow(() => {
    loadSettings()
  })

  return (
    <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-6">
      {/* 页面标题 */}
      <View className="bg-white px-6 py-4 mb-4 shadow-sm">
        <Text className="text-xl font-bold text-foreground">租户配置</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          {activeTenant?.name || '未知租户'} - 设置品牌信息、行业类型和工作参数
        </Text>
      </View>

      {/* 配置表单 */}
      <View className="px-4 space-y-4">
        {/* 品牌信息 */}
        <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
          <View className="flex items-center mb-3">
            <View className="i-mdi-store text-xl text-blue-500 mr-2" />
            <Text className="text-base font-bold text-foreground">品牌信息</Text>
          </View>

          <View className="space-y-3">
            {/* 品牌Logo */}
            <View>
              <Text className="text-sm text-foreground mb-2 block">品牌Logo</Text>
              <View className="flex items-center gap-4">
                {/* Logo预览 */}
                {logoUrl ? (
                  <View className="relative">
                    <Image src={logoUrl} mode="aspectFit" className="w-24 h-24 rounded-lg border-2 border-border" />
                    <View className="absolute top-0 right-0 bg-blue-100 rounded-full p-1" onClick={handleDeleteLogo}>
                      <View className="i-mdi-close text-blue-600 text-sm" />
                    </View>
                  </View>
                ) : (
                  <View className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-gray-50">
                    <View className="i-mdi-image text-3xl text-muted-foreground" />
                  </View>
                )}

                {/* 上传按钮 */}
                <View className="flex-1">
                  <Button
                    onClick={handleUploadLogo}
                    loading={uploadingLogo}
                    size="default"
                    className="bg-blue-100 text-white px-4 py-2 text-sm break-keep">
                    {uploadingLogo ? '上传中...' : logoUrl ? '更换Logo' : '上传Logo'}
                  </Button>
                  <Text className="text-xs text-muted-foreground mt-2 block">
                    支持JPG、PNG、GIF、WEBP格式，大小不超过1MB
                  </Text>
                </View>
              </View>
            </View>

            {/* 品牌名称 */}
            <View>
              <Text className="text-sm text-foreground mb-2 block">
                品牌名称 <Text className="text-red-500">*</Text>
              </Text>
              <Input
                value={brandName}
                onInput={(e) => setBrandName(e.detail.value)}
                placeholder="请输入品牌名称（必填）"
                className="border border-border rounded-lg p-3 bg-gray-50"
              />
            </View>

            {/* 品牌描述 */}
            <View>
              <Text className="text-sm text-foreground mb-2 block">品牌描述</Text>
              <Textarea
                value={description}
                onInput={(e) => setDescription(e.detail.value)}
                placeholder="请输入品牌描述"
                className="border border-border rounded-lg p-3 bg-muted min-h-20"
                maxlength={200}
              />
              <Text className="text-xs text-muted-foreground mt-1">{description.length}/200</Text>
            </View>
          </View>
        </View>

        {/* 行业信息 */}
        <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
          <View className="flex items-center mb-3">
            <View className="i-mdi-domain text-xl text-green-500 mr-2" />
            <Text className="text-base font-bold text-foreground">行业信息</Text>
          </View>

          <View>
            <Text className="text-sm text-foreground mb-2 block">行业类型</Text>
            <Picker mode="selector" range={industryOptions} value={industryIndex} onChange={handleIndustryChange}>
              <View className="border border-border rounded-lg p-3 bg-muted flex items-center justify-between">
                <Text className={industry ? 'text-foreground' : 'text-muted-foreground'}>
                  {industry || '请选择行业类型'}
                </Text>
                <View className="i-mdi-chevron-down text-muted-foreground" />
              </View>
            </Picker>
          </View>
        </View>

        {/* 联系信息 */}
        <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
          <View className="flex items-center mb-3">
            <View className="i-mdi-account-box text-xl text-purple-500 mr-2" />
            <Text className="text-base font-bold text-foreground">联系信息</Text>
          </View>

          <View className="space-y-3">
            {/* 联系人 */}
            <View>
              <Text className="text-sm text-foreground mb-2 block">联系人</Text>
              <Input
                value={contactPerson}
                onInput={(e) => setContactPerson(e.detail.value)}
                placeholder="请输入联系人姓名"
                className="border border-border rounded-lg p-3 bg-gray-50"
              />
            </View>

            {/* 联系电话 */}
            <View>
              <Text className="text-sm text-foreground mb-2 block">联系电话</Text>
              <Input
                type="number"
                value={contactPhone}
                onInput={(e) => setContactPhone(e.detail.value)}
                placeholder="请输入联系电话"
                className="border border-border rounded-lg p-3 bg-gray-50"
              />
            </View>

            {/* 联系邮箱 */}
            <View>
              <Text className="text-sm text-foreground mb-2 block">联系邮箱</Text>
              <Input
                value={contactEmail}
                onInput={(e) => setContactEmail(e.detail.value)}
                placeholder="请输入联系邮箱"
                className="border border-border rounded-lg p-3 bg-gray-50"
              />
            </View>
          </View>
        </View>

        {/* 工作配置 */}
        <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
          <View className="flex items-center mb-3">
            <View className="i-mdi-clock-outline text-xl text-orange-500 mr-2" />
            <Text className="text-base font-bold text-foreground">工作配置</Text>
          </View>

          <View className="space-y-3">
            {/* 默认每日工作小时数 */}
            <View>
              <Text className="text-sm text-foreground mb-2 block">默认每日工作小时数</Text>
              <Input
                type="digit"
                value={defaultDailyWorkHours}
                onInput={(e) => setDefaultDailyWorkHours(e.detail.value)}
                placeholder="请输入每日工作小时数"
                className="border border-border rounded-lg p-3 bg-gray-50"
              />
              <Text className="text-xs text-muted-foreground mt-1">💡 用于计算正式工的工时和人力成本，默认为8小时</Text>
            </View>

            {/* 默认每月工作天数 */}
            <View>
              <Text className="text-sm text-foreground mb-2 block">默认每月工作天数</Text>
              <Input
                type="digit"
                value={defaultMonthlyWorkDays}
                onInput={(e) => setDefaultMonthlyWorkDays(e.detail.value)}
                placeholder="请输入每月工作天数"
                className="border border-border rounded-lg p-3 bg-gray-50"
              />
              <Text className="text-xs text-muted-foreground mt-1">💡 用于计算月度人力成本，默认为26天</Text>
            </View>

            {/* 默认兼职时薪 */}
            <View>
              <Text className="text-sm text-foreground mb-2 block">默认兼职时薪（元/小时）</Text>
              <Input
                type="digit"
                value={defaultPartTimeHourlyRate}
                onInput={(e) => setDefaultPartTimeHourlyRate(e.detail.value)}
                placeholder="请输入兼职时薪"
                className="border border-border rounded-lg p-3 bg-gray-50"
              />
              <Text className="text-xs text-muted-foreground mt-1">💡 用于计算兼职员工的人力成本，默认为20元/小时</Text>
            </View>
          </View>
        </View>

        {/* 预警配置 */}
        <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
          <View className="flex items-center mb-3">
            <View className="i-mdi-alert-circle-outline text-xl text-red-500 mr-2" />
            <Text className="text-base font-bold text-foreground">预警配置</Text>
          </View>

          <View className="space-y-3">
            {/* 成本预警阈值 */}
            <View>
              <Text className="text-sm text-foreground mb-2 block">成本预警阈值（%）</Text>
              <Input
                type="digit"
                value={costWarningThreshold}
                onInput={(e) => setCostWarningThreshold(e.detail.value)}
                placeholder="请输入成本预警阈值"
                className="border border-border rounded-lg p-3 bg-gray-50"
              />
              <Text className="text-xs text-muted-foreground mt-1">
                💡 当人力成本占营收比例超过此值时触发预警，默认为35%
              </Text>
            </View>

            {/* 效能预警阈值 */}
            <View>
              <Text className="text-sm text-foreground mb-2 block">效能预警阈值（%）</Text>
              <Input
                type="digit"
                value={efficiencyWarningThreshold}
                onInput={(e) => setEfficiencyWarningThreshold(e.detail.value)}
                placeholder="请输入效能预警阈值"
                className="border border-border rounded-lg p-3 bg-gray-50"
              />
              <Text className="text-xs text-muted-foreground mt-1">
                💡 当人效低于此值时触发预警，默认为80%（即每人每小时营收低于标准的80%）
              </Text>
            </View>
          </View>
        </View>

        {/* 说明 */}
        <View className="bg-blue-100 rounded-lg p-4">
          <Text className="text-sm font-semibold text-foreground mb-2 block">📋 配置说明</Text>
          <View className="space-y-1">
            <Text className="text-xs text-foreground block">
              • 品牌信息：用于展示和识别您的企业，Logo将显示在系统各处
            </Text>
            <Text className="text-xs text-foreground block">• 行业信息：影响系统的默认配置和建议</Text>
            <Text className="text-xs text-foreground block">• 联系信息：用于系统通知和客服支持</Text>
            <Text className="text-xs text-foreground block">• 工作配置：影响排班规划中的人数计算和成本核算</Text>
            <Text className="text-xs text-foreground block">• 预警配置：帮助您及时发现成本和效能异常</Text>
          </View>
        </View>

        {/* 高级配置入口 */}
        <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
          <Text className="text-base font-bold text-foreground mb-3 block">⚙️ 高级配置</Text>
          <View className="space-y-2">
            {/* 营业餐段配置 */}
            <View
              onClick={() => Taro.navigateTo({url: '/packageD/pages/meal-periods/index'})}
              className="flex items-center justify-between p-3 bg-blue-100 rounded-xl active:bg-blue-100">
              <View className="flex items-center gap-3">
                <View className="i-mdi-calendar-clock text-2xl text-blue-500" />
                <View>
                  <Text className="text-sm font-semibold text-foreground block">营业餐段配置</Text>
                  <Text className="text-xs text-muted-foreground">配置午餐、晚餐等营业时段</Text>
                </View>
              </View>
              <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
            </View>

            {/* 工作班次配置 */}
            <View
              onClick={() => Taro.navigateTo({url: '/packageB/pages/work-shifts/index'})}
              className="flex items-center justify-between p-3 bg-blue-100 rounded-xl active:bg-green-100">
              <View className="flex items-center gap-3">
                <View className="i-mdi-clock-time-eight text-2xl text-green-500" />
                <View>
                  <Text className="text-sm font-semibold text-foreground block">工作班次配置</Text>
                  <Text className="text-xs text-muted-foreground">配置早班、中班、晚班等班次</Text>
                </View>
              </View>
              <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
            </View>
          </View>
        </View>

        {/* 保存按钮 */}
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={loading}
          className="w-full bg-blue-100 text-white rounded-xl py-3 font-semibold text-base">
          {saving ? '保存中...' : '保存配置'}
        </Button>
      </View>
    </View>
  )
}
