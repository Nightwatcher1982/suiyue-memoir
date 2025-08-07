# 岁阅项目环境配置指南

## 🚀 快速开始

### 1. 环境配置初始化

```bash
# 克隆项目后，首先初始化环境配置
npm run env:init

# 检查环境配置
npm run env:check
```

### 2. 填入API密钥

编辑 `.env.local` 文件，将占位符替换为真实的API密钥：

```bash
# 编辑环境配置文件
nano .env.local
```

## 🔑 API密钥获取指南

### CloudBase (腾讯云开发)
- 已配置：`suiyue-memoir-dev-3e9aoud20837ef`
- 无需修改，除非使用自己的CloudBase环境

### 通义千问 (阿里云DashScope)
1. 访问 [DashScope控制台](https://dashscope.console.aliyun.com/)
2. 创建API-KEY
3. 填入 `TONGYI_ACCESS_KEY_ID` 和 `DASHSCOPE_API_KEY`

### 阿里云OCR服务
1. 访问 [阿里云控制台](https://ram.console.aliyun.com/)
2. 创建AccessKey
3. 填入 `ALIBABA_ACCESS_KEY_ID` 和 `ALIBABA_ACCESS_KEY_SECRET`

### 科大讯飞语音识别 (可选)
1. 访问 [讯飞开放平台](https://www.xfyun.cn/)
2. 创建语音识别应用
3. 填入 `XFYUN_APP_ID`, `XFYUN_API_SECRET`, `XFYUN_API_KEY`

## 🛠️ 开发环境启动

### 统一启动方式（推荐）
```bash
# 自动启动所有必需服务
npm run dev

# 清理缓存后启动
npm run dev:clean
```

### 传统启动方式
```bash
# 仅启动Next.js
npm run dev:simple

# 手动启动WebSocket代理
npm run ws-proxy
```

### 启动故障排除

如果遇到启动问题，可以尝试：

```bash
# 检查环境配置
npm run env:check

# 备份当前配置
npm run env:backup

# 重新初始化
npm run env:init
```

## 🔐 安全管理

### 敏感信息检查
```bash
# 检查是否有敏感信息泄露风险
npm run env:secure
```

### 环境变量备份
```bash
# 备份当前环境配置
npm run env:backup
```

### 生产环境配置
生产环境使用CloudBase的容器环境变量，不依赖`.env.local`文件。

## 🚀 CI/CD 环境配置

### GitHub Actions Secrets

在 GitHub 仓库的 `Settings > Secrets and variables > Actions` 中添加以下环境变量：

#### 必需的环境变量:
- `NEXT_PUBLIC_CLOUDBASE_ENV_ID`: CloudBase环境ID
- `CLOUDBASE_SECRET_ID`: CloudBase访问密钥ID
- `CLOUDBASE_SECRET_KEY`: CloudBase访问密钥

#### AI功能相关 (可选):
- `TONGYI_ACCESS_KEY_ID`: 通义千问API密钥
- `DASHSCOPE_API_KEY`: DashScope API密钥
- `ALIBABA_ACCESS_KEY_ID`: 阿里云访问密钥ID
- `ALIBABA_ACCESS_KEY_SECRET`: 阿里云访问密钥

#### 语音服务 (可选):
- `XFYUN_APP_ID`: 科大讯飞应用ID
- `XFYUN_API_SECRET`: 科大讯飞API密钥
- `XFYUN_API_KEY`: 科大讯飞API Key

### CloudBase 容器环境变量

通过CloudBase控制台或CLI设置：

```bash
# 使用CLI设置环境变量
tcb env:config set --env suiyue-memoir-dev-3e9aoud20837ef --key TONGYI_ACCESS_KEY_ID --value "your-api-key"
tcb env:config set --env suiyue-memoir-dev-3e9aoud20837ef --key ALIBABA_ACCESS_KEY_ID --value "your-access-key"
tcb env:config set --env suiyue-memoir-dev-3e9aoud20837ef --key ALIBABA_ACCESS_KEY_SECRET --value "your-secret"
```

## 📋 环境验证清单

运行以下命令验证环境配置：

### 本地开发环境
- [ ] `npm run env:check` - 环境变量检查
- [ ] `npm run env:secure` - 敏感信息检查
- [ ] `npm run dev` - 开发服务器启动
- [ ] 访问 `http://localhost:3000` 确认应用正常运行

### 生产环境
- [ ] CloudBase环境变量配置完成
- [ ] CI/CD Secrets配置完成
- [ ] 部署流水线运行成功
- [ ] 健康检查端点正常

## 🆘 故障排除

### 常见问题

1. **启动失败**
   ```bash
   npm run env:check
   npm run dev:clean
   ```

2. **API密钥错误**
   ```bash
   npm run env:backup
   npm run env:init
   # 重新填入正确的API密钥
   ```

3. **端口冲突**
   ```bash
   # 检查占用进程
   lsof -ti:3000
   lsof -ti:8080
   
   # 终止占用进程
   kill -9 $(lsof -ti:3000)
   ```

4. **WebSocket连接失败**
   - 检查 `DASHSCOPE_API_KEY` 是否正确配置
   - 确认WebSocket代理服务器正常运行

### 获取帮助

如果遇到问题，可以：
1. 查看控制台错误信息
2. 检查 `.env.local` 配置
3. 运行环境检查命令
4. 查看GitHub Issues或提交新问题

## 🔗 相关链接

- [CloudBase控制台](https://console.cloud.tencent.com/tcb)
- [DashScope控制台](https://dashscope.console.aliyun.com/)
- [阿里云控制台](https://console.aliyun.com/)
- [科大讯飞开放平台](https://www.xfyun.cn/)

---

📝 **注意**: 此文档会随着项目发展持续更新，请定期查看最新版本。