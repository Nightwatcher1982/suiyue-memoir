# CloudBase 配置指南

## 问题描述
您遇到了 `[PHONE_AUTH_DISABLED] [102013] phone authentication is disabled for the env` 错误，这表示当前环境中的手机认证功能被禁用了。

## 解决方案

### 1. 启用手机认证功能

1. **登录腾讯云开发控制台**
   - 访问：https://console.cloud.tencent.com/tcb
   - 选择您的项目：`suiyue-memoir-dev-3e9aoud20837ef`

2. **进入认证服务配置**
   - 在左侧菜单中找到 "用户管理" → "登录方式"
   - 或者直接访问：https://console.cloud.tencent.com/tcb/user

3. **启用手机号登录**
   - 找到 "手机号登录" 选项
   - 点击 "启用"
   - 配置短信服务（如果需要）

### 2. 配置短信服务（可选）

如果您需要发送验证码短信：

1. **配置短信服务**
   - 在认证服务中找到 "短信配置"
   - 选择或配置短信服务商
   - 设置短信模板

2. **测试短信发送**
   - 使用测试手机号验证短信发送功能

### 3. 环境变量配置

确保您的 `.env.local` 文件包含正确的环境ID：

```bash
NEXT_PUBLIC_CLOUDBASE_ENV_ID=suiyue-memoir-dev-3e9aoud20837ef
```

### 4. 临时解决方案

如果暂时无法启用手机认证，您可以：

1. **使用微信登录**
   - 微信登录功能通常默认启用
   - 在应用中优先使用微信登录

2. **使用邮箱登录**
   - 在CloudBase控制台启用邮箱登录
   - 修改应用代码支持邮箱登录

3. **开发模式**
   - 在开发环境中使用模拟认证
   - 应用已经配置了模拟认证功能

## 验证配置

1. **重启开发服务器**
   ```bash
   npm run dev
   ```

2. **测试登录功能**
   - 访问应用首页
   - 尝试使用手机号登录
   - 检查控制台是否有错误信息

## 常见问题

### Q: 为什么手机认证被禁用？
A: 这通常是因为：
- 新创建的环境默认禁用某些登录方式
- 安全策略设置
- 短信服务未配置

### Q: 如何快速启用？
A: 最快的方法是：
1. 登录CloudBase控制台
2. 进入用户管理 → 登录方式
3. 启用手机号登录
4. 重启应用

### Q: 开发时如何处理？
A: 应用已经配置了模拟认证，即使CloudBase服务不可用也能正常开发。

## 联系支持

如果问题仍然存在，请：
1. 访问：https://tcb.cloud.tencent.com/dev#/helper/copilot?q=PHONE_AUTH_DISABLED
2. 查看官方文档：https://cloud.tencent.com/document/product/876/46777
3. 联系腾讯云技术支持 