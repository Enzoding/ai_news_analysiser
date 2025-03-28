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
        
        try {
          // 检查是否有待处理的任务
          console.log(`[${new Date().toISOString()}] 正在获取待处理任务...`);
          const task = await getNextPendingTask();
          
          if (!task) {
            console.log(`[${new Date().toISOString()}] 没有待处理的任务`);
            return;
          }
          
          console.log(`[${new Date().toISOString()}] 找到待处理任务: ${task.id}, 类型: ${task.task_type}`);
          
          // 更新任务状态为处理中
          console.log(`[${new Date().toISOString()}] 正在更新任务状态为处理中...`);
          const updateResult = await updateTaskToProcessing(task.id);
          console.log(`[${new Date().toISOString()}] 更新任务状态结果:`, updateResult);
          
          // 根据任务类型处理任务
          if (task.task_type === 'news_collection') {
            console.log(`[${new Date().toISOString()}] 开始执行新闻收集任务, 提供商: ${task.params.provider}`);
            try {
              // 执行新闻收集
              const result = await processAndSummarizeNews(task.params.provider);
              
              // 更新任务状态为已完成
              console.log(`[${new Date().toISOString()}] 任务执行成功，正在更新任务状态...`);
              await completeTask(task.id, result);
              
              console.log(`[${new Date().toISOString()}] 任务 ${task.id} 处理成功:`, result);
            } catch (processingError) {
              // 处理任务失败
              const errorMessage = processingError instanceof Error ? processingError.message : '处理任务时发生未知错误';
              console.error(`[${new Date().toISOString()}] 处理任务失败:`, errorMessage);
              await failTask(task.id, errorMessage);
              
              console.error(`[${new Date().toISOString()}] 任务 ${task.id} 处理失败:`, processingError);
            }
          } else {
            // 不支持的任务类型
            const errorMessage = `不支持的任务类型: ${task.task_type}`;
            console.error(`[${new Date().toISOString()}] ${errorMessage}`);
            await failTask(task.id, errorMessage);
          }
        } catch (error) {
          console.error(`[${new Date().toISOString()}] 处理任务队列时发生错误:`, error);
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
  // 使用更频繁的检查间隔，每 1 分钟检查一次任务队列
  console.log('[Scheduler] 正在启动定时任务检查...');
  startNewsCollectionJob('*/1 * * * *');
  console.log('[Scheduler] 定时任务检查已启动，每 1 分钟检查一次任务队列');
}
