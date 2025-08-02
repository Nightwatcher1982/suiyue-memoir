# Phase 1: 基础服务集成指南

**目标：** 完成CloudBase数据库、认证、存储的真实集成  
**预计时间：** 1-2周  
**当前进度：** 🚧 进行中

---

## ✅ 已完成的准备工作

### 1. 环境配置
- ✅ CloudBase环境已创建并运行正常
- ✅ 环境变量已配置 (`.env.local`)
- ✅ SDK配置文件已更新 (`src/lib/cloudbase/config.ts`)

### 2. 核心服务类
- ✅ 数据库服务 (`src/lib/cloudbase/database.ts`)
- ✅ 存储服务 (`src/lib/cloudbase/storage.ts`)
- ✅ 认证Hook (`src/hooks/useAuthReal.ts`)

---

## 🔧 接下来的集成步骤

### Step 1: 替换用户认证系统

#### 1.1 更新LoginModal组件
需要修改 `src/components/auth/LoginModal.tsx`：

```typescript
// 替换模拟登录为真实CloudBase认证
import { useAuthReal } from '@/hooks/useAuthReal';

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { loginWithPhone, sendVerificationCode, loginWithWechat, loading } = useAuthReal();
  
  // 实现真实的验证码发送和登录逻辑
}
```

#### 1.2 更新主要页面的认证检查
- `src/app/dashboard/page.tsx`
- `src/app/editor/[projectId]/page.tsx`

```typescript
// 替换useAuth为useAuthReal
import { useAuthReal } from '@/hooks/useAuthReal';
```

### Step 2: 替换数据持久化

#### 2.1 更新Dashboard页面
修改 `src/app/dashboard/page.tsx`：

```typescript
import { databaseService } from '@/lib/cloudbase/database';

// 替换模拟数据获取
const loadUserProjects = async () => {
  if (!user) return;
  
  try {
    const projects = await databaseService.getUserProjects(user.id);
    setProjects(projects);
  } catch (error) {
    console.error('加载项目失败:', error);
  }
};

// 替换模拟项目创建
const handleCreateProject = async (projectData) => {
  try {
    const projectId = await databaseService.createProject({
      ...projectData,
      userId: user.id,
    });
    
    // 刷新项目列表
    await loadUserProjects();
  } catch (error) {
    console.error('创建项目失败:', error);
  }
};
```

#### 2.2 更新编辑器页面
修改 `src/app/editor/[projectId]/page.tsx`：

```typescript
import { databaseService } from '@/lib/cloudbase/database';

// 替换模拟数据加载
const loadProjectData = async () => {
  try {
    const project = await databaseService.getProjectById(projectId);
    const chapters = await databaseService.getProjectChapters(projectId);
    
    setProject(project);
    setChapters(chapters);
  } catch (error) {
    console.error('加载项目数据失败:', error);
  }
};

// 替换模拟章节保存
const saveChapterContent = async (chapterId: string, content: string) => {
  try {
    await databaseService.updateChapter(chapterId, { content });
    setSaveStatus('saved');
  } catch (error) {
    console.error('保存章节失败:', error);
    setSaveStatus('error');
  }
};
```

### Step 3: 替换文件上传系统

#### 3.1 更新PhotoUpload组件
修改 `src/components/editor/PhotoUpload.tsx`：

```typescript
import { storageService } from '@/lib/cloudbase/storage';
import { databaseService } from '@/lib/cloudbase/database';

const handleFileUpload = async (file: File) => {
  try {
    setUploading(true);
    
    // 压缩图片 (如果需要)
    const compressedFile = await storageService.compressImage(file);
    
    // 上传到云存储
    const uploadResult = await storageService.uploadPhoto(compressedFile, user.id, chapterId);
    
    // 保存图片信息到数据库
    const photoId = await databaseService.createPhoto({
      chapterId,
      fileName: uploadResult.fileName,
      fileSize: uploadResult.fileSize,
      fileId: uploadResult.fileId,
      url: uploadResult.downloadUrl,
    });
    
    // 回调给父组件
    onPhotoUpload(uploadResult.downloadUrl, compressedFile);
    
  } catch (error) {
    console.error('上传失败:', error);
    setError(error.message);
  } finally {
    setUploading(false);
  }
};
```

