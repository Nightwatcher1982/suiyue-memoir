/**
 * 通义千问 DashScope API 客户端
 * 官方文档: https://help.aliyun.com/zh/dashscope/
 */

interface DashScopeConfig {
  apiKey: string;
  baseURL?: string;
}

interface DashScopeMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DashScopeRequest {
  model: string;
  input: {
    messages: DashScopeMessage[];
  };
  parameters?: {
    result_format?: 'text' | 'message';
    temperature?: number;
    top_p?: number;
    top_k?: number;
    max_tokens?: number;
    stop?: string[];
    seed?: number;
    repetition_penalty?: number;
  };
}

interface DashScopeResponse {
  output: {
    text?: string;
    choices?: Array<{
      message: {
        role: string;
        content: string;
      };
    }>;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  request_id: string;
}

export class DashScopeClient {
  private config: DashScopeConfig;

  constructor(config: DashScopeConfig) {
    this.config = {
      baseURL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      ...config,
    };
  }

  /**
   * 调用通义千问API
   */
  async chat(request: DashScopeRequest): Promise<DashScopeResponse> {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-DashScope-SSE': 'disable', // 禁用流式输出
    };

    const response = await fetch(this.config.baseURL!, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DashScope API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.code && data.code !== '200') {
      throw new Error(`DashScope API error: ${data.code} - ${data.message}`);
    }

    return data;
  }

  /**
   * 文本润色专用方法
   */
  async polishText(
    text: string,
    style: 'formal' | 'casual' | 'literary' | 'memoir' = 'memoir',
    tone: 'warm' | 'professional' | 'intimate' | 'nostalgic' = 'warm'
  ): Promise<string> {
    const stylePrompts = {
      formal: '正式书面语',
      casual: '轻松随意的语言',
      literary: '富有文学色彩的表达',
      memoir: '适合回忆录的温馨叙述风格'
    };

    const tonePrompts = {
      warm: '温暖亲切',
      professional: '专业严谨',
      intimate: '亲密真诚',
      nostalgic: '怀旧深情'
    };

    const systemPrompt = `你是一位专业的文本润色助手，专门帮助用户优化回忆录内容。请将用户提供的文本进行润色，要求：
1. 保持原意不变
2. 使用${stylePrompts[style]}的写作风格
3. 语调${tonePrompts[tone]}
4. 适合中老年读者阅读
5. 增强文本的感染力和可读性
6. 保留重要的细节和情感表达
7. 修正语法错误和表达不当之处

请直接返回润色后的文本，不要添加解释或其他内容。`;

    const request: DashScopeRequest = {
      model: 'qwen-turbo',
      input: {
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: text
          }
        ]
      },
      parameters: {
        result_format: 'message',
        temperature: 0.7,
        top_p: 0.8,
        max_tokens: 2000
      }
    };

    const response = await this.chat(request);
    
    if (response.output.choices && response.output.choices.length > 0) {
      return response.output.choices[0].message.content;
    }
    
    throw new Error('No response from DashScope API');
  }

  /**
   * 内容续写专用方法
   */
  async continueWriting(
    context: string,
    requirement?: string
  ): Promise<string> {
    const systemPrompt = `你是一位专业的回忆录写作助手。请根据用户提供的上下文，自然地续写内容。要求：
1. 保持写作风格一致
2. 内容要真实可信，符合回忆录特点
3. 语言温馨感人，适合家庭阅读
4. 续写长度约100-200字
5. 自然衔接，不突兀
6. 富有情感色彩和细节描写

${requirement ? `特别要求：${requirement}` : ''}

请直接返回续写的内容，不要添加解释。`;

    const request: DashScopeRequest = {
      model: 'qwen-turbo',
      input: {
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `请为以下内容续写：\n\n${context}`
          }
        ]
      },
      parameters: {
        result_format: 'message',
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: 500
      }
    };

    const response = await this.chat(request);
    
    if (response.output.choices && response.output.choices.length > 0) {
      return response.output.choices[0].message.content;
    }
    
    throw new Error('No response from DashScope API');
  }

  /**
   * 生成访谈问题
   */
  async generateInterviewQuestions(
    topic: string,
    context?: string
  ): Promise<string[]> {
    const systemPrompt = `你是一位专业的回忆录采访助手。请根据用户提供的话题，生成5-8个深入而有意义的访谈问题。要求：
1. 问题要能激发深度回忆
2. 适合中老年人回答
3. 问题之间有逻辑关联
4. 能够挖掘细节和情感
5. 语言亲切自然
6. 避免过于私人或敏感的问题

请以JSON数组格式返回问题列表，每个问题为一个字符串。`;

    const contextText = context ? `\n\n相关背景：${context}` : '';

    const request: DashScopeRequest = {
      model: 'qwen-turbo',
      input: {
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `话题：${topic}${contextText}`
          }
        ]
      },
      parameters: {
        result_format: 'message',
        temperature: 0.7,
        top_p: 0.8,
        max_tokens: 800
      }
    };

    const response = await this.chat(request);
    
    if (response.output.choices && response.output.choices.length > 0) {
      const content = response.output.choices[0].message.content;
      
      try {
        // 尝试解析JSON
        const questions = JSON.parse(content);
        if (Array.isArray(questions)) {
          return questions;
        }
      } catch {
        // 如果JSON解析失败，尝试从文本中提取问题
        const lines = content.split('\n').filter(line => line.trim());
        const questions = lines
          .filter(line => line.includes('？') || line.includes('?'))
          .map(line => line.replace(/^\d+\.?\s*/, '').trim())
          .slice(0, 8);
        
        if (questions.length > 0) {
          return questions;
        }
      }
    }
    
    throw new Error('Failed to generate interview questions');
  }

  /**
   * 内容扩写
   */
  async expandContent(
    text: string,
    direction: 'detail' | 'emotion' | 'background' | 'dialogue'
  ): Promise<string> {
    const directionPrompts = {
      detail: '增加具体的细节描写，包括环境、人物外貌、动作等细节',
      emotion: '深入挖掘和表达情感层面的内容，增强感染力',
      background: '补充时代背景、社会环境等相关背景信息',
      dialogue: '添加对话内容，使叙述更加生动有趣'
    };

    const systemPrompt = `你是一位专业的回忆录写作助手。请根据用户提供的文本，按照指定方向进行扩写。要求：
1. ${directionPrompts[direction]}
2. 保持原文的主要内容和观点不变
3. 扩写内容要自然融入，不突兀
4. 语言风格温馨感人，适合回忆录
5. 扩写后总长度增加50%-100%
6. 内容要真实可信

请返回扩写后的完整文本。`;

    const request: DashScopeRequest = {
      model: 'qwen-turbo',
      input: {
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `请对以下文本进行"${direction}"方向的扩写：\n\n${text}`
          }
        ]
      },
      parameters: {
        result_format: 'message',
        temperature: 0.7,
        top_p: 0.8,
        max_tokens: 1500
      }
    };

    const response = await this.chat(request);
    
    if (response.output.choices && response.output.choices.length > 0) {
      return response.output.choices[0].message.content;
    }
    
    throw new Error('No response from DashScope API');
  }
}

// 创建默认实例
let dashScopeClient: DashScopeClient | null = null;

export function getDashScopeClient(): DashScopeClient {
  if (!dashScopeClient) {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    
    if (!apiKey) {
      throw new Error('DASHSCOPE_API_KEY environment variable is not set');
    }
    
    dashScopeClient = new DashScopeClient({ apiKey });
  }
  
  return dashScopeClient;
}