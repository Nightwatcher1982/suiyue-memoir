# 岁阅平台真实服务集成计划

**版本：** v1.1.0 - 真实服务集成版  
**目标：** 将所有模拟功能替换为真实的云服务集成

---

## 🎯 当前模拟功能清单

### ❌ 需要替换的模拟功能

1. **用户认证系统** - 目前使用localStorage模拟
2. **数据库操作** - 目前使用localStorage模拟
3. **AI写作服务** - 目前使用mock响应
4. **语音识别** - 目前使用模拟转换
5. **文件上传** - 目前使用模拟上传
6. **PDF导出** - 需要云端处理优化

---

## 🚀 集成优先级和计划

### Phase 1: 基础服务集成 (1-2周)

#### 1.1 腾讯CloudBase数据库集成 ⭐⭐⭐⭐⭐

**当前状态：** 模拟实现  
**目标：** 真实数据库CRUD操作

**步骤：**

1. **环境配置验证**
```bash
# 确认CloudBase环境已创建
npx cloudbase env:list

# 验证数据库服务状态
npx cloudbase database:collection:list -e suiyue-memoir-dev-3e9aoud20837ef
```

2. **数据库集合创建**
```javascript
// 需要创建的集合
const collections = [
  'users',           // 用户信息
  'memoirProjects',  // 回忆录项目
  'chapters',        // 章节内容
  'photos',          // 图片信息
  'audioRecordings', // 音频记录
  'userSessions'     // 用户会话
];
```

3. **更新数据层代码**
```typescript
// src/lib/cloudbase/database.ts - 新建文件
import { cloudbase } from './config';

export class DatabaseService {
  private db = cloudbase.database();

  // 用户相关
  async createUser(userData: User): Promise<string> {
    const result = await this.db.collection('users').add(userData);
    return result.id;
  }

  async getUserById(userId: string): Promise<User | null> {
    const result = await this.db.collection('users').doc(userId).get();
    return result.data as User;
  }

  // 项目相关
  async createProject(projectData: MemoirProject): Promise<string> {
    const result = await this.db.collection('memoirProjects').add(projectData);
    return result.id;
  }

  async getUserProjects(userId: string): Promise<MemoirProject[]> {
    const result = await this.db.collection('memoirProjects')
      .where({ userId: userId })
      .get();
    return result.data as MemoirProject[];
  }

  // 章节相关
  async createChapter(chapterData: Chapter): Promise<string> {
    const result = await this.db.collection('chapters').add(chapterData);
    return result.id;
  }

  async getProjectChapters(projectId: string): Promise<Chapter[]> {
    const result = await this.db.collection('chapters')
      .where({ projectId: projectId })
      .orderBy('order', 'asc')
      .get();
    return result.data as Chapter[];
  }

  async updateChapter(chapterId: string, updates: Partial<Chapter>): Promise<void> {
    await this.db.collection('chapters').doc(chapterId).update({
      ...updates,
      updatedAt: new Date()
    });
  }
}
```

#### 1.2 腾讯CloudBase用户认证集成 ⭐⭐⭐⭐⭐

**当前状态：** localStorage模拟  
**目标：** 真实手机号+微信登录

**步骤：**

1. **CloudBase控制台配置**
```bash
# 开启手机号登录
# 1. 进入CloudBase控制台
# 2. 用户管理 > 登录设置
# 3. 开启"手机号登录"
# 4. 配置短信模板
```

2. **更新认证代码**
```typescript
// src/hooks/useAuth.ts - 更新
import { cloudbase } from '@/lib/cloudbase/config';

export function useAuthReal() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 监听登录状态变化
    cloudbase.auth().onAuthStateChanged((user) => {
      if (user) {
        setUser({
          id: user.uid,
          phone: user.customUserId,
          nickname: user.nickName || '用户',
          // ... 其他用户信息
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  const loginWithPhone = async (phone: string, code: string) => {
    try {
      const result = await cloudbase.auth().signInWithPhoneNumber(phone, code);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const loginWithWechat = async () => {
    try {
      const result = await cloudbase.auth().signInWithProvider('wechat');
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await cloudbase.auth().signOut();
    setUser(null);
  };

  return { user, loading, loginWithPhone, loginWithWechat, logout };
}
```