#### 3.2 更新VoiceRecorder组件
修改 `src/components/ai/VoiceRecorder.tsx`：

```typescript
import { storageService } from '@/lib/cloudbase/storage';
import { databaseService } from '@/lib/cloudbase/database';

const handleRecordingComplete = async (audioBlob: Blob, transcript: string) => {
  try {
    // 上传音频文件
    const uploadResult = await storageService.uploadAudio(audioBlob, user.id, chapterId);
    
    // 保存音频记录到数据库
    const audioId = await databaseService.createAudioRecording({
      chapterId,
      fileName: uploadResult.fileName,
      fileSize: uploadResult.fileSize,
      fileId: uploadResult.fileId,
      url: uploadResult.downloadUrl,
      transcript,
      duration: recordingTime,
    });
    
    // 回调给父组件
    onTranscription(transcript);
    onAudioSave?.(audioBlob, transcript);
    
  } catch (error) {
    console.error('保存录音失败:', error);
  }
};
```

---

## 📋 集成检查清单

### 用户认证集成
- [ ] 更新 `LoginModal` 组件使用真实认证
- [ ] 配置CloudBase控制台的手机号登录
- [ ] 配置短信服务 (可选，测试时可用固定验证码)
- [ ] 测试登录/注册流程
- [ ] 测试登录状态持久化

### 数据库集成
- [ ] 更新Dashboard页面数据加载
- [ ] 更新编辑器页面数据保存
- [ ] 更新章节管理功能
- [ ] 配置数据库安全规则
- [ ] 测试数据CRUD操作

### 存储集成
- [ ] 更新图片上传功能
- [ ] 更新音频上传功能
- [ ] 配置存储权限和CORS
- [ ] 测试文件上传和访问

---

## 🧪 测试验证步骤

### 1. 认证功能测试
```bash
# 测试步骤：
1. 访问 http://localhost:3000/dashboard
2. 应该显示登录提示
3. 输入手机号：13800138000
4. 输入验证码：123456 (CloudBase测试验证码)
5. 验证登录成功，用户信息正确显示
```

### 2. 数据持久化测试
```bash
# 测试步骤：
1. 登录后创建新项目
2. 进入编辑器页面
3. 创建新章节并输入内容
4. 刷新页面验证数据不丢失
5. 检查CloudBase控制台数据是否正确保存
```

### 3. 文件上传测试
```bash
# 测试步骤：
1. 在编辑器中上传图片
2. 录制语音并保存
3. 检查文件是否上传到CloudBase存储
4. 验证文件URL可正常访问
```

---

## 🚨 常见问题和解决方案

### 问题1: CloudBase连接失败
```
Error: CloudBase Environment not found
```
**解决方案：**
- 检查环境ID是否正确
- 确认环境状态为"正常"
- 验证API密钥权限

### 问题2: 权限验证失败
```
Error: Permission denied
```
**解决方案：**
- 配置数据库安全规则
- 确保用户已正确登录
- 检查数据操作权限

### 问题3: 文件上传失败
```
Error: Upload timeout
```
**解决方案：**
- 检查文件大小限制
- 验证CORS配置
- 确认存储服务已开启

---

## 📈 性能监控

### 关键指标
- **数据库查询响应时间** < 1秒
- **文件上传成功率** > 95%
- **用户登录成功率** > 98%

### 监控方法
```typescript
// 添加性能监控代码
const startTime = Date.now();
await databaseService.createProject(data);
const duration = Date.now() - startTime;
console.log(`项目创建耗时: ${duration}ms`);
```

---

## 🎯 完成标志

当以下所有功能都正常工作时，Phase 1 完成：

- ✅ 用户可以使用手机号正常登录
- ✅ 项目和章节数据真实保存到CloudBase
- ✅ 图片和音频文件成功上传到云存储
- ✅ 所有数据在页面刷新后保持持久化
- ✅ 多设备间数据同步正常

**下一阶段：** Phase 2 - AI服务集成 (通义千问、语音识别等)

---

**准备开始第一步了吗？建议按顺序逐步完成，确保每个功能都经过充分测试！** 🚀 