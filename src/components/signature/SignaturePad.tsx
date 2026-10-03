/**
 * 电子签名画板组件 - 优化版
 *
 * 功能：
 * - 手写签名
 * - 清除签名
 * - 保存签名为图片
 * - 支持触摸和鼠标操作
 * - 优化Canvas API兼容性
 *
 * 设计理念：容易学、容易做、容易管
 */

import {Button, Canvas, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import type React from 'react'
import {useCallback, useEffect, useRef, useState} from 'react'

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void
  onCancel: () => void
}

const SignaturePad: React.FC<SignaturePadProps> = ({onSave, onCancel}) => {
  const canvasId = 'signature-canvas'
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const [canvasReady, setCanvasReady] = useState(false)
  const contextRef = useRef<any>(null)
  const lastPointRef = useRef<{x: number; y: number} | null>(null)

  // 初始化Canvas
  const initCanvas = useCallback(() => {
    try {
      const query = Taro.createSelectorQuery()
      query
        .select(`#${canvasId}`)
        .fields({node: true, size: true})
        .exec((res) => {
          if (res?.[0]) {
            const canvas = res[0].node
            const ctx = canvas.getContext('2d')

            if (!ctx) {
              console.error('无法获取Canvas上下文')
              Taro.showToast({
                title: 'Canvas初始化失败',
                icon: 'none'
              })
              return
            }

            // 获取设备像素比
            const dpr = Taro.getSystemInfoSync().pixelRatio || 2
            const width = res[0].width
            const height = res[0].height

            // 设置Canvas实际尺寸（考虑设备像素比）
            canvas.width = width * dpr
            canvas.height = height * dpr

            // 缩放绘图上下文以匹配设备像素比
            ctx.scale(dpr, dpr)

            // 设置画笔样式
            ctx.strokeStyle = '#000000'
            ctx.lineWidth = 3
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'

            // 填充白色背景
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, width, height)

            // 保存上下文引用
            contextRef.current = {
              ctx,
              canvas,
              width,
              height,
              dpr
            }

            setCanvasReady(true)

            console.log('Canvas初始化成功', {width, height, dpr})
          } else {
            console.error('Canvas节点查询失败')
            Taro.showToast({
              title: 'Canvas初始化失败',
              icon: 'none'
            })
          }
        })
    } catch (error) {
      console.error('Canvas初始化异常:', error)
      Taro.showToast({
        title: 'Canvas初始化异常',
        icon: 'none'
      })
    }
  }, [])

  useEffect(() => {
    // 延迟初始化，确保DOM已渲染
    const timer = setTimeout(() => {
      initCanvas()
    }, 300)

    return () => clearTimeout(timer)
  }, [initCanvas])

  // 开始绘制
  const handleTouchStart = (e: any) => {
    if (!contextRef.current || !canvasReady) {
      console.warn('Canvas未就绪')
      return
    }

    e.preventDefault()
    e.stopPropagation()

    const touch = e.touches[0]
    const {x, y} = touch

    lastPointRef.current = {x, y}
    setIsDrawing(true)
    setIsEmpty(false)

    console.log('开始绘制', {x, y})
  }

  // 绘制中
  const handleTouchMove = (e: any) => {
    if (!isDrawing || !contextRef.current || !lastPointRef.current || !canvasReady) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    const touch = e.touches[0]
    const {x, y} = touch
    const {ctx} = contextRef.current

    // 绘制线条
    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.lineTo(x, y)
    ctx.stroke()

    lastPointRef.current = {x, y}
  }

  // 结束绘制
  const handleTouchEnd = () => {
    setIsDrawing(false)
    lastPointRef.current = null
    console.log('结束绘制')
  }

  // 清除签名
  const handleClear = () => {
    if (!contextRef.current || !canvasReady) {
      console.warn('Canvas未就绪')
      return
    }

    const {ctx, width, height} = contextRef.current
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)
    setIsEmpty(true)

    Taro.showToast({
      title: '已清除',
      icon: 'success',
      duration: 1000
    })
  }

  // 保存签名
  const handleSave = async () => {
    if (isEmpty) {
      Taro.showToast({
        title: '请先签名',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (!contextRef.current || !canvasReady) {
      Taro.showToast({
        title: 'Canvas未就绪',
        icon: 'none',
        duration: 2000
      })
      return
    }

    try {
      Taro.showLoading({title: '保存中...'})

      const {canvas} = contextRef.current

      // 使用新版API将Canvas转换为图片
      const res = await Taro.canvasToTempFilePath({
        canvas,
        fileType: 'png',
        quality: 1
      })

      Taro.hideLoading()

      if (res.tempFilePath) {
        console.log('签名保存成功:', res.tempFilePath)
        onSave(res.tempFilePath)
      } else {
        throw new Error('未获取到图片路径')
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('保存签名失败:', error)
      Taro.showToast({
        title: '保存失败，请重试',
        icon: 'error',
        duration: 2000
      })
    }
  }

  return (
    <View className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* 标题 */}
        <View className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
          <Text className="text-lg font-bold text-white text-center block">电子签名</Text>
          <Text className="text-xs text-white/80 text-center mt-1 block">请在下方区域内签名</Text>
        </View>

        {/* 签名画板 */}
        <View className="p-4">
          <View className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white relative">
            <Canvas
              id={canvasId}
              type="2d"
              canvasId={canvasId}
              className="w-full h-64"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            />

            {/* Canvas状态提示 */}
            {!canvasReady && (
              <View className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <View className="text-center">
                  <View className="i-mdi-loading animate-spin text-3xl text-blue-600 mb-2" />
                  <Text className="text-sm text-muted-foreground">初始化中...</Text>
                </View>
              </View>
            )}
          </View>

          {/* 提示文字 */}
          <View className="flex items-center justify-center gap-2 mt-3">
            <View
              className={`i-mdi-${isEmpty ? 'gesture-tap' : 'check-circle'} text-lg ${isEmpty ? 'text-blue-600' : 'text-green-600'}`}
            />
            <Text className="text-xs text-muted-foreground">
              {isEmpty ? '请用手指在上方区域内签名' : '签名已完成，可以保存或重新签名'}
            </Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <View className="flex gap-3 p-4 border-t border-gray-200">
          <Button
            className="flex-1 bg-gray-100 text-foreground py-3 rounded-lg break-keep text-sm"
            size="default"
            onClick={onCancel}>
            <View className="flex items-center justify-center gap-1">
              <View className="i-mdi-close text-base" />
              <Text>取消</Text>
            </View>
          </Button>
          <Button
            className="flex-1 bg-orange-500 text-white py-3 rounded-lg break-keep text-sm"
            size="default"
            onClick={handleClear}
            disabled={!canvasReady}>
            <View className="flex items-center justify-center gap-1">
              <View className="i-mdi-eraser text-base" />
              <Text>清除</Text>
            </View>
          </Button>
          <Button
            className="flex-1 bg-blue-500 text-white py-3 rounded-lg break-keep text-sm"
            size="default"
            onClick={handleSave}
            disabled={!canvasReady || isEmpty}>
            <View className="flex items-center justify-center gap-1">
              <View className="i-mdi-content-save text-base" />
              <Text>保存</Text>
            </View>
          </Button>
        </View>
      </View>
    </View>
  )
}

export default SignaturePad
