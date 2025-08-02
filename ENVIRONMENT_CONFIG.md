# 环境变量配置指南

## 📋 必需配置

请在项目根目录创建 `.env.local` 文件，并添加以下配置：

```bash
# 腾讯云 CloudBase 配置
NEXT_PUBLIC_TCB_ENV_ID=suiyue-memoir-dev-3e9aoud20837ef
NEXT_PUBLIC_TCB_REGION=ap-shanghai

# 阿里云通义千问 API 配置（后续配置）
ALIBABA_CLOUD_ACCESS_KEY_ID=
ALIBABA_CLOUD_ACCESS_KEY_SECRET=

# 讯飞语音识别 API 配置 (方言优化，后续配置)
XFYUN_APP_ID=
XFYUN_API_SECRET=
XFYUN_API_KEY=

# NextAuth 配置（后续配置）
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# 微信开放平台配置（后续配置）
WECHAT_APP_ID=
WECHAT_APP_SECRET=

# 支付配置 (后续添加)
# WECHAT_PAY_MERCHANT_ID=
# ALIPAY_APP_ID=
```

## 🚀 创建步骤

1. 在项目根目录（`suiyue-memoir/`）创建文件 `.env.local`
2. 复制上面的配置内容到文件中
3. 保存文件

## ✅ 验证配置

配置完成后，运行以下命令验证：

```bash
npm run dev
```

然后在浏览器控制台中应该能看到 "🎉 CloudBase环境就绪！" 的消息。

## 🔧 后续配置

随着开发进展，我们会逐步添加其他API的配置信息：

- ✅ **CloudBase** - 已配置完成
- ⏳ **通义千问API** - 待配置（AI功能开发时）
- ⏳ **讯飞语音API** - 待配置（语音功能开发时）
- ⏳ **微信登录** - 待配置（认证功能开发时）

## 📊 数据库集合

CloudBase数据库集合将在首次使用时自动创建：

- `users` - 用户信息
- `memoir_projects` - 回忆录项目
- `chapters` - 章节内容
- `photos` - 照片信息
- `audio_recordings` - 语音记录
- `characters` - 人物关系

## 🔍 故障排除

如果遇到连接问题：

1. 确认环境ID正确：`suiyue-memoir-dev-3e9aoud20837ef`
2. 确认地域设置：`ap-shanghai`
3. 检查网络连接
4. 查看浏览器控制台的错误信息 