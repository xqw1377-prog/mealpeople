/**
 * 版本管理工具
 * 用于管理应用版本、功能开关和版本比较
 */

export const APP_VERSION = process.env.TARO_APP_VERSION || '1.0.0'
export const ENABLE_V2_FEATURES = process.env.TARO_APP_ENABLE_V2_FEATURES === 'true'
export const ENABLE_AUDIT_LOG = process.env.TARO_APP_ENABLE_AUDIT_LOG === 'true'

/**
 * 版本比较
 * @param v1 版本1
 * @param v2 版本2
 * @returns 1: v1 > v2, 0: v1 = v2, -1: v1 < v2
 */
export function compareVersion(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0

    if (part1 > part2) return 1
    if (part1 < part2) return -1
  }

  return 0
}

/**
 * 检查是否为2.0版本
 */
export function isV2(): boolean {
  return compareVersion(APP_VERSION, '2.0.0') >= 0
}

/**
 * 检查功能是否可用
 * @param feature 功能名称
 */
export function isFeatureEnabled(feature: string): boolean {
  // V2功能检查
  if (feature.startsWith('v2_')) {
    return isV2() && ENABLE_V2_FEATURES
  }

  // V1功能始终可用
  return true
}

/**
 * 获取版本信息
 */
export function getVersionInfo() {
  return {
    version: APP_VERSION,
    isV2: isV2(),
    enableV2Features: ENABLE_V2_FEATURES,
    enableAuditLog: ENABLE_AUDIT_LOG
  }
}

/**
 * 获取版本显示文本
 */
export function getVersionDisplay(): string {
  const info = getVersionInfo()
  if (info.version.includes('-dev')) {
    return `${info.version} (开发版)`
  }
  if (info.version.includes('-beta')) {
    return `${info.version} (测试版)`
  }
  return `v${info.version}`
}
