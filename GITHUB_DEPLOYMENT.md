# 🚀 GitHub + CloudBase 自动化部署指南

## 📋 概述

本项目使用GitHub Actions + CloudBase实现自动化CI/CD部署。每次推送代码到main分支时，会自动触发构建和部署。

## 🔧 配置步骤

### 1. GitHub仓库设置

#### 1.1 创建仓库
仓库地址：`https://github.com/nightwatcher1982/suiyue-memoir`

#### 1.2 设置Secrets
在GitHub仓库的Settings > Secrets and variables > Actions中添加以下secrets：

```
CLOUDBASE_ENV_ID=suiyue-memoir-dev-3e9aoud20837ef
TENCENT_SECRET_ID=your_tencent_secret_id
TENCENT_SECRET_KEY=your_tencent_secret_key
```

### 2. 获取腾讯云API密钥

#### 2.1 访问腾讯云控制台
1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 访问 [API密钥管理](https://console.cloud.tencent.com/cam/capi)

#### 2.2 创建API密钥
1. 点击"新建密钥"
2. 记录生成的SecretId和SecretKey
3. **重要**：SecretKey只显示一次，请妥善保存

#### 2.3 配置权限
确保API密钥具有以下权限：
- CloudBase相关权限
- 静态网站托管权限
- 容器服务权限

### 3. CloudBase控制台配置

#### 3.1 开通GitHub集成
1. 访问 [CloudBase控制台](https://console.cloud.tencent.com/tcb)
2. 选择环境：`suiyue-memoir-dev-3e9aoud20837ef`
3. 进入「构建部署」→「GitHub部署」
4. 授权GitHub账号：`nightwatcher1982@gmail.com`

#### 3.2 配置自动部署
1. 选择仓库：`nightwatcher1982/suiyue-memoir`
2. 配置分支：`main`
3. 设置构建配置：
   ```yaml
   # 构建命令
   npm install && npm run build
   
   # 输出目录
   .next
   
   # 环境变量
   NEXT_PUBLIC_CLOUDBASE_ENV_ID: suiyue-memoir-dev-3e9aoud20837ef
   ```

### 4. 自动化工作流

#### 4.1 GitHub Actions配置
已创建 `.github/workflows/deploy.yml` 文件，包含：

- **触发条件**：推送到main分支
- **构建环境**：Ubuntu + Node.js 18
- **构建步骤**：
  1. 检出代码
  2. 安装依赖
  3. 运行构建
  4. 部署到CloudBase

#### 4.2 部署流程
```
代码推送 → GitHub Actions触发 → 自动构建 → 部署到CloudBase → 更新线上服务
```

## 🚀 部署命令

### 快速部署
```bash
# 添加并提交更改
git add .
git commit -m "feat: 新功能或修复"

# 推送到GitHub（自动触发部署）
git push origin main
```

### 手动部署
```bash
# 本地构建测试
npm run build

# 使用CloudBase CLI部署
npm run deploy
```

## 📱 部署后验证

### 1. 检查GitHub Actions
1. 访问GitHub仓库的Actions页面
2. 查看最新的工作流运行状态
3. 检查构建日志

### 2. 验证CloudBase部署
1. 访问CloudBase控制台
2. 检查「构建部署」状态
3. 查看部署日志

### 3. 测试线上功能
访问：`https://suiyue-memoir-dev-3e9aoud20837ef.tcloudbaseapp.com`

测试功能：
- [ ] 首页正常加载
- [ ] 短信登录功能
- [ ] 用户工作台
- [ ] 项目创建和编辑
- [ ] 照片上传功能

## 🔍 故障排查

### 1. GitHub Actions失败
```bash
# 检查构建日志
1. 访问仓库Actions页面
2. 点击失败的工作流
3. 查看错误信息

# 常见问题：
- 环境变量未设置
- 构建命令失败
- API权限不足
```

### 2. CloudBase部署失败
```bash
# 检查CloudBase控制台
1. 查看构建部署日志
2. 检查环境配置
3. 验证资源配额

# 常见问题：
- 代码构建失败
- 资源配额不足
- 权限配置错误
```

### 3. 线上功能异常
```bash
# 检查浏览器控制台
1. 打开开发者工具
2. 查看Console错误
3. 检查Network请求

# 常见问题：
- 环境变量配置
- CloudBase服务未开通
- API调用失败
```

## 🛠️ 高级配置

### 1. 多环境部署
```yaml
# 开发环境
develop:
  envId: suiyue-memoir-dev-3e9aoud20837ef
  
# 生产环境  
production:
  envId: suiyue-memoir-prod-xxxxx
```

### 2. 自定义域名
1. 在CloudBase控制台配置自定义域名
2. 添加SSL证书
3. 配置CDN加速

### 3. 监控和告警
1. 开通CloudBase监控
2. 设置部署成功/失败通知
3. 配置性能监控

## 📞 支持

如果遇到部署问题：

1. **查看文档**：参考CloudBase官方文档
2. **检查日志**：GitHub Actions和CloudBase控制台日志
3. **社区支持**：GitHub Issues讨论

---

## 🎉 部署成功

恭喜！你的岁阅回忆录平台已成功部署到CloudBase。

现在你可以：
- 分享给朋友测试使用
- 持续开发新功能
- 享受自动化部署的便利

**访问地址**：`https://suiyue-memoir-dev-3e9aoud20837ef.tcloudbaseapp.com`