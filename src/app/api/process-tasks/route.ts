import { NextResponse } from 'next/server';
import { getNextPendingTask, updateTaskToProcessing, completeTask, failTask } from '@/lib/task-queue';
import { processAndSummarizeNews } from '@/lib/news-processor';

/**
 * 处理任务队列中的任务
 * 这个接口由 Vercel Cron 作业定期调用
 * 每次只处理一个任务，以避免超时
 */
export async function GET() {
  try {
    // 获取下一个待处理任务
    const task = await getNextPendingTask();
    
    // 如果没有待处理任务，返回成功
    if (!task) {
      return NextResponse.json({
        success: true,
        message: '没有待处理任务'
      });
    }
    
    // 更新任务状态为处理中
    await updateTaskToProcessing(task.id);
    
    console.log(`开始处理任务 ${task.id}，类型: ${task.task_type}`);
    
    // 根据任务类型处理任务
    if (task.task_type === 'news_collection') {
      try {
        // 执行新闻收集
        const result = await processAndSummarizeNews(task.params.provider);
        
        // 更新任务状态为已完成
        await completeTask(task.id, result);
        
        return NextResponse.json({
          success: true,
          message: '任务处理成功',
          data: { taskId: task.id, result }
        });
      } catch (error) {
        // 更新任务状态为失败
        const errorMessage = error instanceof Error ? error.message : '处理任务时发生未知错误';
        await failTask(task.id, errorMessage);
        
        console.error(`处理任务 ${task.id} 失败:`, error);
        return NextResponse.json({
          success: false,
          message: '任务处理失败',
          error: errorMessage,
          data: { taskId: task.id }
        });
      }
    } else {
      // 不支持的任务类型
      await failTask(task.id, `不支持的任务类型: ${task.task_type}`);
      
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
