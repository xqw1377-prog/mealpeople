/**
 * 合同签名查看工具（G0-E / G0-Z4 配套）
 *
 * bucket 已私有化且策略按合同相关方授权；库中新数据只存
 * `contract_signatures://{object_path}`，历史数据存公开 URL（仅兼容解析）。
 * 显示端统一经本工具换取短时签名 URL。
 *
 * 设计理念：容易学、容易做、容易管
 */

import {useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'

const BUCKET = 'contract_signatures'
const URI_PREFIX = `${BUCKET}://`
// G0-Z4: 签名图无长时分享场景，TTL 从 1h 缩至 10 分钟
const VIEW_TTL_SECONDS = 600

/** 解析签名引用（新 object_path 格式或历史公开 URL）为 bucket 内路径 */
export function extractSignaturePath(url?: string | null): string | null {
  if (!url) return null
  if (url.startsWith(URI_PREFIX)) {
    return url.substring(URI_PREFIX.length).split('?')[0] || null
  }
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
