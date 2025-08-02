# 岁阅 - AI回忆录写作平台

[![CloudBase](https://img.shields.io/badge/CloudBase-Deployed-brightgreen)](https://console.cloud.tencent.com/tcb)
[![Next.js](https://img.shields.io/badge/Next.js-15.4.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

> 让每一段人生故事都值得被记录传承

## ✨ 功能特色

### 🔐 智能登录系统
- CloudBase v2 短信验证码登录/注册
- 安全的用户认证和会话管理
- 支持手机号快速注册

### 📝 AI辅助写作
- 集成通义千问大语言模型
- 智能文本润色和续写
- 语音转文字功能
- 口语化内容自动优化

### 🖼️ 智能照片管理
- 拖拽上传照片
- OCR文字识别
- 照片智能分类和管理
- 支持批量处理

### 📖 专业编辑器
- TipTap富文本编辑器
- 实时协作编辑
- 章节管理系统
- 字数统计和进度跟踪

### 📱 响应式设计
- 移动端完美适配
- 现代化UI设计
- 流畅的用户体验

## 🛠️ 技术栈

### 前端框架
- **Next.js 15.4.4** - React全栈框架
- **TypeScript** - 类型安全的JavaScript
- **Tailwind CSS** - 原子化CSS框架

### 后端服务
- **CloudBase v2** - 腾讯云开发平台
  - 身份验证 (SMS登录)
  - 云数据库 (用户和项目数据)
  - 云存储 (照片和文件)
  - 云函数 (AI服务)

### 核心组件
- **TipTap** - 富文本编辑器
- **React Dropzone** - 文件上传
- **通义千问** - AI写作助手

## 🚀 快速开始

### 1. 环境准备

```bash
# 克隆仓库
git clone https://github.com/nightwatcher1982/suiyue-memoir.git
cd suiyue-memoir

# 安装依赖
npm install
```

### 2. 环境配置

创建 `.env.local` 文件：

```bash
# CloudBase配置
NEXT_PUBLIC_CLOUDBASE_ENV_ID=suiyue-memoir-dev-3e9aoud20837ef

# AI服务配置（可选）
DASHSCOPE_API_KEY=your_dashscope_api_key
```

### 3. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用。

## 📦 部署指南

### CloudBase 容器化部署

1. **安装CloudBase CLI**
```bash
npm install -g @cloudbase/cli
```

2. **登录CloudBase**
```bash
tcb login
```

3. **部署到CloudBase**
```bash
npm run deploy
```

### Docker 部署

```bash
# 构建镜像
docker build -t suiyue-memoir .

# 运行容器
docker run -p 3000:3000 suiyue-memoir
```

详细部署说明请参考 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 🔧 配置说明

### CloudBase 配置

项目已配置CloudBase Framework，支持：
- 自动构建和部署
- 容器化运行环境
- 环境变量管理
- 域名和SSL证书

### 短信登录配置

在CloudBase控制台配置：
1. 开通「身份验证」→「手机号登录」
2. 设置短信模板和签名
3. 配置发送频率限制

详细配置请参考 [CLOUDBASE_SMS_SETUP.md](./CLOUDBASE_SMS_SETUP.md)

## 🧪 测试功能

### 开发测试页面
- `/test-sms` - 短信登录测试
- `/test-debug` - CloudBase连接测试
- `/test-ocr` - OCR功能测试

### 功能测试
```bash
# 运行类型检查
npm run type-check

# 运行ESLint
npm run lint

# 构建项目
npm run build
```

## 📚 文档

- [功能特性介绍](./FEATURE_DEMO.md)
- [CloudBase集成指南](./CLOUDBASE_SETUP.md)
- [部署完整指南](./DEPLOYMENT_GUIDE.md)
- [测试指南](./TESTING_GUIDE.md)

## 🤝 贡献指南

1. Fork 这个仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开一个 Pull Request

## 📄 许可证

这个项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - 优秀的React框架
- [CloudBase](https://cloud.tencent.com/product/tcb) - 腾讯云开发平台
- [TipTap](https://tiptap.dev/) - 现代富文本编辑器
- [Tailwind CSS](https://tailwindcss.com/) - 原子化CSS框架

---

## 📱 在线体验

🔗 **部署地址**: `https://suiyue-memoir-dev-3e9aoud20837ef.tcloudbaseapp.com`

### 测试账号
- 手机号: `13800138000`
- 验证码: `123456`

---

<div align="center">

**让每一段人生故事都值得被记录传承** ❤️

Made with ❤️ using [Claude Code](https://claude.ai/code)

</div>