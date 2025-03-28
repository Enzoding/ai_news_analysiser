import { CronJob } from 'cron';
import { processAndSummarizeNews } from './news-processor';
import { LLMProvider } from '@/types';
import { getNextPendingTask, updateTaskToProcessing, completeTask, failTask } from './task-queue';

let newsCollectionJob: CronJob | null = null;

/**
 * 启动定时新闻收集任务
 * @param cronExpression cron表达式，默认每6小时执行一次
 * @param provider LLM提供商
 * @returns 任务是否成功启动
 */
export function startNewsCollectionJob(
  cronExpression = '0 */6 * * *', // 默认每6小时执行一次
  provider: LLMProvider = 'deepseek'
): boolean {
  try {
    // 如果已有任务在运行，先停止
    if (newsCollectionJob) {
      newsCollectionJob.stop();
    }
    
    // 创建新任务
    newsCollectionJob = new CronJob(
      cronExpression,
      async () => {
        console.log(`[${new Date().toISOString()}] 执行定时任务检查`);
        
        // 检查是否有待处理的任务
        const task = await getNextPendingTask();
        
        if (!task) {
          console.log(`[${new Date().toISOString()}] 没有待处理的任务`);
          return;
        }
        
        console.log(`[${new Date().toISOString()}] 开始处理任务: ${task.id}`);
        
        // 更新任务状态为处理中
        await updateTaskToProcessing(task.id);
        
        try {
          // 根据任务类型处理任务
          if (task.task_type === 'news_collection') {
            // 执行新闻收集
            const result = await processAndSummarizeNews(task.params.provider);
            
            // 更新任务状态为已完成
            await completeTask(task.id, result);
            
            console.log(`[${new Date().toISOString()}] 任务 ${task.id} 处理成功:`, result);
          } else {
            // 不支持的任务类型
            await failTask(task.id, `不支持的任务类型: ${task.task_type}`);
            console.error(`[${new Date().toISOString()}] 不支持的任务类型: ${task.task_type}`);
          }
        } catch (error) {
          // 处理任务失败
          const errorMessage = error instanceof Error ? error.message : '处理任务时发生未知错误';
          await failTask(task.id, errorMessage);
          
          console.error(`[${new Date().toISOString()}] 处理任务 ${task.id} 失败:`, error);
        }
      },
      null, // onComplete
      true, // start
      'Asia/Shanghai' // 时区
    );
    
    return true;
  } catch (error) {
    console.error('启动定时任务失败:', error);
    return false;
  }
}

/**
 * 停止定时新闻收集任务
 * @returns 任务是否成功停止
 */
export function stopNewsCollectionJob(): boolean {
  try {
    if (newsCollectionJob) {
      newsCollectionJob.stop();
      return true;
    }
    return false;
  } catch (error) {
    console.error('停止定时任务失败:', error);
    return false;
  }
}

/**
 * 获取定时任务状态
 * @returns 任务状态
 */
export function getJobStatus(): { running: boolean; nextRun: string | null } {
  if (!newsCollectionJob) {
    return { running: false, nextRun: null };
  }
  
  // 安全地访问 running 属性和 nextDate 方法
  try {
    const running = (newsCollectionJob as any).running === true;
    const nextDate = (newsCollectionJob as any).nextDate();
    const nextRun = nextDate ? nextDate.toString() : null;
    
    return {
      running,
      nextRun
    };
  } catch (error) {
    console.error('获取任务状态失败:', error);
    return { running: false, nextRun: null };
  }
}

// 在服务器启动时自动启动定时任务
if (typeof window === 'undefined') {
  startNewsCollectionJob();
}
