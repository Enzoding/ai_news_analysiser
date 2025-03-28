import axios from 'axios';
import { LLMProvider } from '@/types';

// LLM API配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const GROK_API_KEY = process.env.GROK_API_KEY || '';

// Deepseek API配置
const deepseekConfig = {
  baseURL: 'https://api.siliconflow.cn/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
  }
};

// Grok API配置
const grokConfig = {
  baseURL: 'https://api.x.ai/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${GROK_API_KEY}`
  }
};

/**
 * 使用LLM生成新闻摘要和大纲
 * @param provider LLM提供商
 * @param title 新闻标题
 * @param content 新闻内容
 * @returns 包含摘要和大纲的对象
 */
export async function generateNewsSummary(
  provider: LLMProvider,
  title: string,
  content: string
): Promise<{ summary: string; outline: string }> {
  try {
    const date = new Date().toISOString().split('T')[0];
    let prompt;
    
    if (provider === 'grok') {
      prompt = `请你作为最专业的AI行业分析师，对以下AI领域新闻进行分析和总结：

日期: ${date}

## 新闻资讯:
1. ${title} 
   摘要: ${content.substring(0, Math.min(200, content.length))}...
   链接: 原文链接

请生成一份结构清晰的AI行业分析，包含以下部分，格式必须严格统一:
1. 摘要：概括新闻的主要内容和意义（不超过200字）
2. 大纲：分析3-5个关键要点，突出新闻中的重要信息

请确保内容客观、专业，并保持格式清晰。

请按照以下格式回复：

摘要：
[摘要内容]

大纲：
- [要点1]
- [要点2]
- [要点3]
...`;
    } else {
      prompt = `请你作为AI行业分析师，对以下AI领域新闻进行分析和总结：

日期: ${date}

## 新闻资讯:
1. ${title}
   摘要: ${content.substring(0, Math.min(200, content.length))}...

请提供：
1. 一段简洁的摘要（不超过200字），概括新闻的主要内容和意义
2. 一个结构化的要点大纲（3-5个要点），突出新闻中的关键信息

格式要求：
- 摘要和大纲分开呈现
- 使用简洁、专业的语言
- 保持客观，不添加个人观点

请按照以下格式回复：

摘要：
[摘要内容]

大纲：
- [要点1]
- [要点2]
- [要点3]
...`;
    }

    let response;
    
    if (provider === 'deepseek') {
      response = await axios.post(
        `${deepseekConfig.baseURL}/chat/completions`,
        {
          model: 'deepseek-ai/DeepSeek-V3',
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          max_tokens: 2048,
          stop: null,
          temperature: 0.7,
          top_p: 0.7,
          top_k: 50,
          frequency_penalty: 0.5,
          n: 1,
          response_format: { type: 'text' }
        },
        { headers: deepseekConfig.headers }
      );
      
      const result = response.data.choices[0].message.content;
      return parseResult(result);
    } else if (provider === 'grok') {
      response = await axios.post(
        `${grokConfig.baseURL}/chat/completions`,
        {
          model: 'grok-2-1212',
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          max_tokens: 10000,
          temperature: 0.7,
          top_p: 0.7
        },
        { headers: grokConfig.headers }
      );
      
      const result = response.data.choices[0].message.content;
      return parseResult(result);
    }
    
    throw new Error('不支持的LLM提供商');
  } catch (error) {
    console.error('生成摘要失败:', error);
    return {
      summary: '摘要生成失败',
      outline: '大纲生成失败'
    };
  }
}

/**
 * 解析LLM返回的结果
 * @param result LLM返回的文本
 * @returns 解析后的摘要和大纲
 */
function parseResult(result: string): { summary: string; outline: string } {
  const summaryMatch = result.match(/摘要：\s*([\s\S]*?)(?=\n\n大纲：|$)/);
  const outlineMatch = result.match(/大纲：\s*([\s\S]*?)$/);
  
  return {
    summary: summaryMatch ? summaryMatch[1].trim() : '摘要解析失败',
    outline: outlineMatch ? outlineMatch[1].trim() : '大纲解析失败'
  };
}
