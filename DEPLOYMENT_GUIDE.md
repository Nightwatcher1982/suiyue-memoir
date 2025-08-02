# 🚀 CloudBase 部署完整指南

## 📋 部署前准备清单

### 1. ✅ CloudBase 控制台配置

#### 1.1 确认身份验证功能已开通
1. 登录 [CloudBase控制台](https://console.cloud.tencent.com/tcb)
2. 选择环境：`suiyue-memoir-dev-3e9aoud20837ef`
3. 进入「身份验证」→「登录方式」
4. **确保「手机号」登录已开通并配置**
   - 短信模板已审核通过
   - 短信签名已设置：`岁阅`
   - 验证码有效期：5分钟
   - 发送频率限制：1分钟1条

#### 1.2 确认数据库权限
1. 进入「数据库」→「安全规则」
2. 确保有适当的读写权限规则
3. 检查集合权限设置

#### 1.3 开通静态网站托管
1. 进入「静态网站托管」
2. 点击「开通」（如果还未开通）
3. 记录分配的域名：`https://your-env-id.tcloudbaseapp.com`

### 2. ✅ 本地环境准备

#### 2.1 安装 CloudBase CLI
```bash
# 全局安装CloudBase CLI（如果还没有安装）
npm install -g @cloudbase/cli

# 验证安装
tcb --version
```

#### 2.2 登录 CloudBase
```bash
# 登录CloudBase（会打开浏览器进行授权）
tcb login

# 验证登录状态
tcb env:list
```

#### 2.3 设置默认环境
```bash
tcb env:set suiyue-memoir-dev-3e9aoud20837ef
```

### 3. ✅ 代码配置检查

#### 3.1 环境变量配置
已创建 `.env.production` 文件，包含：
- `NEXT_PUBLIC_CLOUDBASE_ENV_ID`
- `NEXT_PUBLIC_APP_URL`

#### 3.2 Next.js 配置
已修改 `next.config.mjs`：
- `output: 'standalone'` - 独立部署
- 支持容器化部署

#### 3.3 CloudBase 配置
已创建：
- `cloudbaserc.json` - CloudBase Framework配置
- `Dockerfile` - 容器部署配置

## 🚀 部署步骤

### 方法一：使用 npm 脚本部署（推荐）

```bash
# 1. 构建并部署
npm run deploy

# 或者使用 Framework 模式部署（推荐）
npm run deploy:framework
```

### 方法二：手动部署步骤

```bash
# 1. 构建项目
npm run build

# 2. 检查构建输出
ls -la dist/

# 3. 部署到CloudBase
tcb hosting deploy ./dist -e suiyue-memoir-dev-3e9aoud20837ef

# 4. 验证部署
tcb hosting detail -e suiyue-memoir-dev-3e9aoud20837ef
```

### 方法三：使用 CloudBase Framework（最佳实践）

```bash
# 1. 安装Framework插件
npm install -D @cloudbase/framework-core @cloudbase/framework-plugin-website

# 2. 部署
tcb framework deploy --verbose

# 3. 查看部署状态
tcb framework describe
```

## 🔍 部署后验证

### 1. 访问测试
1. 获取部署URL：`https://suiyue-memoir-dev-3e9aoud20837ef.tcloudbaseapp.com`
2. 测试首页加载
3. 测试短信登录功能
4. 测试项目创建功能

### 2. 功能测试清单
- [ ] 首页正常显示
- [ ] 短信验证码发送成功
- [ ] 手机号登录/注册正常
- [ ] 用户工作台显示正常
- [ ] 项目创建功能正常
- [ ] 编辑器页面加载正常
- [ ] 数据库读写正常

### 3. 控制台监控
1. 查看「用户管理」中的新注册用户
2. 监控「数据库」中的数据变化
3. 检查「日志」中的错误信息

## ⚠️ 常见问题排查

### 1. 部署失败
```bash
# 检查登录状态
tcb login --check

# 检查环境ID
tcb env:list

# 查看详细错误
tcb hosting deploy ./dist -e suiyue-memoir-dev-3e9aoud20837ef --verbose
```

### 2. 页面404错误
- 检查 `next.config.mjs` 中的 `trailingSlash: true`
- 确保 `output: 'export'` 配置正确
- 验证构建输出目录 `dist/` 中的文件结构

### 3. CloudBase连接失败
- 验证环境变量 `NEXT_PUBLIC_CLOUDBASE_ENV_ID`
- 检查CloudBase控制台中的环境状态
- 确认域名白名单配置

### 4. 短信功能异常
- 检查CloudBase控制台「身份验证」配置
- 确认短信余额充足
- 查看「日志」中的短信发送记录

## 🛠️ 性能优化建议

### 1. CDN加速
1. 在CloudBase控制台开通CDN
2. 配置自定义域名（可选）
3. 设置缓存策略

### 2. 监控设置
1. 开通CloudBase监控
2. 设置告警策略
3. 监控用户访问数据

### 3. 安全配置
1. 设置防盗链
2. 配置访问控制
3. 开启HTTPS强制跳转

## 📱 分享给其他用户测试

部署成功后，可以分享以下信息给测试用户：

**测试地址**：`https://suiyue-memoir-dev-3e9aoud20837ef.tcloudbaseapp.com`

**测试说明**：
1. 这是一个AI回忆录写作平台
2. 支持手机号短信验证码登录
3. 可以创建回忆录项目和编辑内容
4. 目前处于测试阶段，数据可能会被清理

**测试重点**：
- 短信登录流程是否顺畅
- 界面是否正常显示
- 功能是否符合预期
- 有任何问题请及时反馈

## 🔄 后续维护

### 1. 定期更新
```bash
# 更新代码后重新部署
git pull
npm run deploy:framework
```

### 2. 监控数据
- 定期检查CloudBase控制台数据
- 监控用户注册和使用情况
- 关注短信发送成功率

### 3. 备份策略
- 定期备份数据库数据
- 保存重要配置文件
- 记录部署版本信息

---

🎉 **现在可以开始部署了！按照上述步骤操作，几分钟内就能让其他人访问你的回忆录平台。**