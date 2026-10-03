/**
 * 合同签名查看工具（G0-E 配套）
 *
 * 背景：contract_signatures bucket 已私有化（迁移 00115），
 * 库中历史存量的 getPublicUrl 直链对匿名失效。显示端统一通过
 * 本工具把存量 URL 换成 1 小时有效的签名 URL。
 *
 * 设计理念：容易学、容易做、容易管
 */

import {useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'

const BUCKET = 'contract_signatures'
const VIEW_TTL_SECONDS = 3600

/** 从历史公开 URL 中提取 bucket 内的对象路径；非本 bucket 的 URL 原样返回 null 标记 */
export function extractSignaturePath(url?: string | null): string | null {
  if (!url) return null
  const marker = `/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.substring(idx + marker.length).split('?')[0]
}

/** 把存量签名 URL 解析为当前可显示的签名 URL；解析失败时回退原值 */
export async function getSignatureViewUrl(url?: string | null): Promise<string | null> {
  if (!url) return null
  const path = extractSignaturePath(url)
  if (!path) return url
  const {data, error} = await supabase.storage.from(BUCKET).createSignedUrl(path, VIEW_TTL_SECONDS)
  if (error || !data?.signedUrl) return url
  return data.signedUrl
}

/** React 显示端钩子：传入存量签名 URL，返回当前可用的签名 URL */
export function useSignatureViewUrl(url?: string | null): string | null {
  const [viewUrl, setViewUrl] = useState<string | null>(url ?? null)

  useEffect(() => {
    let alive = true
    if (!url) {
      setViewUrl(null)
      return
    }
    getSignatureViewUrl(url).then(resolved => {
      if (alive && resolved) setViewUrl(resolved)
    })
    return () => {
      alive = false
    }
  }, [url])

  return viewUrl
}
