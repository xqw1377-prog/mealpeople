#!/bin/bash

echo "🧹 开始清除缓存..."

# 删除编译产物
if [ -d "dist" ]; then
  echo "📁 删除 dist 目录..."
  rm -rf dist
  echo "✅ dist 目录已删除"
fi

# 删除 Taro 缓存
if [ -d ".taro_cache" ]; then
  echo "📁 删除 .taro_cache 目录..."
  rm -rf .taro_cache
  echo "✅ .taro_cache 目录已删除"
fi

# 删除 node_modules 缓存
if [ -d "node_modules/.cache" ]; then
  echo "📁 删除 node_modules/.cache 目录..."
  rm -rf node_modules/.cache
  echo "✅ node_modules/.cache 目录已删除"
fi

echo ""
echo "🎉 缓存清除完成！"
echo ""
echo "📝 下一步："
echo "1. 运行: npm run dev:weapp"
echo "2. 等待编译完成"
echo "3. 完全关闭并重新打开微信开发者工具"
echo "4. 在微信开发者工具中点击: 编译 -> 清缓存 -> 清除所有缓存"
echo "5. 再次点击编译"
echo ""
