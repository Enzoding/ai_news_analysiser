import { NextRequest, NextResponse } from 'next/server';
import { processAndSummarizeNews, getSummaryRecords } from '@/lib/news-processor';
import { LLMProvider } from '@/types';

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
    const provider = (body.provider || 'deepseek') as LLMProvider;
    
    const result = await processAndSummarizeNews(provider);
    
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
