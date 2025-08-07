# 🔐 GitHub Secrets 配置指南

## 概述

为了确保CI/CD流程正常工作，需要在GitHub仓库中配置以下Secrets。

## 配置步骤

1. 访问GitHub仓库：`https://github.com/Nightwatcher1982/suiyue-memoir`
2. 进入 `Settings` > `Secrets and variables` > `Actions`
3. 点击 `New repository secret` 添加以下配置：

## 必需的Secrets

### CloudBase基础配置
```
CLOUDBASE_ENV_ID=suiyue-memoir-dev-3e9aoud20837ef
TENCENT_SECRET_ID=您的腾讯云SecretId
TENCENT_SECRET_KEY=您的腾讯云SecretKey
```

### AI服务配置
```
TONGYI_ACCESS_KEY_ID=sk-****（您的通义千问API Key）
```

### 阿里云服务配置
```
ALIBABA_ACCESS_KEY_ID=LTAI****（您的阿里云Access Key ID）
ALIBABA_ACCESS_KEY_SECRET=****（您的阿里云Access Key Secret）
```

### 语音服务配置（可选）
```
XFYUN_APP_ID=****（科大讯飞应用ID）
XFYUN_API_SECRET=****（科大讯飞API Secret）
XFYUN_API_KEY=****（科大讯飞API Key）
```

## Secret说明

### 🔑 CLOUDBASE_ENV_ID
- **用途**: CloudBase环境标识
- **值**: `suiyue-memoir-dev-3e9aoud20837ef`
- **必需**: ✅ 是

### 🔑 TENCENT_SECRET_ID & TENCENT_SECRET_KEY
- **用途**: 腾讯云API访问凭证
- **获取**: [腾讯云控制台 > CAM > API密钥管理](https://console.cloud.tencent.com/cam/capi)
- **必需**: ✅ 是
- **权限**: 需要CloudBase相关权限

### 🔑 TONGYI_ACCESS_KEY_ID
- **用途**: 通义千问AI服务API Key
- **获取**: [阿里云DashScope控制台](https://dashscope.console.aliyun.com/)
- **必需**: ✅ 是（OCR、AI助手功能）
- **格式**: `sk-****`

### 🔑 ALIBABA_ACCESS_KEY_ID & ALIBABA_ACCESS_KEY_SECRET
- **用途**: 阿里云服务访问凭证
- **获取**: [阿里云控制台 > AccessKey管理](https://ram.console.aliyun.com/manage/ak)
- **必需**: ✅ 是（OCR功能）

### 🔑 XFYUN_*
- **用途**: 科大讯飞语音服务
- **获取**: [讯飞开放平台](https://www.xfyun.cn/)
- **必需**: ⚠️ 可选（语音识别功能）

## 验证配置

配置完成后，推送代码到main分支会自动触发CI/CD流程：

1. **代码质量检查**: ESLint、TypeScript检查
2. **环境变量验证**: 验证所有必需的Secrets是否配置
3. **构建测试**: 验证项目可以正常构建
4. **部署**: 自动部署到CloudBase
5. **健康检查**: 验证部署是否成功

## 故障排除

### ❌ 环境变量验证失败
```
❌ NEXT_PUBLIC_CLOUDBASE_ENV_ID 未设置
```
**解决方法**: 检查Secret名称是否为 `CLOUDBASE_ENV_ID`

### ❌ 构建失败
```
❌ Build failed
```
**解决方法**: 检查所有API服务的Secrets是否正确配置

### ❌ 部署失败
```
❌ Deploy failed
```
**解决方法**: 检查腾讯云API密钥权限和CloudBase环境ID

## 安全注意事项

1. **永远不要在代码中硬编码API密钥**
2. **定期轮换API密钥**
3. **最小权限原则**: 只授予必要的权限
4. **监控使用**: 定期检查API密钥使用情况

## 联系支持

如果遇到配置问题，请：
1. 检查GitHub Actions日志
2. 验证Secret名称和值
3. 确认API密钥权限
4. 查看CloudBase控制台状态

---

**配置完成后，每次推送到main分支都会自动部署到CloudBase！** 🚀