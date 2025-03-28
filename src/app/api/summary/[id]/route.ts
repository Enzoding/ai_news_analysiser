import { NextRequest, NextResponse } from 'next/server';
import { getSummaryRecordDetails } from '@/lib/news-processor';

// 获取摘要记录详情
export async function GET(request: NextRequest) {
  try {
    // 从 URL 中提取 id 参数
    const id = request.nextUrl.pathname.split('/').pop() || '';
    
    const { record, news } = await getSummaryRecordDetails(id);
    
    if (!record) {
      return NextResponse.json(
        { success: false, error: '摘要记录不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: { record, news } });
  } catch (error) {
    console.error('获取摘要记录详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取摘要记录详情失败' },
      { status: 500 }
    );
  }
}
