/**
 * 工作旅途 DS · Form 表单套件
 * 统一：行内校验 + 提交防重 + 提交 loading + 错误提示
 */
import {Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useState} from 'react'
import type {ReactNode} from 'react'

/* ---------------- Field 容器（label + 行内错误） ---------------- */
export function Field(props: {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  const {label, required, error, children} = props
  return (
    <View className='mb-4'>
      <View className='flex items-center mb-2'>
        {required && <Text className='text-danger-500 mr-0.5'>*</Text>}
        <Text className='text-sm text-gray-700 font-medium'>{label}</Text>
      </View>
      {children}
      {error && (
        <View className='mt-1.5 flex items-center'>
          <Text className='i-mdi-alert-circle-outline text-xs text-danger-500 mr-1' />
          <Text className='text-xs text-danger-500'>{error}</Text>
        </View>
      )}
    </View>
  )
}

/* ---------------- 输入框（统一样式 + 受控） ---------------- */
export function FormInput(props: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: 'text' | 'number' | 'digit'
  maxlength?: number
  disabled?: boolean
}) {
  const {value, onChange, placeholder, type = 'text', maxlength = 200, disabled} = props
  return (
    <View className={`rounded-lg border ${value ? 'border-gray-300' : 'border-gray-200'} bg-white px-3 py-2.5 focus-within:border-primary-500`}>
      <input
        className='w-full text-sm text-gray-900'
        style={{fontSize: '16px'}} /* 防 iOS 聚焦缩放 */
        value={value}
        type={type}
        maxlength={maxlength}
        disabled={disabled}
        placeholder={placeholder}
        placeholderClass='text-gray-300'
        onInput={e => onChange(e.detail.value)}
      />
    </View>
  )
}

/* ---------------- 校验器 ---------------- */
export const validators = {
  required: (msg = '必填项'): [(v: string) => boolean, string] => [v => !!v && !!v.trim(), msg],
  phone: (): [(v: string) => boolean, string] => [/^1\d{10}$/.test.bind(/^1\d{10}$/), '请输入正确的手机号'],
  minLen: (n: number, msg?: string): [(v: string) => boolean, string] =>
    [v => v.length >= n, msg || `至少 ${n} 个字符`],
}

/* ---------------- Submit 按钮（防重 + loading） ---------------- */
export function SubmitButton(props: {
  onSubmit: () => Promise<void>
  text?: string
  disabled?: boolean
  className?: string
}) {
  const {onSubmit, text = '提交', disabled, className = ''} = props
  const [submitting, setSubmitting] = useState(false)
  const handle = async () => {
    if (submitting || disabled) return
    setSubmitting(true)
    try {
      await onSubmit()
    } catch (e: any) {
      Taro.showToast({title: e?.message || '操作失败', icon: 'none'})
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <View
      hoverClass={(submitting || disabled) ? '' : 'opacity-80'}
      className={`flex items-center justify-center rounded-full py-3 font-medium text-white text-base
        ${(submitting || disabled) ? 'bg-gray-300' : 'bg-primary-500'} ${className}`}
      onClick={handle}
    >
      {submitting && <Text className='i-mdi-loading animate-spin mr-2' />}
      <Text>{submitting ? '提交中…' : text}</Text>
    </View>
  )
}
