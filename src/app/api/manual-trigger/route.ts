import { NextRequest, NextResponse } from 'next/server';
import { createNewsCollectionTask, getTaskStatus, updateTaskToProcessing } from '@/lib/task-queue';
import { LLMProvider } from '@/types';
import { ProcessingStep } from '@/lib/task-processor';

/**
 * 手动触发新闻收集任务
 * 这个接口只负责创建任务并触发处理过程，不等待任务完成
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
    
    // 更新任务状态为处理中
    await updateTaskToProcessing(taskId);
    
    // 使用新的分步处理 API
    const processStepUrl = `${request.nextUrl.origin}/api/process-task-step`;
    console.log(`[${new Date().toISOString()}] 触发任务分步处理 API: ${processStepUrl}`);
    
    // 准备请求体
    const requestBody = {
      taskId,
      step: ProcessingStep.FETCH_NEWS,
      provider
    };
    
    // 使用 fetch 的 no-wait 模式触发处理，不等待响应
    fetch(processStepUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
      .then(() => console.log(`[${new Date().toISOString()}] 任务分步处理请求已发送`))
      .catch(err => console.error(`[${new Date().toISOString()}] 发送任务分步处理请求失败:`, err));
    
    // 获取当前的任务状态
    const task = await getTaskStatus(taskId);
    
    // 立即返回响应，不等待任务完成
    return NextResponse.json({
      success: true,
      message: '任务已创建并开始处理，请稍后检查结果',
      data: { 
        taskId,
        task,
        statusCheckUrl: `/api/task-status?taskId=${taskId}`,
        note: '任务正在后台处理，可以使用上面的 URL 检查任务状态'
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 创建新闻收集任务失败:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建任务失败'
      },
      { status: 500 }
    );
  }
}
