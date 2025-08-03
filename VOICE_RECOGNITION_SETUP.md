# 语音识别功能配置指南

## 概述
本项目集成了科大讯飞的语音识别服务，使用CloudBase云函数架构，用于将录制的语音转换为文字，帮助用户更便捷地录入回忆录内容。

## 架构说明
```
前端录音 → Next.js API路由 → CloudBase云函数 → 科大讯飞API → 返回识别结果
```

优势：
- ✅ 统一的云端配置管理
- ✅ 开发和生产环境配置共享
- ✅ 更好的安全性和可维护性
- ✅ 支持高并发和自动扩缩容

## 配置步骤

### 1. 获取科大讯飞API凭证

1. 访问 [科大讯飞开放平台](https://www.xfyun.cn/)
2. 注册账号并登录
3. 进入控制台，创建新应用
4. 选择"语音听写"服务
5. 获取以下三个关键信息：
   - `APPID`：应用ID
   - `APISecret`：API密钥
   - `APIKey`：API Key

### 2. 配置环境变量

在项目根目录的 `.env.local` 文件中添加：

```bash
# 科大讯飞语音识别API配置
XUNFEI_APP_ID=your_app_id_here
XUNFEI_API_SECRET=your_api_secret_here
XUNFEI_API_KEY=your_api_key_here
```

### 3. 重启开发服务器

配置环境变量后，需要重启Next.js开发服务器：

```bash
npm run dev
```

## API接口说明

### 语音识别接口
- **路径**: `/api/voice-recognition`
- **方法**: `POST`
- **格式**: `multipart/form-data`
- **参数**: 
  - `audio`: 音频文件（支持WAV格式）

### 请求示例

```javascript
const formData = new FormData();
formData.append('audio', audioBlob, 'recording.wav');

const response = await fetch('/api/voice-recognition', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.text); // 识别结果
```

### 响应格式

成功响应：
```json
{
  "success": true,
  "text": "识别到的文字内容",
  "confidence": 0.95,
  "timestamp": "2025-08-03T00:00:00.000Z"
}
```

错误响应：
```json
{
  "success": false,
  "error": "错误描述",
  "details": "详细错误信息"
}
```

## 使用说明

### 在组件中使用

```tsx
import { VoiceRecorder } from '@/components/ai/VoiceRecorder';

function MyComponent() {
  const handleTranscription = (text: string) => {
    console.log('识别结果:', text);
  };

  return (
    <VoiceRecorder onTranscriptionComplete={handleTranscription} />
  );
}
```

### 录音流程

1. 点击"开始录音"按钮
2. 浏览器请求麦克风权限
3. 开始录制语音（显示录制时间）
4. 点击"停止录音"结束录制
5. 自动调用科大讯飞API进行语音识别
6. 识别结果通过回调函数返回

## 技术规格

### 音频格式要求
- **采样率**: 16kHz
- **编码**: PCM
- **声道**: 单声道
- **格式**: WAV

### 支持的语言
- 中文（普通话）
- 支持标点符号自动添加
- 支持数字和英文混合识别

### 识别特性
- **实时性**: 录音结束后即时识别
- **准确率**: 在安静环境下可达95%以上
- **置信度**: 返回识别结果的置信度分数
- **错误处理**: 完善的错误处理和降级方案

## 降级方案

当API配置缺失或调用失败时，系统会：

1. 显示友好的错误提示
2. 提供模拟识别结果作为降级方案
3. 记录详细的错误日志便于调试
4. 不会中断用户的正常使用流程

## 故障排查

### 常见问题

1. **"配置缺失"错误**
   - 检查环境变量是否正确设置
   - 确认API凭证是否有效
   - 重启开发服务器

2. **"未识别到语音内容"错误**
   - 检查录音时间是否过短
   - 确认录音环境是否过于嘈杂
   - 检查麦克风设备是否正常

3. **网络请求失败**
   - 检查网络连接
   - 确认科大讯飞服务状态
   - 查看控制台错误日志

### 调试技巧

1. 打开浏览器开发者工具查看控制台日志
2. 检查Network面板中的API请求状态
3. 查看服务器日志中的详细错误信息

## 成本和限制

### 科大讯飞免费额度
- 每日免费识别时长：500分钟
- 超出免费额度后按量计费
- 具体价格请参考科大讯飞官网

### 技术限制
- 单次录音建议不超过60秒
- 支持的音频文件大小限制：10MB
- 识别结果长度限制：1000字符

## 更新日志

- **v1.0.0**: 初始版本，支持基础语音识别功能
- 集成科大讯飞语音听写API
- 支持WAV格式音频识别
- 完善的错误处理和降级方案