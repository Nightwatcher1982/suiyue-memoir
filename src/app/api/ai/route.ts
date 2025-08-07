import { NextRequest, NextResponse } from 'next/server';

// 通义千问API配置 - 支持多种环境变量名称
const QIANWEN_API_KEY = process.env.TONGYI_ACCESS_KEY_ID || 
                       process.env.QIANWEN_API_KEY || 
                       process.env.DASHSCOPE_API_KEY;
const QIANWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

export async function POST(request: NextRequest) {
  let message = '';
  let type = 'chat';
  
  try {
    console.log('🤖 通义千问 AI助手 API 被调用');
    console.log('🔍 检查通义千问API配置:');
    console.log('- TONGYI_ACCESS_KEY_ID:', process.env.TONGYI_ACCESS_KEY_ID ? '已配置' : '未配置');
    console.log('- QIANWEN_API_KEY:', process.env.QIANWEN_API_KEY ? '已配置' : '未配置');
    console.log('- DASHSCOPE_API_KEY:', process.env.DASHSCOPE_API_KEY ? '已配置' : '未配置');
    console.log('- 最终使用的API KEY:', QIANWEN_API_KEY ? `已配置 (${QIANWEN_API_KEY.substring(0, 8)}...)` : '未配置');
    
    const body = await request.json();
    ({ message, type = 'chat' } = body);
    
    if (!message) {
      return NextResponse.json(
        { error: '缺少消息内容' },
        { status: 400 }
      );
    }

    console.log('💬 AI助手请求:', { type, message: message.substring(0, 100) });

    // 根据类型生成系统提示词
    const systemPrompt = getSystemPrompt(type);
    
    // 调用通义千问API
    const aiResponse = await callQianWenAPI(systemPrompt, message);

    console.log('✅ 通义千问响应生成完成');
    return NextResponse.json({
      success: true,
      response: aiResponse,
      type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 通义千问 API错误:', error);
    
    // 如果API调用失败，返回模拟响应
    const fallbackResponse = generateMockAIResponse(message || '', type || 'chat');
    
    return NextResponse.json({
      success: true,
      response: fallbackResponse + '\n\n⚠️ 注意：这是备用响应，通义千问API调用失败',
      type: type || 'chat',
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

function getSystemPrompt(type: string): string {
  switch (type) {
    case 'polish':
      return `你是一个专业的文字编辑助手，专门帮助用户润色和改进文本。请对用户提供的文本进行以下优化：
1. 语言表达更加流畅自然
2. 增加适当的情感色彩和细节描述  
3. 调整句式结构，提升可读性
4. 保持原文的核心意思和风格
5. 适合回忆录的写作风格

请直接返回润色后的文本，不需要额外说明。`;

    case 'expand':
      return `你是一个专业的写作助手，专门帮助用户扩写内容。请对用户提供的文本进行扩写：
1. 添加更多具体的情节细节
2. 深入描写情感和心理活动
3. 丰富场景和环境描述
4. 增加人物的行为和对话
5. 保持故事的连贯性和真实感
6. 适合个人回忆录的叙述风格

请返回扩写后的内容，长度约为原文的2-3倍。`;

    case 'summarize':
      return `你是一个专业的文本总结助手。请对用户提供的文本进行总结：
1. 提取核心内容和关键信息
2. 概括主要观点和情感
3. 保留重要的时间、地点、人物信息
4. 语言简洁明了
5. 适合回忆录章节总结

请返回简洁的总结内容。`;

    default:
      return `你是一个专业的写作助手，专门帮助用户撰写个人回忆录。你的任务是：
1. 帮助用户整理和润色文字
2. 提供写作建议和指导
3. 协助扩展和丰富内容
4. 保持温暖、真诚的语调
5. 尊重用户的个人经历和情感

请根据用户的需求提供专业的帮助。`;
  }
}

function generateMockAIResponse(message: string, type: string): string {
  // 根据消息类型生成不同的模拟响应
  switch (type) {
    case 'polish':
      return `【AI润色建议】\n\n针对您的文本，我建议进行以下优化：\n\n1. 语言表达更加流畅自然\n2. 增加情感色彩和细节描述\n3. 调整句式结构，提升可读性\n\n优化后的文本：\n${message}\n\n（注意：这是模拟响应，请配置真实的AI API获得实际润色功能）`;
    
    case 'expand':
      return `【AI扩写建议】\n\n基于您的内容，我可以帮您扩展以下方面：\n\n📝 情节发展：添加更多具体的事件细节\n💭 情感描述：深入描写当时的心情和感受\n🌟 场景刻画：丰富环境和氛围的描述\n👥 人物塑造：增加人物的行为和对话\n\n扩写示例：\n"${message}"\n→ 可以扩写为更详细的故事情节...\n\n（注意：这是模拟响应，请配置真实的AI API获得实际扩写功能）`;
    
    case 'summarize':
      return `【AI总结】\n\n核心内容：${message.substring(0, 100)}...\n\n主要观点：\n• 这是一段关于个人回忆的内容\n• 包含了重要的情感和经历\n• 值得被记录和传承\n\n建议：这段内容很有价值，建议保留其中的关键信息和情感元素。\n\n（注意：这是模拟响应，请配置真实的AI API获得实际总结功能）`;
    
    default:
      return `【AI助手】\n\n我收到了您的消息："${message.substring(0, 50)}..."\n\n这是一个模拟的AI响应。为了获得真实的AI功能，请：\n\n1. 配置AI服务API Key（如OpenAI、文心一言、通义千问等）\n2. 在环境变量中设置相应的配置\n3. 更新API代码以调用真实的AI服务\n\n支持的AI服务：\n• OpenAI GPT系列\n• 百度文心一言\n• 阿里通义千问\n• 腾讯混元\n• 智谱ChatGLM`;
  }
}

// 支持OPTIONS请求（用于CORS预检）
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