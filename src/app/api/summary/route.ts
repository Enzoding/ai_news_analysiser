import { NextRequest, NextResponse } from 'next/server';
import { processAndSummarizeNews, getSummaryRecords } from '@/lib/news-processor';
import { getLLMConfig, saveLLMConfig } from '@/lib/llm-config';
import { LLMProvider, LLMConfig } from '@/types';

// 获取摘要记录列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    
    const records = await getSummaryRecords(limit);
    
    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error('获取摘要记录失败:', error);
    return NextResponse.json(
      { success: false, error: '获取摘要记录失败' },
      { status: 500 }
    );
  }
}

// 手动触发新闻收集和摘要
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, action, config } = body;
    
    // 如果是配置操作
    if (action === 'getLLMConfig') {
      const currentConfig = await getLLMConfig();
      return NextResponse.json({ success: true, data: currentConfig });
    }
    
    // 如果是保存配置
    if (action === 'saveLLMConfig' && config) {
      const saved = await saveLLMConfig(config as LLMConfig);
      if (!saved) {
        return NextResponse.json(
          { success: false, error: '保存LLM配置失败' },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, data: { message: 'LLM配置已保存' } });
    }
    
    // 如果是生成摘要
    const preferredProvider = provider as LLMProvider | undefined;
    const result = await processAndSummarizeNews(preferredProvider);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('触发新闻收集失败:', error);
    return NextResponse.json(
      { success: false, error: '触发新闻收集失败' },
      { status: 500 }
    );
  }
}
