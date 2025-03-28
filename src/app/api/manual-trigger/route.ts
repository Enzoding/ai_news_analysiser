import { NextRequest, NextResponse } from 'next/server';
import { createNewsCollectionTask, updateTaskToProcessing, completeTask, failTask, getTaskStatus } from '@/lib/task-queue';
import { processAndSummarizeNews } from '@/lib/news-processor';
import { LLMProvider } from '@/types';

/**
 * 手动触发新闻收集任务
 * 这个接口创建任务并立即执行
 */
export async function GET(request: NextRequest) {
  try {
    // 从查询参数中获取提供商
    const searchParams = request.nextUrl.searchParams;
    const provider = (searchParams.get('provider') || 'deepseek') as LLMProvider;
    
    console.log(`[${new Date().toISOString()}] 手动触发新闻收集任务，提供商: ${provider}`);
    
    // 创建新闻收集任务
    const taskId = await createNewsCollectionTask(provider);
    console.log(`[${new Date().toISOString()}] 任务创建成功，ID: ${taskId}`);
    
    // 立即执行任务，而不是等待调度器
    console.log(`[${new Date().toISOString()}] 开始立即执行任务...`);
    
    // 更新任务状态为处理中
    await updateTaskToProcessing(taskId);
    console.log(`[${new Date().toISOString()}] 任务状态已更新为处理中`);
    
    try {
      // 执行新闻收集
      console.log(`[${new Date().toISOString()}] 开始执行新闻收集，提供商: ${provider}`);
      const result = await processAndSummarizeNews(provider);
      
      // 更新任务状态为已完成
      await completeTask(taskId, result);
      console.log(`[${new Date().toISOString()}] 任务执行成功，已更新状态为已完成`);
      
      // 获取最新的任务状态
      const updatedTask = await getTaskStatus(taskId);
      
      return NextResponse.json({
        success: true,
        message: '任务已创建并执行完成',
        data: { taskId, task: updatedTask, result }
      });
    } catch (processingError) {
      // 处理任务失败
      const errorMessage = processingError instanceof Error ? processingError.message : '处理任务时发生未知错误';
      await failTask(taskId, errorMessage);
      console.error(`[${new Date().toISOString()}] 任务执行失败:`, processingError);
      
      // 获取最新的任务状态
      const updatedTask = await getTaskStatus(taskId);
      
      return NextResponse.json({
        success: false,
        message: '任务执行失败',
        error: errorMessage,
        data: { taskId, task: updatedTask }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('创建或执行新闻收集任务失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建或执行任务失败'
      },
      { status: 500 }
    );
  }
}
