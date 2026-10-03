# 工作记录功能重新设计方案

## 设计时间
2025-11-06

## 核心需求

### 1. 多媒体记录
- ✅ 拍照记录
- ✅ 视频记录
- ✅ 照片/视频预览
- ✅ 多张照片支持

### 2. 语音转文字
- ✅ 语音录制
- ✅ 实时转文字
- ✅ 快速记录
- ✅ 文字编辑

### 3. 问题分类
- ✅ 分类选择
- ✅ 自定义分类
- ✅ 分类图标
- ✅ 分类颜色

### 4. 类别设置
- ✅ 类别管理
- ✅ 新增类别
- ✅ 编辑类别
- ✅ 删除类别

## 功能设计

### 页面结构
1. **工作记录列表页** - `/pages/work-log/index`
   - 今日统计
   - 记录列表
   - 快速添加按钮

2. **添加工作记录页** - `/pages/work-log/add`
   - 拍照/视频
   - 语音输入
   - 分类选择
   - 文字描述
   - 提交保存

3. **工作记录详情页** - `/pages/work-log/detail`
   - 查看照片/视频
   - 查看文字描述
   - 查看分类
   - 查看时间

4. **类别设置页** - `/pages/work-log/category-settings`
   - 类别列表
   - 添加类别
   - 编辑类别
   - 删除类别

## 数据库设计

### 工作记录表 (work_records)
```sql
CREATE TABLE work_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  category_id UUID NOT NULL REFERENCES work_log_categories(id),
  content TEXT NOT NULL,
  images TEXT[], -- 照片URL数组
  videos TEXT[], -- 视频URL数组
  voice_duration INTEGER, -- 语音时长（秒）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 工作记录类别表 (work_log_categories)
```sql
CREATE TABLE work_log_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 技术实现

### 1. 拍照/视频功能
- 使用 Taro.chooseImage() 选择照片
- 使用 Taro.chooseVideo() 选择视频
- 使用 Supabase Storage 存储文件
- 支持多张照片上传

### 2. 语音转文字功能
- 使用 Taro.getRecorderManager() 录音
- 调用语音识别API转文字
- 实时显示转换结果
- 支持编辑修改

### 3. 分类管理
- 租户级别的分类配置
- 支持自定义图标和颜色
- 支持排序
- 支持启用/禁用

### 4. 文件上传
- 图片压缩（最大1MB）
- 视频压缩（最大10MB）
- 上传进度显示
- 错误处理

## 用户体验

### 添加记录流程
1. 点击"添加记录"按钮
2. 选择分类
3. 拍照或录视频（可选）
4. 语音输入或文字输入
5. 预览确认
6. 提交保存

### 查看记录流程
1. 查看记录列表
2. 点击记录查看详情
3. 查看照片/视频
4. 查看文字描述

### 类别设置流程
1. 进入设置页面
2. 查看现有类别
3. 添加/编辑/删除类别
4. 设置图标和颜色
5. 保存配置

## 默认类别

### 预设类别
1. 客户接待 - 蓝色 - i-mdi-account-group
2. 清洁卫生 - 绿色 - i-mdi-broom
3. 设备维护 - 橙色 - i-mdi-tools
4. 库存管理 - 紫色 - i-mdi-package-variant
5. 安全检查 - 红色 - i-mdi-shield-check
6. 培训学习 - 青色 - i-mdi-school
7. 会议记录 - 粉色 - i-mdi-calendar-text
8. 其他工作 - 灰色 - i-mdi-file-document

## 实施步骤

### Phase 1: 数据库设计 ✅
1. ✅ 创建工作记录类别表
2. ✅ 创建工作记录表
3. ✅ 创建索引和RLS策略
4. ✅ 插入默认类别数据
5. ✅ 创建Supabase存储桶

### Phase 2: 类别设置页面 ✅
1. ✅ 创建类别设置页面
2. ✅ 实现类别列表展示
3. ✅ 实现添加类别功能
4. ✅ 实现编辑类别功能
5. ✅ 实现删除类别功能

### Phase 3: 添加记录页面 ✅
1. ✅ 创建添加记录页面
2. ✅ 实现拍照功能
3. ✅ 实现视频录制功能
4. ✅ 实现语音转文字功能
5. ✅ 实现分类选择
6. ✅ 实现文件上传

### Phase 4: 记录列表和详情 ✅
1. ✅ 重构记录列表页面
2. ✅ 实现多媒体展示
3. ✅ 实现数据加载
4. ✅ 实现统计功能

## 注意事项

### 文件大小限制
- 图片：最大1MB
- 视频：最大10MB
- 自动压缩超限文件

### 权限控制
- 员工只能查看自己的记录
- 管理员可以查看所有记录
- 类别设置仅管理员可访问

### 性能优化
- 图片懒加载
- 视频缩略图
- 分页加载记录
- 缓存分类数据
