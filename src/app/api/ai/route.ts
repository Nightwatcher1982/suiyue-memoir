import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 AI助手 API 被调用');
    
    const body = await request.json();
    const { message, type = 'chat' } = body;
    
    if (!message) {
      return NextResponse.json(
        { error: '缺少消息内容' },
        { status: 400 }
      );
    }

    console.log('💬 AI助手请求:', { type, message: message.substring(0, 100) });

    // 模拟AI助手响应
    const mockResponse = generateMockAIResponse(message, type);

    console.log('✅ AI助手响应生成完成');
    return NextResponse.json({
      success: true,
      response: mockResponse,
      type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI助手 API错误:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'AI助手处理失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
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