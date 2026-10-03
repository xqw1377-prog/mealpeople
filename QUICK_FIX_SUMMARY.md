# 快速修复总结

## 问题
配置中心和Agent管理页面无法跳转

## 根本原因
Taro分包配置中的路径包含了重复的分包名称前缀

## 错误示例
```typescript
{
  root: 'packageD',
  pages: [
    'packageD/pages/config-center/index'  // ❌ 错误
  ]
}
```
实际路径变成了：`packageD/packageD/pages/config-center/index`

## 正确配置
```typescript
{
  root: 'packageD',
  pages: [
    'pages/config-center/index'  // ✅ 正确
  ]
}
```

## 关键规则

### 1. 分包配置（app.config.ts）
- 使用**相对路径**（相对于root）
- 不要重复包含分包名称

### 2. 页面跳转（navigateTo等）
- 使用**绝对路径**（包含分包名称）
- 例如：`/packageD/pages/config-center/index`

## 修复的文件
1. `src/app.config.ts` - 修复分包配置路径
2. `src/pages/profile/index.tsx` - 修复跳转URL
3. `src/pages/profile/index-new.tsx` - 修复跳转URL

## 相关提交
- ce9b400: 修复profile页面中的跳转URL
- 4081fae: 修复分包配置中的路径重复问题

## 详细文档
查看 `FIX_NAVIGATION_ISSUE.md` 了解完整的修复过程和技术细节
