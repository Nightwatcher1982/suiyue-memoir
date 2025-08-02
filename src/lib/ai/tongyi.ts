/**
 * 通义千问 API 集成
 * 提供AI文本润色、写作辅助等功能
 */

// 客户端不直接导入DashScope客户端，而是通过API路由调用
interface TongyiResponse {
  success: boolean;
  data?: {
    polishedText?: string;
    suggestions?: string[];
    improvements?: {
      type: string;
      description: string;
      original: string;
      improved: string;
    }[];
  };
  message?: string;
  error?: string;
}

interface PolishOptions {
  style?: 'formal' | 'casual' | 'literary' | 'memoir';
  tone?: 'warm' | 'professional' | 'intimate' | 'nostalgic';
  focus?: 'grammar' | 'style' | 'clarity' | 'emotion';
}

// Interface for future use in writing prompts
// interface WritingPrompt {
//   type: 'continue' | 'expand' | 'improve' | 'interview';
//   context: string;
//   requirement?: string;
// }

/**
 * 文本润色功能
 */
export async function polishText(
  text: string, 
  options: PolishOptions = {}
): Promise<TongyiResponse> {
  try {
    const response = await fetch('/api/ai/polish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        style: options.style || 'memoir',
        tone: options.tone || 'warm'
      })
    });

    const data = await response.json();
    
    if (!response.ok || data.fallback) {
      // 如果API调用失败或需要回退，使用模拟响应
      console.warn('API调用失败，使用模拟响应:', data.error);
      return await mockPolishText(text, options);
    }

    if (data.success) {
      const improvements = generateImprovements(text, data.data.polishedText);
      return {
        success: true,
        data: {
          polishedText: data.data.polishedText,
          improvements,
          suggestions: data.data.suggestions
        }
      };
    } else {
      throw new Error(data.error || '未知错误');
    }
  } catch (error) {
    console.error('AI文本润色失败:', error);
    
    // 如果网络请求失败，回退到模拟响应
    console.warn('网络请求失败，使用模拟响应');
    return await mockPolishText(text, options);
  }
}

// 模拟响应作为降级方案
async function mockPolishText(
  text: string,
  options: PolishOptions
): Promise<TongyiResponse> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const polishedText = simulateTextPolish(text, options);
  const improvements = generateImprovements(text, polishedText);

  return {
    success: true,
    data: {
      polishedText,
      improvements,
      suggestions: [
        '⚠️ 使用模拟响应（未配置API密钥）',
        '增加了更生动的形容词',
        '调整了句式结构，使表达更流畅'
      ]
    }
  };
}

/**
 * AI写作助手 - 续写文本
 */
export async function continueWriting(
  context: string,
  requirement?: string
): Promise<TongyiResponse> {
  try {
    const response = await fetch('/api/ai/continue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context,
        requirement
      })
    });

    const data = await response.json();
    
    if (!response.ok || data.fallback) {
      // 如果API调用失败或需要回退，使用模拟响应
      console.warn('API调用失败，使用模拟响应:', data.error);
      return await mockContinueWriting(context, requirement);
    }

    if (data.success) {
      return {
        success: true,
        data: {
          polishedText: data.data.polishedText,
          suggestions: data.data.suggestions
        }
      };
    } else {
      throw new Error(data.error || '未知错误');
    }
  } catch (error) {
    console.error('AI续写失败:', error);
    
    // 回退到模拟响应
    console.warn('网络请求失败，使用模拟响应');
    return await mockContinueWriting(context, requirement);
  }
}

async function mockContinueWriting(
  context: string,
  requirement?: string
): Promise<TongyiResponse> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const continuedText = simulateContinueWriting(context, requirement);

  return {
    success: true,
    data: {
      polishedText: continuedText,
      suggestions: [
        '⚠️ 使用模拟响应（未配置API密钥）',
        '基于上下文自然延续',
        '保持写作风格一致'
      ]
    }
  };
}

/**
 * AI智能访谈 - 生成引导问题
 */
export async function generateInterviewQuestions(
  topic: string,
  context?: string
): Promise<TongyiResponse> {
  try {
    const response = await fetch('/api/ai/interview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        context
      })
    });

    const data = await response.json();
    
    if (!response.ok || data.fallback) {
      // 如果API调用失败或需要回退，使用模拟响应
      console.warn('API调用失败，使用模拟响应:', data.error);
      return await mockGenerateInterviewQuestions(topic, context);
    }

    if (data.success) {
      return {
        success: true,
        data: {
          suggestions: data.data.suggestions
        }
      };
    } else {
      throw new Error(data.error || '未知错误');
    }
  } catch (error) {
    console.error('生成访谈问题失败:', error);
    
    // 回退到模拟响应
    console.warn('网络请求失败，使用模拟响应');
    return await mockGenerateInterviewQuestions(topic, context);
  }
}

async function mockGenerateInterviewQuestions(
  topic: string,
  context?: string
): Promise<TongyiResponse> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const questions = simulateInterviewQuestions(topic, context);
  const warningQuestions = ['⚠️ 使用模拟响应（未配置API密钥）', ...questions];

  return {
    success: true,
    data: {
      suggestions: warningQuestions
    }
  };
}

/**
 * AI内容扩写
 */
export async function expandContent(
  text: string,
  direction: 'detail' | 'emotion' | 'background' | 'dialogue'
): Promise<TongyiResponse> {
  try {
    const response = await fetch('/api/ai/expand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        direction
      })
    });

    const data = await response.json();
    
    if (!response.ok || data.fallback) {
      // 如果API调用失败或需要回退，使用模拟响应
      console.warn('API调用失败，使用模拟响应:', data.error);
      return await mockExpandContent(text, direction);
    }

    if (data.success) {
      return {
        success: true,
        data: {
          polishedText: data.data.polishedText,
          suggestions: data.data.suggestions
        }
      };
    } else {
      throw new Error(data.error || '未知错误');
    }
  } catch (error) {
    console.error('内容扩写失败:', error);
    
    // 回退到模拟响应
    console.warn('网络请求失败，使用模拟响应');
    return await mockExpandContent(text, direction);
  }
}

