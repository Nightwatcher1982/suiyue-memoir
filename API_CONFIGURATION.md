# 🔧 API服务配置指南

## 📖 概述

本项目集成了以下AI和OCR服务：
- **通义千问AI** - 文本润色、扩写、总结等功能
- **阿里云OCR** - 图片文字识别功能

## 🤖 通义千问AI配置

### 1. 获取API Key
1. 访问 [阿里云DashScope控制台](https://dashscope.console.aliyun.com/)
2. 注册/登录阿里云账号
3. 开通DashScope服务
4. 创建API Key

### 2. 当前配置
- **API Key**: `sk-****` ✅ 已配置
- **模型**: `qwen-turbo`
- **功能**: 文本润色、扩写、总结

### 3. 功能特性
- 💬 智能对话助手
- ✍️ 文本润色和优化
- 📝 内容扩写和丰富
- 📊 文本总结和提炼

## 📄 阿里云OCR配置

### 1. 服务开通
1. 访问 [阿里云OCR控制台](https://oci.console.aliyun.com/)
2. 开通OCR文字识别服务
3. 选择合适的套餐（建议按量付费）

### 2. 获取访问密钥
1. 访问 [RAM访问控制](https://ram.console.aliyun.com/)
2. 创建AccessKey
3. 记录AccessKey ID和AccessKey Secret

### 3. 配置环境变量
在CloudBase控制台或环境变量中添加：
```bash
ALIBABA_ACCESS_KEY_ID=your_access_key_id
ALIBABA_ACCESS_KEY_SECRET=your_access_key_secret
```

### 4. 功能特性
- 📸 通用文字识别
- 🇨🇳 中英文混合识别
- ✍️ 手写文字识别
- 📊 表格文字识别

## 🔧 CloudBase环境变量配置

在CloudBase控制台中配置以下环境变量：

```bash
# 基础配置
NEXT_PUBLIC_CLOUDBASE_ENV_ID=suiyue-memoir-dev-3e9aoud20837ef
NODE_ENV=production

# AI服务
QIANWEN_API_KEY=your_dashscope_api_key

# OCR服务（可选）
ALIBABA_ACCESS_KEY_ID=your_access_key_id
ALIBABA_ACCESS_KEY_SECRET=your_access_key_secret
```

## 📊 API使用情况

### 通义千问API
- **状态**: ✅ 已配置并可用
- **请求地址**: `/api/ai`
- **支持功能**: 润色、扩写、总结、对话

### 阿里云OCR API
- **状态**: ⚠️ 需要配置密钥
- **请求地址**: `/api/ocr`
- **当前模式**: 模拟模式（未配置真实密钥时）

## 🚀 部署配置

### 方式1：CloudBase环境变量
1. 登录CloudBase控制台
2. 进入环境管理 → 环境变量
3. 添加上述环境变量

### 方式2：代码配置
环境变量已在 `cloudbaserc.json` 中预配置，部署时自动生效。

## 💰 费用说明

### 通义千问API
- **计费方式**: 按Token计费
- **参考价格**: 约0.002元/1K tokens
- **建议**: 设置合理的调用限制

### 阿里云OCR
- **计费方式**: 按次计费
- **参考价格**: 约0.001-0.01元/次
- **建议**: 开通按量付费，根据使用量调整

## 🔒 安全建议

1. **API Key安全**
   - 不要在代码中硬编码API Key
   - 使用环境变量管理密钥
   - 定期轮换API Key

2. **访问控制**
   - 设置API调用频率限制
   - 监控异常调用行为
   - 及时查看账单和使用量

3. **错误处理**
   - 实现优雅的降级机制
   - 提供备用响应方案
   - 记录详细的错误日志

## 📞 技术支持

如果遇到配置问题：

1. **查看控制台日志**
2. **检查环境变量配置**
3. **验证API Key有效性**
4. **联系对应服务商技术支持**

---

✅ **当前状态**: 通义千问AI已配置，OCR服务等待密钥配置
🚀 **建议**: 优先配置阿里云OCR以获得完整功能体验