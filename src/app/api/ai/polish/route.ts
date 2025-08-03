import { NextRequest, NextResponse } from 'next/server';

// 通义千问API配置
const QIANWEN_API_KEY = process.env.TONGYI_ACCESS_KEY_ID || 
                       process.env.QIANWEN_API_KEY || 
                       process.env.DASHSCOPE_API_KEY ||
                       'sk-c93c5888d56348d19e4857492a456214';
const QIANWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 AI文本润色 API 被调用');
    
    const body = await request.json();
    const { text, options = {} } = body;
    
    if (!text) {
      return NextResponse.json(
        { error: '缺少文本内容' },
        { status: 400 }
      );
    }

    console.log('💬 润色请求:', { options, text: text.substring(0, 100) });

    // 根据选项生成系统提示词
    const systemPrompt = getPolishSystemPrompt(options);
    
    // 调用通义千问API
    const aiResponse = await callQianWenAPI(systemPrompt, text);

    console.log('✅ 文本润色响应生成完成');
    return NextResponse.json({
      success: true,
      data: {
        polishedText: aiResponse,
        suggestions: ['文本已优化，语言更加流畅', '情感表达更加丰富', '适合回忆录风格'],
        improvements: [
          {
            type: 'style',
            description: '优化了语言表达',
            original: text.substring(0, 50) + '...',
            improved: aiResponse.substring(0, 50) + '...'
          }
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 文本润色 API错误:', error);
    
    // 如果API调用失败，返回模拟响应
    const { text } = await request.json().catch(() => ({ text: '' }));
    const fallbackResponse = generateMockPolishResponse(text);
    
    return NextResponse.json({
      success: true,
      data: fallbackResponse,
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
        max_tokens: 2000,
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

function getPolishSystemPrompt(options: any): string {
  const { style = 'memoir', tone = 'warm', focus = 'clarity' } = options;
  
  let basePrompt = '你是一个专业的文字编辑助手，专门帮助用户润色和改进回忆录文本。';
  
  // 根据风格调整
  switch (style) {
    case 'formal':
      basePrompt += '请使用正式、严谨的语言风格。';
      break;
    case 'casual':
      basePrompt += '请使用轻松、自然的语言风格。';
      break;
    case 'literary':
      basePrompt += '请使用文学性较强、富有诗意的语言风格。';
      break;
    case 'memoir':
    default:
      basePrompt += '请使用适合个人回忆录的温暖、真诚的语言风格。';
      break;
  }
  
  // 根据语调调整
  switch (tone) {
    case 'professional':
      basePrompt += '语调要专业、客观。';
      break;
    case 'intimate':
      basePrompt += '语调要亲切、私密。';
      break;
    case 'nostalgic':
      basePrompt += '语调要怀旧、深情。';
      break;
    case 'warm':
    default:
      basePrompt += '语调要温暖、亲和。';
      break;
  }
  
  // 根据重点调整
  switch (focus) {
    case 'grammar':
      basePrompt += '重点关注语法和句式的优化。';
      break;
    case 'style':
      basePrompt += '重点关注文体和表达方式的改进。';
      break;
    case 'emotion':
      basePrompt += '重点关注情感表达的丰富。';
      break;
    case 'clarity':
    default:
      basePrompt += '重点关注表达的清晰度和可读性。';
      break;
  }

  return `${basePrompt}

请对用户提供的文本进行润色优化：
1. 语言表达更加流畅自然
2. 增加适当的情感色彩和细节描述  
3. 调整句式结构，提升可读性
4. 保持原文的核心意思和个人特色
5. 确保内容适合回忆录的写作风格

请直接返回润色后的文本，不需要额外说明。`;
}

function generateMockPolishResponse(text: string): any {
  return {
    polishedText: `${text}

⚠️ 这是模拟的润色结果。在真实的AI润色中，这段文本会被：
• 优化语言表达，使其更加流畅自然
• 增加情感色彩和细节描述
• 调整句式结构，提升可读性
• 保持原有的真实性和个人特色

请配置真实的AI API以获得实际的润色功能。`,
    suggestions: [
      '建议增加更多情感描述',
      '可以优化句子结构',
      '适合添加一些细节描述',
      '语言可以更加生动'
    ],
    improvements: [
      {
        type: 'style',
        description: '语言表达优化',
        original: text.substring(0, 30) + '...',
        improved: '优化后的表达方式...'
      },
      {
        type: 'emotion',
        description: '情感色彩增强',
        original: '原始表达',
        improved: '更富情感的表达'
      }
    ]
  };
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