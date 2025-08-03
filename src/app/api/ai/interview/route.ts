import { NextRequest, NextResponse } from 'next/server';

// 通义千问API配置
const QIANWEN_API_KEY = process.env.DASHSCOPE_API_KEY || 
                       process.env.TONGYI_ACCESS_KEY_ID || 
                       process.env.QIANWEN_API_KEY;
const QIANWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 AI访谈问题生成 API 被调用');
    
    const body = await request.json();
    const { topic, context } = body;
    
    if (!topic) {
      return NextResponse.json(
        { error: '缺少主题内容' },
        { status: 400 }
      );
    }

    console.log('💬 访谈问题生成请求:', { topic, context: context?.substring(0, 100) });

    // 检查API密钥配置
    if (!QIANWEN_API_KEY) {
      console.warn('⚠️ 通义千问API密钥未配置，使用模拟响应');
      const fallbackResponse = generateMockInterviewQuestions(topic);
      return NextResponse.json({
        success: true,
        data: {
          suggestions: fallbackResponse
        },
        timestamp: new Date().toISOString(),
        fallback: true,
        reason: 'API密钥未配置'
      });
    }

    // 生成访谈问题系统提示词
    const systemPrompt = getInterviewSystemPrompt();
    const userPrompt = `主题：${topic}${context ? `\n背景：${context}` : ''}`;
    
    // 调用通义千问API
    const aiResponse = await callQianWenAPI(systemPrompt, userPrompt);

    console.log('✅ 访谈问题生成完成');
    
    // 尝试解析AI返回的问题列表
    const questions = parseQuestionsFromResponse(aiResponse);
    
    return NextResponse.json({
      success: true,
      data: {
        suggestions: questions
      },
      topic,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 访谈问题生成 API错误:', error);
    
    // 如果API调用失败，返回模拟响应
    const { topic } = await request.json().catch(() => ({ topic: '' }));
    const fallbackQuestions = generateMockInterviewQuestions(topic);
    
    return NextResponse.json({
      success: true,
      data: {
        suggestions: fallbackQuestions
      },
      topic,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
}

async function callQianWenAPI(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch(QIANWEN_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${QIANWEN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen-turbo',
      input: {
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ]
      },
      parameters: {
        temperature: 0.7,
        max_tokens: 1500,
        top_p: 0.8
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('通义千问API错误:', response.status, errorData);
    throw new Error(`通义千问API调用失败: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.output && data.output.text) {
    return data.output.text;
  }
  
  throw new Error('通义千问API返回格式异常');
}

function getInterviewSystemPrompt(): string {
  return `你是一个专业的回忆录访谈专家，专门帮助用户挖掘和整理人生回忆。

请根据用户提供的主题和背景，生成一系列深度访谈问题，帮助用户回忆和记录人生经历：

1. 问题要具体而有启发性
2. 能够引导用户回忆具体的事件和细节
3. 涵盖情感、感受、学习和成长
4. 适合不同年龄段的用户
5. 问题要循序渐进，从浅入深
6. 每个问题都要有助于丰富回忆录内容
7. 语言要温和、亲切、容易理解

请生成8-10个相关问题，用数字编号列出。每个问题要简洁明了，能够激发回忆。`;
}

function parseQuestionsFromResponse(response: string): string[] {
  // 尝试从AI响应中提取问题列表
  const lines = response.split('\n').filter(line => line.trim());
  const questions: string[] = [];
  
  for (const line of lines) {
    // 匹配数字开头的行
    const match = line.match(/^\s*(\d+\.?\s*)(.*)/);
    if (match && match[2].trim()) {
      questions.push(match[2].trim());
    }
  }
  
  // 如果没有解析到问题，返回整个响应作为单个问题
  if (questions.length === 0) {
    return [response.trim()];
  }
  
  return questions.slice(0, 10); // 最多返回10个问题
}

function generateMockInterviewQuestions(topic: string): string[] {
  const generalQuestions = [
    `关于"${topic}"这个话题，您最深刻的记忆是什么？`,
    `在${topic}方面，有哪些人对您产生了重要影响？`,
    `回想起与${topic}相关的经历，您当时的感受是怎样的？`,
    `在${topic}这件事上，您学到了什么重要的人生道理？`,
    `如果重新选择，您在${topic}方面会有不同的做法吗？`,
    `${topic}这段经历如何改变了您的人生轨迹？`,
    `您希望后辈从您的${topic}经历中学到什么？`,
    `回顾${topic}，哪些细节至今仍然历历在目？`
  ];

  // 根据不同主题生成更具体的问题
  const specificQuestions = getTopicSpecificQuestions(topic);
  
  return [...specificQuestions, ...generalQuestions].slice(0, 8);
}

function getTopicSpecificQuestions(topic: string): string[] {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('童年') || topicLower.includes('小时候')) {
    return [
      '您童年时最喜欢的游戏或玩具是什么？',
      '童年时家里的生活条件是怎样的？',
      '您还记得第一天上学的情景吗？'
    ];
  }
  
  if (topicLower.includes('工作') || topicLower.includes('职业')) {
    return [
      '您的第一份工作是什么？当时的心情如何？',
      '工作中遇到过什么特别的挑战？',
      '哪位同事或领导给您留下深刻印象？'
    ];
  }
  
  if (topicLower.includes('家庭') || topicLower.includes('父母')) {
    return [
      '您的父母是什么样的人？',
      '家里有什么特别的传统或习惯？',
      '您从家庭中继承了哪些珍贵的品质？'
    ];
  }
  
  return [
    `${topic}给您的生活带来了什么变化？`,
    `在${topic}过程中，您印象最深的是什么？`,
    `${topic}让您明白了什么道理？`
  ];
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}