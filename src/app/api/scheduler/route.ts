import { NextRequest, NextResponse } from 'next/server';
import { startNewsCollectionJob, stopNewsCollectionJob, getJobStatus } from '@/lib/scheduler';
import { LLMProvider } from '@/types';

// 获取定时任务状态
export async function GET() {
  try {
    const status = getJobStatus();
    
    return NextResponse.json({ success: true, data: status });
  } catch (error) {
    console.error('获取定时任务状态失败:', error);
    return NextResponse.json(
      { success: false, error: '获取定时任务状态失败' },
      { status: 500 }
    );
  }
}

// 启动或停止定时任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, cronExpression, provider } = body;
    
    if (action === 'start') {
      const llmProvider = (provider || 'deepseek') as LLMProvider;
      const success = startNewsCollectionJob(cronExpression, llmProvider);
      
      if (!success) {
        return NextResponse.json(
          { success: false, error: '启动定时任务失败' },
          { status: 400 }
        );
      }
      
      const status = getJobStatus();
      return NextResponse.json({ success: true, data: status });
    } else if (action === 'stop') {
      const success = stopNewsCollectionJob();
      
      if (!success) {
        return NextResponse.json(
          { success: false, error: '停止定时任务失败' },
          { status: 400 }
        );
      }
      
      return NextResponse.json({ success: true, data: { running: false, nextRun: null } });
    } else {
      return NextResponse.json(
        { success: false, error: '无效的操作' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('管理定时任务失败:', error);
    return NextResponse.json(
      { success: false, error: '管理定时任务失败' },
      { status: 500 }
    );
  }
}
