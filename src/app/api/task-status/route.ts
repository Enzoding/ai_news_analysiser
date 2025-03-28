import { NextRequest, NextResponse } from 'next/server';
import { getTaskStatus } from '@/lib/task-queue';

/**
 * 获取任务状态
 * 通过任务ID查询任务的当前状态
 */
export async function GET(request: NextRequest) {
  try {
    // 从查询参数中获取任务ID
    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');
    
    // 如果没有提供任务ID，返回错误
    if (!taskId) {
      return NextResponse.json({
        success: false,
        message: '缺少必要的参数: taskId'
      }, { status: 400 });
    }
    
    console.log(`[${new Date().toISOString()}] 查询任务状态: ${taskId}`);
    
    // 获取任务状态
    const task = await getTaskStatus(taskId);
    
    // 如果任务不存在，返回错误
    if (!task) {
      return NextResponse.json({
        success: false,
        message: `任务 ${taskId} 不存在`
      }, { status: 404 });
    }
    
    // 返回任务状态
    return NextResponse.json({
      success: true,
      data: {
        task,
        status: task.status,
        statusText: getStatusText(task.status),
        completedAt: task.completed_at,
        result: task.result,
        error: task.error
      }
    });
  } catch (error) {
    console.error('获取任务状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取任务状态失败'
      },
      { status: 500 }
    );
  }
}

/**
 * 获取状态文本描述
 * @param status 任务状态
 * @returns 状态文本描述
 */
function getStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return '等待处理';
    case 'processing':
      return '处理中';
    case 'completed':
      return '已完成';
    case 'failed':
      return '处理失败';
    default:
      return '未知状态';
  }
}
