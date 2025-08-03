import { NextRequest, NextResponse } from 'next/server';

// 通义千问API配置
const QIANWEN_API_KEY = process.env.TONGYI_ACCESS_KEY_ID || 
                       process.env.QIANWEN_API_KEY || 
                       process.env.DASHSCOPE_API_KEY ||
                       'sk-c93c5888d56348d19e4857492a456214';
const QIANWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 AI续写 API 被调用');
    
    const body = await request.json();
    const { context } = body;
    
    if (!context) {
      return NextResponse.json(
        { error: '缺少上下文内容' },
        { status: 400 }
      );
    }

    console.log('💬 续写请求:', { context: context.substring(0, 100) });

    // 生成续写系统提示词
    const systemPrompt = getContinueSystemPrompt();
    
    // 调用通义千问API
    const aiResponse = await callQianWenAPI(systemPrompt, context);

    console.log('✅ 续写响应生成完成');
    return NextResponse.json({
      success: true,
      continuedText: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 续写 API错误:', error);
    
    // 如果API调用失败，返回模拟响应
    const { context } = await request.json().catch(() => ({ context: '' }));
    const fallbackResponse = generateMockContinueResponse(context);
    
    return NextResponse.json({
      success: true,
      continuedText: fallbackResponse,
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
        temperature: 0.8,
        max_tokens: 1500,
        top_p: 0.9
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

function getContinueSystemPrompt(): string {
  return `你是一个专业的写作助手，专门帮助用户续写个人回忆录内容。

请根据用户提供的上下文内容，自然地续写下去：

1. 保持与前文的连贯性和一致性
2. 延续相同的写作风格和语调
3. 发展合理的情节和内容
4. 保持回忆录的真实感和个人色彩
5. 适当添加细节和情感描述
6. 确保内容积极正面，适合回忆录
7. 续写长度适中，不要过长或过短

请直接返回续写的内容，与原文自然衔接。不需要额外的说明或标记。`;
}

function generateMockContinueResponse(context: string): string {
  return `
这里是AI续写的内容，会根据您提供的上下文"${context.substring(0, 50)}..."自然地继续下去。

在真实的AI续写功能中，系统会：
• 分析您的写作风格和语调
• 理解故事的发展脉络
• 生成与上下文连贯的续写内容
• 保持回忆录的真实感和情感色彩

续写内容会包含：
- 合理的情节发展
- 适当的细节描述
- 情感的自然流露
- 符合回忆录特点的叙述方式

⚠️ 注意：这是模拟响应，请配置真实的AI API获得实际续写功能。`;
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