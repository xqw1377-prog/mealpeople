# 餐时间工作旅程系统 - 部署指南

## 📖 目录

1. [部署前准备](#部署前准备)
2. [环境配置](#环境配置)
3. [数据库部署](#数据库部署)
4. [应用部署](#应用部署)
5. [测试验证](#测试验证)
6. [上线运营](#上线运营)
7. [运维监控](#运维监控)
8. [故障处理](#故障处理)

---

## 部署前准备

### 系统要求

#### 开发环境
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git >= 2.0.0

#### 生产环境
- 服务器：2核4G内存以上
- 操作系统：Linux（推荐Ubuntu 20.04+）
- 数据库：PostgreSQL 14+（Supabase）
- 域名：已备案的域名
- SSL证书：HTTPS证书

### 账号准备

1. **Supabase账号**
   - 注册地址：https://supabase.com
   - 创建项目
   - 获取API密钥

2. **微信小程序账号**（可选）
   - 注册地址：https://mp.weixin.qq.com
   - 完成认证
   - 获取AppID和AppSecret

3. **域名和SSL证书**
   - 购买域名
   - 完成备案
   - 申请SSL证书

---

## 环境配置

### 1. 克隆代码

```bash
# 克隆仓库
git clone <repository-url>
cd app-7daop8q0sxdt

# 安装依赖
pnpm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
# 应用配置
TARO_APP_NAME=餐时间工作台
TARO_APP_APP_ID=your-app-id

# Supabase配置
TARO_APP_SUPABASE_URL=https://your-project.supabase.co
TARO_APP_SUPABASE_ANON_KEY=your-anon-key

# 微信小程序配置（可选）
TARO_APP_WECHAT_APPID=your-wechat-appid
TARO_APP_WECHAT_APPSECRET=your-wechat-appsecret
```

### 3. 配置文件说明

#### app.config.ts
```typescript
export default defineAppConfig({
  pages: [
    // 页面路由配置
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '餐时间工作台',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    // 底部导航配置
  }
})
```

#### project.config.json
```json
{
  "miniprogramRoot": "dist/",
  "projectname": "canshijian-work-journey-system",
  "description": "餐时间工作旅程系统",
  "appid": "your-wechat-appid",
  "setting": {
    "urlCheck": true,
    "es6": false,
    "enhance": true,
    "compileHotReLoad": false
  }
}
```

---

## 数据库部署

### 1. 初始化Supabase项目

```bash
# 登录Supabase
supabase login

# 初始化项目
supabase init

# 链接到远程项目
supabase link --project-ref your-project-ref
```

### 2. 执行数据库迁移

```bash
# 查看迁移文件
ls supabase/migrations/

# 执行所有迁移
supabase db push

# 或者手动执行每个迁移文件
supabase db execute -f supabase/migrations/01_initial_schema.sql
supabase db execute -f supabase/migrations/02_tenant_management.sql
# ... 执行所有迁移文件
```

### 3. 验证数据库

```bash
# 查看数据库状态
supabase db status

# 查看表结构
supabase db inspect

# 测试数据库连接
supabase db test
```

### 4. 配置RLS策略

确保所有表都已启用行级安全（RLS）：

```sql
-- 检查RLS状态
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 启用RLS（如果未启用）
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### 5. 创建初始数据

```sql
-- 创建默认请假类型
INSERT INTO leave_types (tenant_id, type_name, type_code, max_days_per_year, is_paid)
VALUES 
  ('default-tenant-id', '年假', 'annual', 10, true),
  ('default-tenant-id', '病假', 'sick', 15, true),
  ('default-tenant-id', '事假', 'personal', 5, false);

-- 创建默认加班类型
INSERT INTO overtime_types (tenant_id, type_name, type_code, compensation_rate)
VALUES 
  ('default-tenant-id', '工作日加班', 'weekday', 1.5),
  ('default-tenant-id', '周末加班', 'weekend', 2.0),
  ('default-tenant-id', '节假日加班', 'holiday', 3.0);
```

---

## 应用部署

### 1. 本地开发测试

```bash
# H5开发模式
pnpm run dev:h5

# 微信小程序开发模式
pnpm run dev:weapp

# 代码检查
pnpm run lint

# 类型检查
pnpm run type-check
```

### 2. 构建生产版本

```bash
# 构建H5生产版本
pnpm run build:h5

# 构建微信小程序生产版本
pnpm run build:weapp
```

### 3. H5部署

#### 使用Nginx部署

1. **安装Nginx**
```bash
sudo apt update
sudo apt install nginx
```

2. **配置Nginx**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL证书配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # 网站根目录
    root /var/www/canshijian/dist/h5;
    index index.html;
    
    # 单页应用路由配置
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

3. **部署文件**
```bash
# 复制构建文件到服务器
scp -r dist/h5/* user@server:/var/www/canshijian/dist/h5/

# 重启Nginx
sudo systemctl restart nginx
```

#### 使用Docker部署

1. **创建Dockerfile**
```dockerfile
FROM nginx:alpine

# 复制构建文件
COPY dist/h5 /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

2. **构建和运行**
```bash
# 构建镜像
docker build -t canshijian-h5 .

# 运行容器
docker run -d -p 80:80 --name canshijian canshijian-h5
```

### 4. 微信小程序部署

1. **上传代码**
   - 打开微信开发者工具
   - 导入项目（选择 `dist/` 目录）
   - 点击"上传"
   - 填写版本号和备注

2. **提交审核**
   - 登录微信公众平台
   - 进入"版本管理"
   - 选择刚上传的版本
   - 点击"提交审核"
   - 填写审核信息

3. **发布上线**
   - 审核通过后
   - 点击"发布"
   - 确认发布

---

## 测试验证

### 1. 功能测试

#### 基础功能测试
- [ ] 用户注册登录
- [ ] 租户创建和切换
- [ ] 品牌和门店管理
- [ ] 员工管理

#### 核心功能测试
- [ ] 今日运营仪表盘
- [ ] 智能排班系统
- [ ] 成本管控模块
- [ ] 数据分析系统

#### 员工管理测试
- [ ] 招聘管理
- [ ] 入职管理
- [ ] 培训发展
- [ ] 绩效管理
- [ ] 请假管理
- [ ] 加班管理
- [ ] 薪酬福利
- [ ] 晋升管理
- [ ] 调岗管理
- [ ] 离职管理

### 2. 性能测试

```bash
# 使用Apache Bench进行压力测试
ab -n 1000 -c 100 https://your-domain.com/

# 使用Lighthouse进行性能评分
lighthouse https://your-domain.com/ --view
```

### 3. 安全测试

- [ ] SQL注入测试
- [ ] XSS攻击测试
- [ ] CSRF攻击测试
- [ ] 权限控制测试
- [ ] 数据隔离测试

### 4. 兼容性测试

- [ ] Chrome浏览器
- [ ] Safari浏览器
- [ ] Edge浏览器
- [ ] 微信小程序
- [ ] 不同屏幕尺寸

---

## 上线运营

### 1. 数据初始化

```sql
-- 创建默认租户
INSERT INTO tenants (name, contact_phone, contact_email)
VALUES ('示例餐厅', '13800138000', 'demo@example.com');

-- 创建默认品牌
INSERT INTO brands (tenant_id, name, description)
VALUES ('tenant-id', '示例品牌', '这是一个示例品牌');

-- 创建默认门店
INSERT INTO stores (tenant_id, brand_id, name, address, phone)
VALUES ('tenant-id', 'brand-id', '示例门店', '北京市朝阳区', '010-12345678');
```

### 2. 用户培训

#### 管理员培训
- 系统架构介绍
- 租户管理
- 员工管理
- 数据分析
- 系统配置

#### 普通用户培训
- 登录使用
- 工作日志
- 请假加班
- 个人成长

### 3. 运营准备

- [ ] 准备用户手册
- [ ] 准备视频教程
- [ ] 准备常见问题
- [ ] 建立客服团队
- [ ] 准备应急预案

---

## 运维监控

### 1. 日志监控

```bash
# 查看Nginx访问日志
tail -f /var/log/nginx/access.log

# 查看Nginx错误日志
tail -f /var/log/nginx/error.log

# 查看应用日志
tail -f /var/log/canshijian/app.log
```

### 2. 性能监控

使用Supabase Dashboard监控：
- 数据库连接数
- 查询性能
- 存储使用量
- API请求量

### 3. 告警配置

配置告警规则：
- 服务器CPU使用率 > 80%
- 服务器内存使用率 > 80%
- 数据库连接数 > 80%
- API错误率 > 5%
- 响应时间 > 3秒

### 4. 备份策略

```bash
# 数据库备份（每天凌晨2点）
0 2 * * * pg_dump -h localhost -U postgres -d canshijian > /backup/db_$(date +\%Y\%m\%d).sql

# 文件备份（每周日凌晨3点）
0 3 * * 0 tar -czf /backup/files_$(date +\%Y\%m\%d).tar.gz /var/www/canshijian

# 清理30天前的备份
0 4 * * * find /backup -name "*.sql" -mtime +30 -delete
0 4 * * * find /backup -name "*.tar.gz" -mtime +30 -delete
```

---

## 故障处理

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查数据库状态
systemctl status postgresql

# 检查连接配置
cat .env | grep SUPABASE

# 测试连接
psql -h localhost -U postgres -d canshijian
```

#### 2. 页面无法访问
```bash
# 检查Nginx状态
systemctl status nginx

# 检查端口占用
netstat -tlnp | grep 80

# 重启Nginx
systemctl restart nginx
```

#### 3. 接口报错
```bash
# 查看错误日志
tail -f /var/log/nginx/error.log

# 检查API配置
cat .env | grep API

# 测试API
curl -X GET https://your-domain.com/api/health
```

### 应急预案

#### 服务器宕机
1. 立即切换到备用服务器
2. 通知用户服务暂时不可用
3. 排查问题原因
4. 修复问题
5. 恢复服务
6. 通知用户服务已恢复

#### 数据库故障
1. 立即停止写入操作
2. 从最近的备份恢复
3. 检查数据完整性
4. 恢复服务
5. 分析故障原因
6. 优化备份策略

#### 安全事件
1. 立即隔离受影响的系统
2. 评估影响范围
3. 修复安全漏洞
4. 恢复服务
5. 通知受影响用户
6. 加强安全措施

---

## 版本升级

### 升级流程

1. **备份数据**
```bash
# 备份数据库
pg_dump -h localhost -U postgres -d canshijian > backup_before_upgrade.sql

# 备份文件
tar -czf backup_files.tar.gz /var/www/canshijian
```

2. **测试新版本**
```bash
# 在测试环境部署新版本
git pull origin main
pnpm install
pnpm run build:h5
```

3. **执行升级**
```bash
# 停止服务
systemctl stop nginx

# 部署新版本
cp -r dist/h5/* /var/www/canshijian/dist/h5/

# 执行数据库迁移
supabase db push

# 启动服务
systemctl start nginx
```

4. **验证升级**
- 检查服务状态
- 测试核心功能
- 查看错误日志
- 监控性能指标

5. **回滚方案**
```bash
# 如果升级失败，回滚到之前版本
systemctl stop nginx
rm -rf /var/www/canshijian/dist/h5/*
tar -xzf backup_files.tar.gz -C /
psql -h localhost -U postgres -d canshijian < backup_before_upgrade.sql
systemctl start nginx
```

---

## 联系支持

如果在部署过程中遇到问题，请联系技术支持：

- 📧 邮箱：support@canshijian.com
- 📱 电话：400-xxx-xxxx
- 💬 在线客服：工作日 9:00-18:00

---

**餐时间工作旅程系统** - 专业的餐饮行业人力资源管理平台 🚀
