import { NextRequest, NextResponse } from 'next/server';
import { getNextPendingTask, updateTaskToProcessing, completeTask, failTask, getTaskStatus } from '@/lib/task-queue';
import { processAndSummarizeNews } from '@/lib/news-processor';

/**
 * 处理任务队列中的任务
 * 这个接口可以处理指定的任务或下一个待处理的任务
 * 每次只处理一个任务，以避免超时
 */
export async function GET(request: NextRequest) {
  try {
    // 检查是否指定了任务 ID
    const searchParams = request.nextUrl.searchParams;
    const specificTaskId = searchParams.get('taskId');
    
    let task;
    
    if (specificTaskId) {
      // 获取指定的任务
      console.log(`[${new Date().toISOString()}] 处理指定的任务: ${specificTaskId}`);
      task = await getTaskStatus(specificTaskId);
      
      // 如果任务不存在或者不是待处理状态，返回错误
      if (!task) {
        return NextResponse.json({
          success: false,
          message: `任务 ${specificTaskId} 不存在`
        }, { status: 404 });
      }
      
      if (task.status !== 'pending') {
        return NextResponse.json({
          success: false,
          message: `任务 ${specificTaskId} 不是待处理状态，当前状态: ${task.status}`
        }, { status: 400 });
      }
    } else {
      // 获取下一个待处理任务
      console.log(`[${new Date().toISOString()}] 获取下一个待处理任务`);
      task = await getNextPendingTask();
      
      // 如果没有待处理任务，返回成功
      if (!task) {
        return NextResponse.json({
          success: true,
          message: '没有待处理任务'
        });
      }
    }
    
    // 更新任务状态为处理中
    console.log(`[${new Date().toISOString()}] 更新任务 ${task.id} 状态为处理中`);
    await updateTaskToProcessing(task.id);
    
    console.log(`[${new Date().toISOString()}] 开始处理任务 ${task.id}，类型: ${task.task_type}`);
    
    // 根据任务类型处理任务
    if (task.task_type === 'news_collection') {
      try {
        // 执行新闻收集
        console.log(`[${new Date().toISOString()}] 执行新闻收集，提供商: ${task.params.provider}`);
        const result = await processAndSummarizeNews(task.params.provider);
        
        // 更新任务状态为已完成
        console.log(`[${new Date().toISOString()}] 新闻收集完成，更新任务状态为已完成`);
        await completeTask(task.id, result);
        
        return NextResponse.json({
          success: true,
          message: '任务处理成功',
          data: { taskId: task.id, result }
        });
      } catch (error) {
        // 更新任务状态为失败
        const errorMessage = error instanceof Error ? error.message : '处理任务时发生未知错误';
        console.error(`[${new Date().toISOString()}] 处理任务失败:`, errorMessage);
        await failTask(task.id, errorMessage);
        
        console.error(`[${new Date().toISOString()}] 处理任务 ${task.id} 失败:`, error);
        return NextResponse.json({
          success: false,
          message: '任务处理失败',
          error: errorMessage,
          data: { taskId: task.id }
        });
      }
    } else {
      // 不支持的任务类型
      const errorMessage = `不支持的任务类型: ${task.task_type}`;
      console.error(`[${new Date().toISOString()}] ${errorMessage}`);
      await failTask(task.id, errorMessage);
      
      return NextResponse.json({
        success: false,
        message: '不支持的任务类型',
        data: { taskId: task.id }
      });
    }
  } catch (error) {
    console.error('处理任务失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '处理任务失败'
      },
      { status: 500 }
    );
  }
}
