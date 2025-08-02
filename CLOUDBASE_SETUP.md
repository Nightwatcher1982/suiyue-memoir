# 腾讯云CloudBase配置指南

## 1. 创建CloudBase环境

### 步骤一：登录腾讯云控制台
1. 访问 https://console.cloud.tencent.com/tcb
2. 登录您的腾讯云账号
3. 如果首次使用，需要开通CloudBase服务

### 步骤二：创建环境
1. 点击"新建环境"
2. 选择"按量计费"模式（适合开发测试）
3. 环境名称：`suiyue-memoir-dev`
4. 环境ID：记录下来，后续需要配置到环境变量中
5. 地域：选择"上海"（ap-shanghai）

### 步骤三：启用所需服务
在CloudBase控制台中启用以下服务：

#### 数据库
1. 进入"数据库" -> "管理"
2. 点击"启用数据库"
3. 创建以下集合：
   - `users` - 用户信息
   - `memoir_projects` - 回忆录项目
   - `chapters` - 章节内容
   - `photos` - 照片信息
   - `audio_recordings` - 语音记录
   - `characters` - 人物关系

#### 云存储
1. 进入"存储" -> "管理"
2. 点击"启用存储"
3. 创建以下存储桶：
   - `photos/` - 照片文件
   - `audio/` - 语音文件
   - `avatars/` - 头像文件
   - `covers/` - 封面图片

#### 云函数
1. 进入"云函数" -> "管理"
2. 点击"启用云函数"
3. 后续我们会创建以下云函数：
   - `ai-text-process` - AI文本处理
   - `speech-to-text` - 语音转文字
   - `payment-callback` - 支付回调

#### 认证
1. 进入"身份验证" -> "管理"
2. 点击"启用身份验证"
3. 配置登录方式：
   - 启用"手机号密码"
   - 启用"手机号验证码"
   - 启用"微信公众平台"（需要配置微信应用信息）

## 2. 获取配置信息

配置完成后，您需要获取以下信息：

### 基础配置
- **环境ID**: 在控制台概览页面可以看到
- **地域**: ap-shanghai

### API密钥
1. 访问 https://console.cloud.tencent.com/cam/capi
2. 创建或获取现有的API密钥：
   - SecretId
   - SecretKey

## 3. 配置环境变量

将获取的信息配置到项目中：

1. 在项目根目录创建 `.env.local` 文件（基于 `.env.local.example`）
2. 填入您的配置信息：

```env
# 腾讯云 CloudBase 配置
NEXT_PUBLIC_TCB_ENV_ID=your_actual_env_id
NEXT_PUBLIC_TCB_REGION=ap-shanghai

# 其他配置暂时留空，后续逐步配置
ALIBABA_CLOUD_ACCESS_KEY_ID=
ALIBABA_CLOUD_ACCESS_KEY_SECRET=
# ...
```

## 4. 数据库权限配置

为了让前端能够直接访问数据库，需要配置数据库权限：

1. 进入"数据库" -> "权限管理"
2. 为每个集合添加权限规则：

### users集合权限
```json
{
  "read": "auth.uid != null && resource.userId == auth.uid",
  "write": "auth.uid != null && resource.userId == auth.uid"
}
```

### memoir_projects集合权限
```json
{
  "read": "auth.uid != null && resource.userId == auth.uid",
  "write": "auth.uid != null && resource.userId == auth.uid"
}
```

### chapters集合权限
```json
{
  "read": "auth.uid != null && get(`database.memoir_projects.${resource.projectId}`).userId == auth.uid",
  "write": "auth.uid != null && get(`database.memoir_projects.${resource.projectId}`).userId == auth.uid"
}
```

## 5. 存储权限配置

1. 进入"存储" -> "权限管理"
2. 配置上传权限：

```json
{
  "read": true,
  "write": "auth.uid != null && resource.startsWith(auth.uid + '/')"
}
```

## 完成配置后

配置完成后，请：
1. 确认所有服务都已启用
2. 确认权限规则已正确设置
3. 将环境ID和地域信息提供给我，我将更新项目配置
4. 项目将能够连接到CloudBase并开始开发用户认证功能

---

如果遇到任何问题，请参考腾讯云CloudBase官方文档：
https://cloud.tencent.com/document/product/876 