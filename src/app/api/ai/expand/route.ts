import { NextRequest, NextResponse } from 'next/server';

// 通义千问API配置
const QIANWEN_API_KEY = process.env.DASHSCOPE_API_KEY || 
                       process.env.TONGYI_ACCESS_KEY_ID || 
                       process.env.QIANWEN_API_KEY;
const QIANWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 AI内容扩写 API 被调用');
    
    const body = await request.json();
    const { text, direction = 'detail' } = body;
    
    if (!text) {
      return NextResponse.json(
        { error: '缺少文本内容' },
        { status: 400 }
      );
    }

    console.log('💬 扩写请求:', { direction, text: text.substring(0, 100) });

    // 检查API密钥配置
    if (!QIANWEN_API_KEY) {
      console.warn('⚠️ 通义千问API密钥未配置，使用模拟响应');
      const fallbackResponse = generateMockExpandResponse(text, direction);
      return NextResponse.json({
        success: true,
        data: {
          polishedText: fallbackResponse,
          suggestions: ['⚠️ 使用模拟响应（未配置API密钥）', `已按照"${direction}"方向扩写内容`]
        },
        direction,
        timestamp: new Date().toISOString(),
        fallback: true,
        reason: 'API密钥未配置'
      });
    }

    // 根据扩写方向生成系统提示词
    const systemPrompt = getExpandSystemPrompt(direction);
    
    // 调用通义千问API
    const aiResponse = await callQianWenAPI(systemPrompt, text);

    console.log('✅ 内容扩写响应生成完成');
    return NextResponse.json({
      success: true,
      data: {
        polishedText: aiResponse,
        suggestions: [`AI扩写完成 - 按照"${direction}"方向扩写 ${aiResponse.length} 字内容`]
      },
      direction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 内容扩写 API错误:', error);
    
    // 如果API调用失败，返回模拟响应
    const { text, direction = 'detail' } = await request.json().catch(() => ({ text: '', direction: 'detail' }));
    const fallbackResponse = generateMockExpandResponse(text, direction);
    
    return NextResponse.json({
      success: true,
      data: {
        polishedText: fallbackResponse,
        suggestions: ['⚠️ AI扩写失败，使用模拟响应', '请检查网络连接和API配置']
      },
      direction,
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

function getExpandSystemPrompt(direction: string): string {
  const basePrompt = '你是一个专业的写作助手，专门帮助用户扩写回忆录内容。';
  
  switch (direction) {
    case 'detail':
      return `${basePrompt}请对用户提供的文本进行细节扩写：
1. 添加更多具体的事件细节和过程描述
2. 丰富时间、地点、人物的具体信息
3. 增加感官体验的描述（视觉、听觉、嗅觉、触觉）
4. 保持故事的真实性和连贯性
5. 适合个人回忆录的叙述风格

请返回扩写后的内容，长度约为原文的2-3倍。`;

    case 'emotion':
      return `${basePrompt}请对用户提供的文本进行情感扩写：
1. 深入描写当时的心情和内心感受
2. 添加情感变化的过程和原因
3. 描述情感对行为和决定的影响
4. 增加内心独白和心理活动
5. 保持情感的真实和深度

请返回扩写后的内容，重点突出情感层面。`;

    case 'background':
      return `${basePrompt}请对用户提供的文本进行背景扩写：
1. 添加时代背景和社会环境描述
2. 丰富地理环境和生活条件的描述
3. 增加相关的历史事件或社会现象
4. 描述当时的文化氛围和生活方式
5. 为故事提供更丰富的历史语境

请返回扩写后的内容，重点补充背景信息。`;

    case 'dialogue':
      return `${basePrompt}请对用户提供的文本进行对话扩写：
1. 添加人物之间的对话和交流
2. 丰富对话的语调和情感色彩
3. 通过对话展现人物性格和关系
4. 增加对话的自然性和生动性
5. 保持对话符合当时的语言习惯

请返回扩写后的内容，重点增加对话元素。`;

    default:
      return `${basePrompt}请对用户提供的文本进行全面扩写：
1. 添加更多具体的情节细节
2. 深入描写情感和心理活动
3. 丰富场景和环境描述
4. 增加人物的行为和对话
5. 保持故事的连贯性和真实感

请返回扩写后的内容，长度约为原文的2-3倍。`;
  }
}

function generateMockExpandResponse(text: string, direction: string): string {
  const directionMap = {
    detail: '细节',
    emotion: '情感',
    background: '背景',
    dialogue: '对话'
  };

  const directionName = directionMap[direction as keyof typeof directionMap] || '综合';

  return `【AI${directionName}扩写】

原始内容：
"${text}"

扩写建议：
• 这段内容可以从${directionName}角度进行丰富
• 建议添加更多具体的描述和细节
• 可以增加情感层面的表达
• 保持回忆录的真实性和温度

扩写示例：
${text}

在这里可以添加更多${directionName}相关的内容，比如具体的场景描述、人物对话、心理活动等，让回忆更加生动和完整。

⚠️ 注意：这是模拟响应，请配置真实的AI API获得实际扩写功能。`;
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