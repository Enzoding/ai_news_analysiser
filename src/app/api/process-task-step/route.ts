import { NextRequest, NextResponse } from 'next/server';
import { getTaskStatus } from '@/lib/task-queue';
import { ProcessingState, ProcessingStep, processTaskStep } from '@/lib/task-processor';

/**
 * 处理任务的单个步骤
 * 不使用 Edge 运行时，因为我们需要使用 Node.js 特定的模块
 */

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { taskId, step, provider, ...state } = body;
    
    // 验证必要参数
    if (!taskId) {
      return NextResponse.json({
        success: false,
        message: '缺少必要的参数: taskId'
      }, { status: 400 });
    }
    
    // 如果没有指定步骤，则获取任务状态并确定下一步
    let currentState: ProcessingState;
    
    if (!step) {
      // 获取任务状态
      const task = await getTaskStatus(taskId);
      
      if (!task) {
        return NextResponse.json({
          success: false,
          message: `任务 ${taskId} 不存在`
        }, { status: 404 });
      }
      
      if (task.status !== 'processing') {
        return NextResponse.json({
          success: false,
          message: `任务 ${taskId} 不是处理中状态，当前状态: ${task.status}`
        }, { status: 400 });
      }
      
      // 初始化处理状态
      currentState = {
        taskId,
        step: ProcessingStep.FETCH_NEWS,
        provider: provider || task.params.provider
      };
    } else {
      // 使用请求中的状态
      currentState = {
        taskId,
        step,
        provider: provider || 'deepseek',
        ...state
      };
    }
    
    console.log(`[${new Date().toISOString()}] 处理任务步骤: ${currentState.step}, 任务ID: ${taskId}`);
    
    // 处理当前步骤
    const updatedState = await processTaskStep(currentState);
    
    // 检查是否有错误
    if (updatedState.error) {
      return NextResponse.json({
        success: false,
        message: updatedState.error,
        state: updatedState
      }, { status: 500 });
    }
    
    // 返回更新后的状态
    return NextResponse.json({
      success: true,
      state: updatedState,
      nextStep: updatedState.step,
      isComplete: updatedState.step === ProcessingStep.COMPLETE
    });
  } catch (error) {
    console.error('处理任务步骤失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '处理任务步骤失败'
      },
      { status: 500 }
    );
  }
}
