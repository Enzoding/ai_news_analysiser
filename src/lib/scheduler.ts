import { CronJob } from 'cron';
import { processAndSummarizeNews } from './news-processor';
import { LLMProvider } from '@/types';

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
    if (newsCollectionJob && newsCollectionJob.running) {
      newsCollectionJob.stop();
    }
    
    // 创建新任务
    newsCollectionJob = new CronJob(
      cronExpression,
      async () => {
        console.log(`[${new Date().toISOString()}] 执行定时新闻收集任务`);
        const result = await processAndSummarizeNews(provider);
        console.log(`[${new Date().toISOString()}] 任务结果:`, result);
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
    if (newsCollectionJob && newsCollectionJob.running) {
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
  
  return {
    running: newsCollectionJob.running,
    nextRun: newsCollectionJob.nextDate().toISOString()
  };
}

// 在服务器启动时自动启动定时任务
if (typeof window === 'undefined') {
  startNewsCollectionJob();
}