#### 1.3 腾讯CloudBase存储集成 ⭐⭐⭐⭐

**当前状态：** 模拟上传  
**目标：** 真实文件上传和管理

**步骤：**

1. **存储服务配置**
```typescript
// src/lib/cloudbase/storage.ts - 新建文件
import { cloudbase } from './config';

export class StorageService {
  private storage = cloudbase.storage();

  async uploadPhoto(file: File, userId: string): Promise<string> {
    const fileName = `photos/${userId}/${Date.now()}_${file.name}`;
    
    try {
      const result = await this.storage.uploadFile({
        cloudPath: fileName,
        filePath: file,
      });
      
      // 获取下载URL
      const downloadUrl = await this.storage.getDownloadURL(result.fileID);
      return downloadUrl;
    } catch (error) {
      throw new Error(`上传失败: ${error.message}`);
    }
  }

  async uploadAudio(audioBlob: Blob, userId: string): Promise<string> {
    const fileName = `audio/${userId}/${Date.now()}.webm`;
    
    try {
      const result = await this.storage.uploadFile({
        cloudPath: fileName,
        filePath: audioBlob,
      });
      
      const downloadUrl = await this.storage.getDownloadURL(result.fileID);
      return downloadUrl;
    } catch (error) {
      throw new Error(`音频上传失败: ${error.message}`);
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.storage.deleteFile([fileId]);
  }
}
```

### Phase 2: AI服务集成 (1-2周)

#### 2.1 阿里巴巴通义千问API集成 ⭐⭐⭐⭐⭐

**当前状态：** Mock响应  
**目标：** 真实AI文本处理

**步骤：**

1. **获取API密钥**
```bash
# 1. 访问阿里云控制台
# 2. 开通通义千问服务
# 3. 创建API密钥
# 4. 配置环境变量
```

2. **安装SDK**
```bash
npm install @alicloud/dashscope20230320 @alicloud/openapi-client
```

3. **创建AI服务**
```typescript
// src/lib/ai/tongyi-real.ts - 新建文件
import Dashscope from '@alicloud/dashscope20230320';
import * as OpenApi from '@alicloud/openapi-client';

export class TongyiService {
  private client: Dashscope;

  constructor() {
    const config = new OpenApi.Config({
      accessKeyId: process.env.TONGYI_ACCESS_KEY_ID,
      accessKeySecret: process.env.TONGYI_ACCESS_KEY_SECRET,
      endpoint: 'dashscope.aliyuncs.com',
    });
    this.client = new Dashscope(config);
  }

  async polishText(text: string, style: string = 'warm'): Promise<string> {
    const prompt = `请帮我润色以下回忆录文本，保持${style}的风格，让表达更加生动自然：\n\n${text}`;
    
    const request = new Dashscope.TextGenerationRequest({
      model: 'qwen-plus',
      input: { prompt },
      parameters: {
        temperature: 0.7,
        max_tokens: 2000,
      },
    });

    try {
      const response = await this.client.textGeneration(request);
      return response.body.output.text;
    } catch (error) {
      throw new Error(`AI润色失败: ${error.message}`);
    }
  }

  async continueWriting(context: string, requirement?: string): Promise<string> {
    const prompt = requirement 
      ? `基于以下内容继续写作，要求：${requirement}\n\n内容：${context}`
      : `请基于以下内容自然地继续写作：\n\n${context}`;

    const request = new Dashscope.TextGenerationRequest({
      model: 'qwen-plus',
      input: { prompt },
      parameters: {
        temperature: 0.8,
        max_tokens: 1500,
      },
    });

    try {
      const response = await this.client.textGeneration(request);
      return response.body.output.text;
    } catch (error) {
      throw new Error(`AI续写失败: ${error.message}`);
    }
  }

  async generateInterviewQuestions(topic: string): Promise<string[]> {
    const prompt = `请为回忆录写作生成5个关于"${topic}"的访谈问题，帮助引导回忆：`;

    const request = new Dashscope.TextGenerationRequest({
      model: 'qwen-plus',
      input: { prompt },
      parameters: {
        temperature: 0.6,
        max_tokens: 800,
      },
    });

    try {
      const response = await this.client.textGeneration(request);
      const text = response.body.output.text;
      return text.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      throw new Error(`生成问题失败: ${error.message}`);
    }
  }

  async expandContent(text: string, direction: string): Promise<string> {
    const directionMap = {
      'detail': '添加更多细节描述',
      'emotion': '增强情感表达',
      'background': '补充背景信息',
      'dialogue': '加入对话场景'
    };

    const prompt = `请${directionMap[direction]}来扩展以下文本：\n\n${text}`;

    const request = new Dashscope.TextGenerationRequest({
      model: 'qwen-plus',
      input: { prompt },
      parameters: {
        temperature: 0.7,
        max_tokens: 1800,
      },
    });

    try {
      const response = await this.client.textGeneration(request);
      return response.body.output.text;
    } catch (error) {
      throw new Error(`AI扩写失败: ${error.message}`);
    }
  }
}
```

