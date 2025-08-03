# CloudBase语音识别云函数配置指南

## 概述
本项目使用CloudBase云函数来实现科大讯飞语音识别功能，所有API配置都存储在云端，支持开发环境和生产环境的统一配置管理。

## 架构说明
```
前端录音 → Next.js API → CloudBase云函数 → 科大讯飞API → 返回识别结果
```

## 部署步骤

### 1. 准备科大讯飞API凭证
1. 访问 [科大讯飞开放平台](https://www.xfyun.cn/)
2. 注册账号并创建应用
3. 获取以下凭证：
   - `APPID`：应用ID
   - `APISecret`：API密钥
   - `APIKey`：API Key

### 2. 部署云函数

使用CloudBase CLI部署云函数：

```bash
# 进入云函数目录
cd functions/voice-recognition

# 安装依赖
npm install

# 部署云函数
tcb functions:deploy voice-recognition
```

### 3. 配置API凭证

有三种方式配置科大讯飞API凭证：

#### 方式一：环境变量（推荐）
在CloudBase控制台中设置云函数环境变量：

```bash
XUNFEI_APP_ID=your_app_id_here
XUNFEI_API_SECRET=your_api_secret_here
XUNFEI_API_KEY=your_api_key_here
```

#### 方式二：数据库配置
在CloudBase数据库中创建配置集合：

```javascript
// 集合名：app_config
{
  "_id": "voice_recognition_config",
  "type": "voice_recognition",
  "provider": "xunfei",
  "appId": "your_app_id_here",
  "apiSecret": "your_api_secret_here",
  "apiKey": "your_api_key_here",
  "createdAt": "2025-08-03T00:00:00.000Z",
  "updatedAt": "2025-08-03T00:00:00.000Z"
}
```

#### 方式三：文件存储配置
上传配置文件到CloudBase文件存储：

```json
// 文件名：voice-recognition-config.json
{
  "xunfei": {
    "appId": "your_app_id_here",
    "apiSecret": "your_api_secret_here",
    "apiKey": "your_api_key_here"
  }
}
```

### 4. 云函数权限配置

确保云函数具有以下权限：
- 数据库读取权限（如使用数据库配置）
- 文件存储读取权限（如使用文件配置）
- 外网访问权限（调用科大讯飞API）

## 文件结构

```
functions/voice-recognition/
├── index.js          # 云函数主文件
├── package.json      # 依赖配置
└── README.md         # 说明文档
```

## 云函数详细说明

### 输入参数
```javascript
{
  "audioData": "base64_encoded_audio_data",
  "audioFormat": "wav"
}
```

### 输出格式
成功响应：
```javascript
{
  "success": true,
  "data": {
    "text": "识别到的文字内容",
    "confidence": 0.95,
    "timestamp": "2025-08-03T00:00:00.000Z",
    "source": "xunfei-cloud-function"
  }
}
```

错误响应：
```javascript
{
  "success": false,
  "error": "错误描述",
  "timestamp": "2025-08-03T00:00:00.000Z",
  "source": "xunfei-cloud-function"
}
```

## 本地开发测试

### 1. 安装CloudBase CLI
```bash
npm install -g @cloudbase/cli
```

### 2. 登录CloudBase
```bash
tcb login
```

### 3. 本地调试云函数
```bash
# 进入云函数目录
cd functions/voice-recognition

# 本地调试
tcb functions:invoke voice-recognition --params '{"audioData":"test_audio_base64","audioFormat":"wav"}'
```

## 监控和日志

### 查看云函数日志
```bash
# 查看实时日志
tcb functions:log voice-recognition

# 查看历史日志
tcb functions:log voice-recognition --start-time 2025-08-03T00:00:00 --end-time 2025-08-03T23:59:59
```

### 监控指标
- 调用次数
- 错误率
- 平均响应时间
- 内存使用情况

## 配置优化建议

### 1. 性能优化
- 云函数内存：建议设置为512MB或更高
- 超时时间：建议设置为30秒
- 并发数限制：根据科大讯飞API限制设置

### 2. 成本优化
- 使用预留实例减少冷启动
- 合理设置内存大小
- 监控调用量，优化免费额度使用

### 3. 安全性
- API密钥定期轮换
- 使用数据库或文件存储而非环境变量存储敏感信息
- 启用访问日志审计

## 故障排查

### 常见问题

1. **云函数调用失败**
   ```bash
   # 检查云函数状态
   tcb functions:list
   
   # 查看详细错误日志
   tcb functions:log voice-recognition
   ```

2. **科大讯飞API调用失败**
   - 检查API凭证是否正确
   - 确认账户余额是否充足
   - 验证网络连接

3. **音频格式不支持**
   - 确认音频为WAV格式
   - 检查采样率是否为16kHz
   - 验证音频数据完整性

### 调试技巧

1. 查看CloudBase控制台的云函数监控
2. 在云函数中添加详细的console.log
3. 使用CloudBase CLI进行本地测试
4. 检查Next.js开发环境的网络请求

## 环境差异说明

### 开发环境
- 使用CloudBase测试环境
- 可以使用模拟数据进行测试
- 支持本地云函数调试

### 生产环境
- 使用CloudBase正式环境
- 所有配置通过云端管理
- 支持高并发和高可用

## 版本管理

### 云函数版本
- 支持多版本部署
- 可以回滚到历史版本
- 支持灰度发布

### 配置版本
- 数据库配置支持历史记录
- 文件配置支持版本管理
- 环境变量变更有审计日志

## 扩展功能

### 1. 实时语音识别
可以扩展为WebSocket实时识别：
- 支持流式音频传输
- 实时返回识别结果
- 支持语音断句

### 2. 多语言支持
- 英文语音识别
- 方言识别
- 多语言混合识别

### 3. 音频预处理
- 降噪处理
- 音量标准化
- 格式转换

## 更新日志

- **v1.0.0**: 初始版本CloudBase云函数实现
- 支持科大讯飞语音识别API
- 三种配置方式：环境变量、数据库、文件存储
- 完善的错误处理和日志记录