async function mockExpandContent(
  text: string,
  direction: 'detail' | 'emotion' | 'background' | 'dialogue'
): Promise<TongyiResponse> {
  await new Promise(resolve => setTimeout(resolve, 1800));
  
  const expandedText = simulateContentExpansion(text, direction);

  return {
    success: true,
    data: {
      polishedText: expandedText,
      suggestions: [
        '⚠️ 使用模拟响应（未配置API密钥）',
        `已按照"${direction}"方向扩写内容`,
        '增加了相关细节描述'
      ]
    }
  };
}

// ===== 模拟AI功能实现 =====

function simulateTextPolish(text: string, options: PolishOptions): string {
  const { style = 'memoir', tone = 'warm' } = options;
  
  // 简单的文本优化模拟
  let polished = text;
  
  // 根据回忆录风格调整
  if (style === 'memoir') {
    polished = polished
      .replace(/我觉得/g, '我深深感受到')
      .replace(/很好/g, '令人印象深刻')
      .replace(/那时候/g, '在那个年代')
      .replace(/现在想起来/g, '回想起来');
  }
  
  // 根据语调调整
  if (tone === 'nostalgic') {
    polished = polished
      .replace(/记得/g, '依稀记得')
      .replace(/时光/g, '逝去的时光')
      .replace(/美好/g, '珍贵而美好');
  }
  
  // 增强表达
  polished = polished
    .replace(/\。/g, '。\n') // 分段
    .replace(/，([^，。]{1,10})，/g, '，$1，') // 保持语句流畅
    .trim();
    
  return polished;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateImprovements(original: string, polished: string) {
  return [
    {
      type: '词汇优化',
      description: '使用更具表现力的词汇',
      original: '我觉得很好',
      improved: '我深深感受到这令人印象深刻'
    },
    {
      type: '句式调整',
      description: '优化句子结构，增强可读性',
      original: '那时候现在想起来',
      improved: '在那个年代，回想起来'
    },
    {
      type: '情感表达',
      description: '加强情感色彩，更符合回忆录风格',
      original: '美好时光',
      improved: '珍贵而美好的逝去时光'
    }
  ];
}

function simulateContinueWriting(context: string, requirement?: string): string {
  // const lastSentence = context.split('。').pop() || context.slice(-50);
  
  // 根据上下文生成续写内容
  const continuations = [
    '这件事对我的影响很深远，即使到了今天，我依然能清晰地回想起当时的每一个细节。',
    '多年以后回想起来，那段经历教会了我很多人生道理，也塑造了我现在的性格。',
    '那是我人生中的一个重要转折点，从那以后，我开始用不同的眼光看待世界。',
    '这个故事告诉我，生活中的每一个挫折都是成长的机会，每一次经历都值得珍惜。'
  ];
  
  const randomContinuation = continuations[Math.floor(Math.random() * continuations.length)];
  
  if (requirement) {
    return `${randomContinuation} ${requirement}相关的具体情况是这样的：当时我...`;
  }
  
  return randomContinuation;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function simulateInterviewQuestions(topic: string, context?: string): string[] {
  const questionTemplates = {
    '童年': [
      '你最难忘的童年回忆是什么？',
      '小时候最喜欢做什么事情？',
      '童年时期对你影响最大的人是谁？',
      '有什么童年趣事让你至今难忘？',
      '小时候的梦想是什么？'
    ],
    '家庭': [
      '你的家庭给你带来了什么重要的价值观？',
      '家人中谁对你的影响最大？',
      '有什么家庭传统一直延续至今？',
      '你如何描述你的家庭氛围？',
      '家庭中有什么特别的故事？'
    ],
    '工作': [
      '你的第一份工作是什么体验？',
      '职业生涯中最重要的转折点是什么？',
      '工作中遇到过什么重大挑战？',
      '有什么同事或导师对你影响深远？',
      '如何平衡工作与生活？'
    ],
    '通用': [
      '这段经历给你最大的感悟是什么？',
      '如果可以重新选择，你会有什么不同的做法？',
      '这个故事背后有什么更深层的意义？',
      '当时的心情是怎样的？',
      '这件事对你后来的人生有什么影响？'
    ]
  };
  
  const topicKey = Object.keys(questionTemplates).find(key => 
    topic.includes(key)
  ) || '通用';
  
  return questionTemplates[topicKey as keyof typeof questionTemplates] || questionTemplates['通用'];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function simulateContentExpansion(text: string, direction: string): string {
  const expansions = {
    detail: '具体来说，当时的情况是这样的：环境的每一个细节都历历在目，包括当时的天气、周围的声音、以及空气中弥漫的气味。',
    emotion: '那一刻，我的内心五味杂陈，既有兴奋和期待，也有紧张和不安。这种复杂的情感至今仍能深深触动我。',
    background: '要理解这件事的重要性，需要了解当时的时代背景。那个年代的社会环境与现在大不相同，人们的生活方式和价值观念都有很大差异。',
    dialogue: '我清楚地记得当时的对话。"你觉得怎么样？"他问道。我犹豫了一下，回答说："我觉得这可能会改变一切。"这番话后来证明是预言般的准确。'
  };
  
  return `${text}\n\n${expansions[direction as keyof typeof expansions]}`;
} 