# 部署说明

## CloudBase 环境变量配置

在部署到CloudBase前，需要在CloudBase控制台中手动配置以下环境变量：

### 🔑 阿里云OCR服务配置

```bash
# 阿里云AccessKey配置（手写体识别服务）
ALIBABA_ACCESS_KEY_ID=YOUR_ALIBABA_ACCESS_KEY_ID
ALIBABA_ACCESS_KEY_SECRET=YOUR_ALIBABA_ACCESS_KEY_SECRET

# 兼容性配置
ALIBABA_CLOUD_ACCESS_KEY_ID=YOUR_ALIBABA_ACCESS_KEY_ID  
ALIBABA_CLOUD_ACCESS_KEY_SECRET=YOUR_ALIBABA_ACCESS_KEY_SECRET
```

### 🤖 通义千问API配置

```bash
DASHSCOPE_API_KEY=YOUR_DASHSCOPE_API_KEY
TONGYI_ACCESS_KEY_ID=YOUR_DASHSCOPE_API_KEY
QIANWEN_API_KEY=YOUR_DASHSCOPE_API_KEY
```

### 🌐 基础配置

```bash
NEXT_PUBLIC_CLOUDBASE_ENV_ID=your-env-id
NODE_ENV=production
```

## 部署步骤

1. **配置环境变量**
   - 登录CloudBase控制台
   - 进入对应环境的设置页面
   - 在"环境变量"部分添加上述配置

2. **部署应用**
   ```bash
   tcb framework deploy
   ```

3. **验证部署**
   - 访问 `https://your-domain/health` 检查服务状态
   - 访问 `https://your-domain/api/ocr-handwriting/health` 检查手写体识别服务

## 安全注意事项

- ⚠️ **永远不要**将真实的API Key或AccessKey提交到Git仓库
- 🔒 所有敏感配置都应通过CloudBase控制台的环境变量功能配置
- 🔍 定期检查和轮换API密钥