/**
 * 调试辅助工具
 * 用于诊断数据保存和显示问题
 */

import Taro from '@tarojs/taro'
import {supabase} from '@/client/supabase'

/**
 * 检查用户认证状态
 */
export async function checkAuthStatus() {
  console.log('========== 检查认证状态 ==========')
  const {
    data: {user},
    error
  } = await supabase.auth.getUser()

  if (error) {
    console.error('❌ 获取用户信息失败:', error)
    return false
  }

  if (!user) {
    console.error('❌ 用户未登录')
    return false
  }

  console.log('✅ 用户已登录')
  console.log('用户ID:', user.id)
  console.log('用户邮箱:', user.email)
  console.log('用户手机:', user.phone)
  console.log('====================================')
  return true
}

/**
 * 检查租户信息
 */
export async function checkTenantInfo(tenantId: string) {
  console.log('========== 检查租户信息 ==========')
  console.log('租户ID:', tenantId)

  const {data, error} = await supabase.from('tenants').select('*').eq('id', tenantId).maybeSingle()

  if (error) {
    console.error('❌ 查询租户失败:', error)
    return false
  }

  if (!data) {
    console.error('❌ 租户不存在')
    return false
  }

  console.log('✅ 租户信息:')
  console.log('租户名称:', data.name)
  console.log('租户状态:', data.status)
  console.log('====================================')
  return true
}

/**
 * 测试餐段保存和查询
 */
export async function testMealPeriodSaveAndQuery(tenantId: string) {
  console.log('========== 测试餐段保存和查询 ==========')

  // 1. 创建测试餐段
  const testPeriod = {
    tenant_id: tenantId,
    period_name: `测试餐段_${Date.now()}`,
    period_order: 999,
    start_time: '10:00',
    end_time: '12:00',
    is_active: true
  }

  console.log('1️⃣ 尝试创建测试餐段:', testPeriod)

  const {data: created, error: createError} = await supabase
    .from('meal_periods')
    .insert(testPeriod)
    .select()
    .maybeSingle()

  if (createError) {
    console.error('❌ 创建失败:', createError)
    console.error('错误代码:', createError.code)
    console.error('错误信息:', createError.message)
    console.error('错误详情:', createError.details)
    return false
  }

  if (!created) {
    console.error('❌ 创建失败：返回null但没有错误')
    console.error('这通常意味着RLS策略阻止了数据返回')
    return false
  }

  console.log('✅ 创建成功:', created)

  // 2. 查询刚创建的餐段
  console.log('2️⃣ 尝试查询刚创建的餐段')

  const {data: queried, error: queryError} = await supabase
    .from('meal_periods')
    .select('*')
    .eq('id', created.id)
    .maybeSingle()

  if (queryError) {
    console.error('❌ 查询失败:', queryError)
    return false
  }

  if (!queried) {
    console.error('❌ 查询失败：找不到刚创建的数据')
    console.error('这意味着RLS策略阻止了数据查询')
    return false
  }

  console.log('✅ 查询成功:', queried)

  // 3. 删除测试数据
  console.log('3️⃣ 清理测试数据')
  await supabase.from('meal_periods').delete().eq('id', created.id)

  console.log('✅ 测试完成')
  console.log('====================================')
  return true
}

/**
 * 测试班次保存和查询
 */
export async function testWorkShiftSaveAndQuery(tenantId: string) {
  console.log('========== 测试班次保存和查询 ==========')

  // 1. 创建测试班次
  const testShift = {
    tenant_id: tenantId,
    shift_name: `测试班次_${Date.now()}`,
    shift_code: `TEST_${Date.now()}`,
    work_hours: 8,
    is_active: true
  }

  console.log('1️⃣ 尝试创建测试班次:', testShift)

  const {data: created, error: createError} = await supabase
    .from('work_shifts')
    .insert(testShift)
    .select()
    .maybeSingle()

  if (createError) {
    console.error('❌ 创建失败:', createError)
    console.error('错误代码:', createError.code)
    console.error('错误信息:', createError.message)
    console.error('错误详情:', createError.details)
    return false
  }

  if (!created) {
    console.error('❌ 创建失败：返回null但没有错误')
    console.error('这通常意味着RLS策略阻止了数据返回')
    return false
  }

  console.log('✅ 创建成功:', created)

  // 2. 查询刚创建的班次
  console.log('2️⃣ 尝试查询刚创建的班次')

  const {data: queried, error: queryError} = await supabase
    .from('work_shifts')
    .select('*')
    .eq('id', created.id)
    .maybeSingle()

  if (queryError) {
    console.error('❌ 查询失败:', queryError)
    return false
  }

  if (!queried) {
    console.error('❌ 查询失败：找不到刚创建的数据')
    console.error('这意味着RLS策略阻止了数据查询')
    return false
  }

  console.log('✅ 查询成功:', queried)

  // 3. 删除测试数据
  console.log('3️⃣ 清理测试数据')
  await supabase.from('work_shifts').delete().eq('id', created.id)

  console.log('✅ 测试完成')
  console.log('====================================')
  return true
}

/**
 * 运行完整诊断
 */
export async function runFullDiagnostics(tenantId: string) {
  console.log('🔍 开始运行完整诊断...')
  console.log('====================================')

  const results = {
    auth: false,
    tenant: false,
    mealPeriod: false,
    workShift: false
  }

  // 1. 检查认证
  results.auth = await checkAuthStatus()
  if (!results.auth) {
    Taro.showToast({
      title: '用户未登录',
      icon: 'none'
    })
    return results
  }

  // 2. 检查租户
  results.tenant = await checkTenantInfo(tenantId)
  if (!results.tenant) {
    Taro.showToast({
      title: '租户信息异常',
      icon: 'none'
    })
    return results
  }

  // 3. 测试餐段
  results.mealPeriod = await testMealPeriodSaveAndQuery(tenantId)

  // 4. 测试班次
  results.workShift = await testWorkShiftSaveAndQuery(tenantId)

  // 显示结果
  console.log('====================================')
  console.log('🎯 诊断结果汇总:')
  console.log('认证状态:', results.auth ? '✅ 正常' : '❌ 异常')
  console.log('租户信息:', results.tenant ? '✅ 正常' : '❌ 异常')
  console.log('餐段功能:', results.mealPeriod ? '✅ 正常' : '❌ 异常')
  console.log('班次功能:', results.workShift ? '✅ 正常' : '❌ 异常')
  console.log('====================================')

  if (results.auth && results.tenant && results.mealPeriod && results.workShift) {
    Taro.showToast({
      title: '所有功能正常',
      icon: 'success'
    })
  } else {
    Taro.showToast({
      title: '发现异常，请查看控制台',
      icon: 'none'
    })
  }

  return results
}