#### 2.2 语音识别服务集成 ⭐⭐⭐⭐

**当前状态：** 模拟转换  
**目标：** 腾讯ASR + 讯飞API双引擎

**步骤：**

1. **腾讯云ASR集成**
```bash
npm install tencentcloud-sdk-nodejs
```

```typescript
// src/lib/asr/tencent-asr.ts - 新建文件
import * as tencentcloud from "tencentcloud-sdk-nodejs";

export class TencentASRService {
  private client: any;

  constructor() {
    const AsrClient = tencentcloud.asr.v20190614.Client;
    this.client = new AsrClient({
      credential: {
        secretId: process.env.TENCENT_SECRET_ID,
        secretKey: process.env.TENCENT_SECRET_KEY,
      },
      region: "ap-beijing",
    });
  }

  async recognizeAudio(audioData: ArrayBuffer): Promise<string> {
    const base64Audio = Buffer.from(audioData).toString('base64');
    
    const params = {
      EngineModelType: "16k_zh",
      ChannelNum: 1,
      ResTextFormat: 0,
      SourceType: 1,
      Data: base64Audio,
    };

    try {
      const response = await this.client.SentenceRecognition(params);
      return response.Result;
    } catch (error) {
      throw new Error(`语音识别失败: ${error.message}`);
    }
  }
}
```

2. **讯飞API集成**
```typescript
// src/lib/asr/iflytek-asr.ts - 新建文件
export class IflytekASRService {
  private appId: string;
  private apiSecret: string;

  constructor() {
    this.appId = process.env.IFLYTEK_APP_ID!;
    this.apiSecret = process.env.IFLYTEK_API_SECRET!;
  }

  async recognizeDialect(audioData: ArrayBuffer, dialect: string): Promise<string> {
    // 实现讯飞WebSocket API调用
    // 支持方言识别
    const dialectMap = {
      'mandarin': 'zh_cn',
      'cantonese': 'zh_cn_cantonese',
      'sichuanese': 'zh_cn_sichuan',
      // ... 更多方言
    };

    try {
      // WebSocket连接和音频流处理
      const result = await this.connectAndRecognize(audioData, dialectMap[dialect]);
      return result;
    } catch (error) {
      throw new Error(`方言识别失败: ${error.message}`);
    }
  }

  private async connectAndRecognize(audioData: ArrayBuffer, language: string): Promise<string> {
    // 实现WebSocket连接逻辑
    // 这里需要完整的讯飞API实现
    return "识别结果"; // 占位符
  }
}
```

### Phase 3: 云函数和API集成 (1周)

