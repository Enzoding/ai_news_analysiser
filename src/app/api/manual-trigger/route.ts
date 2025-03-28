import { NextRequest, NextResponse } from 'next/server';
import { createNewsCollectionTask } from '@/lib/task-queue';
import { LLMProvider } from '@/types';

/**
 * 手动触发新闻收集任务
 * 这个接口只负责创建任务，不执行实际处理
 */
export async function GET(request: NextRequest) {
  try {
    // 从查询参数中获取提供商
    const searchParams = request.nextUrl.searchParams;
    const provider = (searchParams.get('provider') || 'deepseek') as LLMProvider;
    
    // 创建新闻收集任务
    const taskId = await createNewsCollectionTask(provider);
    
    return NextResponse.json({
      success: true,
      message: '任务已创建，将在后台处理',
      data: { taskId }
    });
  } catch (error) {
    console.error('创建新闻收集任务失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建任务失败'
      },
      { status: 500 }
    );
  }
}