#### 3.1 创建CloudBase云函数

**目标：** 后端逻辑处理

```typescript
// functions/ai-service/index.js - 新建云函数
const { TongyiService } = require('./tongyi-service');

exports.main = async (event, context) => {
  const { action, data } = event;
  const tongyiService = new TongyiService();

  try {
    switch (action) {
      case 'polish':
        const polished = await tongyiService.polishText(data.text, data.style);
        return { success: true, result: polished };
      
      case 'continue':
        const continued = await tongyiService.continueWriting(data.context, data.requirement);
        return { success: true, result: continued };
      
      case 'interview':
        const questions = await tongyiService.generateInterviewQuestions(data.topic);
        return { success: true, result: questions };
      
      case 'expand':
        const expanded = await tongyiService.expandContent(data.text, data.direction);
        return { success: true, result: expanded };
      
      default:
        return { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

#### 3.2 前端API调用更新

```typescript
// src/lib/api/ai-api.ts - 新建文件
import { cloudbase } from '@/lib/cloudbase/config';

export class AIApiService {
  private callFunction = cloudbase.functions();

  async polishText(text: string, style: string = 'warm'): Promise<string> {
    const result = await this.callFunction.callFunction({
      name: 'ai-service',
      data: {
        action: 'polish',
        data: { text, style }
      }
    });

    if (result.result.success) {
      return result.result.result;
    } else {
      throw new Error(result.result.error);
    }
  }

  async continueWriting(context: string, requirement?: string): Promise<string> {
    const result = await this.callFunction.callFunction({
      name: 'ai-service',
      data: {
        action: 'continue',
        data: { context, requirement }
      }
    });

    if (result.result.success) {
      return result.result.result;
    } else {
      throw new Error(result.result.error);
    }
  }

  // ... 其他AI功能
}
```

---

## 🔧 环境变量配置

### 需要添加的环境变量

```bash
# .env.local / .env.production

# 腾讯CloudBase (已有)
NEXT_PUBLIC_CLOUDBASE_ENV_ID=suiyue-memoir-dev-3e9aoud20837ef
CLOUDBASE_SECRET_ID=your_secret_id_here
CLOUDBASE_SECRET_KEY=your_secret_key_here

# 阿里巴巴通义千问 (新增)
TONGYI_ACCESS_KEY_ID=your_tongyi_access_key_id
TONGYI_ACCESS_KEY_SECRET=your_tongyi_access_key_secret

# 腾讯云ASR (新增)
TENCENT_SECRET_ID=your_tencent_secret_id
TENCENT_SECRET_KEY=your_tencent_secret_key

# 讯飞语音 (新增)
IFLYTEK_APP_ID=your_iflytek_app_id
IFLYTEK_API_SECRET=your_iflytek_api_secret
```

---

## 🚀 实施顺序建议

### 第1周：基础服务
1. ✅ CloudBase数据库集成
2. ✅ CloudBase用户认证集成
3. ✅ CloudBase存储集成

### 第2周：AI服务
1. ✅ 通义千问API集成
2. ✅ 腾讯ASR集成
3. ✅ 讯飞方言识别集成

### 第3周：优化和测试
1. ✅ 云函数部署
2. ✅ 性能优化
3. ✅ 完整测试

---

## 📋 验收标准

### 数据库集成
- ✅ 用户数据真实存储
- ✅ 项目和章节数据持久化
- ✅ 数据同步和实时更新

### AI服务集成
- ✅ 文本润色实际效果
- ✅ 智能续写连贯性
- ✅ 访谈问题相关性
- ✅ 内容扩写质量

### 语音识别集成
- ✅ 普通话识别准确率 >90%
- ✅ 方言识别可用性
- ✅ 音频处理稳定性

### 存储集成
- ✅ 图片上传成功率 >99%
- ✅ 音频文件存储稳定
- ✅ CDN加速效果

---

**准备开始集成吗？我建议从数据库集成开始，这是最基础也是最重要的部分！** 🚀 