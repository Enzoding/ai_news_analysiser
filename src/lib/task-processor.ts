import { supabase } from './supabase';
import { fetchAllLatestNews, getProcessedNewsIds } from './news-processor';
import { generateNewsSummary } from './llm-api';
import { getProviderToUse } from './llm-config';
import { RawNewsItem, ProcessedNewsItem, LLMProvider } from '@/types';
import { format } from 'date-fns';
import { completeTask, failTask, updateTaskProgress } from './task-queue';

/**
 * 任务处理步骤
 */
export enum ProcessingStep {
  FETCH_NEWS = 'fetch_news',
  FILTER_NEWS = 'filter_news',
  CREATE_SUMMARY_RECORD = 'create_summary_record',
  PROCESS_NEWS = 'process_news',
  SAVE_PROCESSED_NEWS = 'save_processed_news',
  COMPLETE = 'complete'
}

/**
 * 任务处理状态
 */
export interface ProcessingState {
  step: ProcessingStep;
  taskId: string;
  provider: LLMProvider;
  latestNews?: RawNewsItem[];
  newsToProcess?: RawNewsItem[];
  recordId?: string;
  processedItems?: ProcessedNewsItem[];
  currentNewsIndex?: number;
  totalNewsCount?: number;
  processedNewsCount?: number;
  error?: string;
}

/**
 * 处理任务的单个步骤
 * @param state 当前处理状态
 * @returns 更新后的处理状态
 */
export async function processTaskStep(state: ProcessingState): Promise<ProcessingState> {
  try {
    console.log(`[${new Date().toISOString()}] 处理任务步骤: ${state.step}, 任务ID: ${state.taskId}`);
    
    // 更新任务进度
    await updateTaskProgress(state.taskId, {
      step: state.step,
      progress: getProgressPercentage(state)
    });
    
    switch (state.step) {
      case ProcessingStep.FETCH_NEWS:
        return await fetchNewsStep(state);
      
      case ProcessingStep.FILTER_NEWS:
        return await filterNewsStep(state);
      
      case ProcessingStep.CREATE_SUMMARY_RECORD:
        return await createSummaryRecordStep(state);
      
      case ProcessingStep.PROCESS_NEWS:
        return await processNewsStep(state);
      
      case ProcessingStep.SAVE_PROCESSED_NEWS:
        return await saveProcessedNewsStep(state);
      
      case ProcessingStep.COMPLETE:
        return await completeTaskStep(state);
      
      default:
        throw new Error(`未知的处理步骤: ${state.step}`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 处理步骤 ${state.step} 失败:`, error);
    
    // 更新任务状态为失败
    const errorMessage = error instanceof Error ? error.message : '处理任务时发生未知错误';
    await failTask(state.taskId, errorMessage);
    
    return {
      ...state,
      error: errorMessage
    };
  }
}

/**
 * 获取当前进度百分比
 * @param state 当前处理状态
 * @returns 进度百分比 (0-100)
 */
function getProgressPercentage(state: ProcessingState): number {
  switch (state.step) {
    case ProcessingStep.FETCH_NEWS:
      return 10;
    case ProcessingStep.FILTER_NEWS:
      return 20;
    case ProcessingStep.CREATE_SUMMARY_RECORD:
      return 30;
    case ProcessingStep.PROCESS_NEWS:
      if (state.currentNewsIndex !== undefined && state.totalNewsCount && state.totalNewsCount > 0) {
        // 处理新闻的进度从30%到80%
        const processProgress = state.currentNewsIndex / state.totalNewsCount;
        return 30 + Math.floor(processProgress * 50);
      }
      return 40;
    case ProcessingStep.SAVE_PROCESSED_NEWS:
      return 90;
    case ProcessingStep.COMPLETE:
      return 100;
    default:
      return 0;
  }
}

/**
 * 获取最新新闻步骤
 */
async function fetchNewsStep(state: ProcessingState): Promise<ProcessingState> {
  // 获取最新新闻
  const latestNews = await fetchAllLatestNews();
  
  if (latestNews.length === 0) {
    throw new Error('没有找到新闻');
  }
  
  return {
    ...state,
    latestNews,
    step: ProcessingStep.FILTER_NEWS
  };
}

/**
 * 过滤新闻步骤
 */
async function filterNewsStep(state: ProcessingState): Promise<ProcessingState> {
  if (!state.latestNews) {
    throw new Error('缺少最新新闻数据');
  }
  
  // 获取已处理的新闻ID
  const processedIds = await getProcessedNewsIds();
  
  // 过滤出未处理的新闻
  const unprocessedNews = state.latestNews.filter(news => !processedIds.has(news.link));
  
  if (unprocessedNews.length === 0) {
    throw new Error('没有新的未处理新闻');
  }
  
  // 按新闻源分组
  const newsBySource = new Map<string, RawNewsItem[]>();
  unprocessedNews.forEach(news => {
    if (!newsBySource.has(news.source_id)) {
      newsBySource.set(news.source_id, []);
    }
    newsBySource.get(news.source_id)!.push(news);
  });
  
  // 每个源最多处理5条，合并为待处理列表
  const MAX_NEWS_PER_SOURCE = 5;
  let newsToProcess: RawNewsItem[] = [];
  
  for (const [source_id, sourceNews] of newsBySource.entries()) {
    const sourceNewsToProcess = sourceNews.slice(0, MAX_NEWS_PER_SOURCE);
    newsToProcess = [...newsToProcess, ...sourceNewsToProcess];
    console.log(`来源 ${source_id}: 共${sourceNews.length}条未处理新闻，处理${sourceNewsToProcess.length}条`);
  }
  
  console.log(`总计：共有 ${unprocessedNews.length} 条未处理新闻，本次处理 ${newsToProcess.length} 条`);
  
  return {
    ...state,
    newsToProcess,
    totalNewsCount: newsToProcess.length,
    processedNewsCount: 0,
    step: ProcessingStep.CREATE_SUMMARY_RECORD
  };
}

/**
 * 创建摘要记录步骤
 */
async function createSummaryRecordStep(state: ProcessingState): Promise<ProcessingState> {
  if (!state.newsToProcess) {
    throw new Error('缺少待处理新闻数据');
  }
  
  // 创建摘要记录
  const summaryTitle = `AI新闻摘要 - ${format(new Date(), 'yyyy-MM-dd HH:mm')}`;
  const { data: recordData, error: recordError } = await supabase
    .from('summary_records')
    .insert([{ title: summaryTitle, items_count: state.newsToProcess.length }])
    .select();
  
  if (recordError || !recordData || recordData.length === 0) {
    throw new Error(`创建摘要记录失败: ${recordError?.message}`);
  }
  
  const recordId = recordData[0].id;
  
  return {
    ...state,
    recordId,
    processedItems: [],
    currentNewsIndex: 0,
    step: ProcessingStep.PROCESS_NEWS
  };
}

/**
 * 处理新闻步骤 - 每次只处理一条新闻，避免超时
 */
async function processNewsStep(state: ProcessingState): Promise<ProcessingState> {
  if (!state.newsToProcess || !state.processedItems || state.currentNewsIndex === undefined) {
    throw new Error('缺少处理新闻所需的数据');
  }
  
  // 如果已经处理完所有新闻，进入下一步
  if (state.currentNewsIndex >= state.newsToProcess.length) {
    return {
      ...state,
      step: ProcessingStep.SAVE_PROCESSED_NEWS
    };
  }
  
  // 获取当前要处理的新闻
  const news = state.newsToProcess[state.currentNewsIndex];
  const content = news.content || news.contentSnippet || '';
  
  try {
    console.log(`[${new Date().toISOString()}] 处理第 ${state.currentNewsIndex + 1}/${state.newsToProcess.length} 条新闻: ${news.title}`);
    
    // 获取要使用的LLM提供商
    const provider = await getProviderToUse(state.provider);
    
    // 使用LLM生成摘要和大纲
    const { summary, outline } = await generateNewsSummary(provider, news.title, content);
    
    // 添加到已处理列表
    const processedItem: ProcessedNewsItem = {
      id: crypto.randomUUID(),
      title: news.title,
      original_link: news.link,
      pub_date: news.pubDate,
      source_id: news.source_id,
      summary,
      outline,
      created_at: new Date().toISOString()
    };
    
    const updatedProcessedItems = [...state.processedItems, processedItem];
    
    // 更新状态，处理下一条新闻
    return {
      ...state,
      processedItems: updatedProcessedItems,
      currentNewsIndex: state.currentNewsIndex + 1,
      processedNewsCount: (state.processedNewsCount || 0) + 1,
      step: ProcessingStep.PROCESS_NEWS // 保持在同一步骤，直到处理完所有新闻
    };
  } catch (error) {
    console.error(`处理新闻 [${news.title}] 失败:`, error);
    
    // 失败时使用简单的摘要
    const processedItem: ProcessedNewsItem = {
      id: crypto.randomUUID(),
      title: news.title,
      original_link: news.link,
      pub_date: news.pubDate,
      source_id: news.source_id,
      summary: `无法生成摘要: ${error instanceof Error ? error.message : '未知错误'}`,
      outline: '无法生成大纲',
      created_at: new Date().toISOString()
    };
    
    const updatedProcessedItems = [...state.processedItems, processedItem];
    
    // 更新状态，处理下一条新闻
    return {
      ...state,
      processedItems: updatedProcessedItems,
      currentNewsIndex: state.currentNewsIndex + 1,
      processedNewsCount: (state.processedNewsCount || 0) + 1,
      step: ProcessingStep.PROCESS_NEWS // 保持在同一步骤，直到处理完所有新闻
    };
  }
}

/**
 * 保存处理后的新闻步骤
 */
async function saveProcessedNewsStep(state: ProcessingState): Promise<ProcessingState> {
  if (!state.processedItems || !state.recordId) {
    throw new Error('缺少已处理新闻数据或记录ID');
  }
  
  // 保存处理后的新闻
  const { error: insertError } = await supabase
    .from('processed_news')
    .insert(state.processedItems.map(item => ({
      ...item,
      summary_record_id: state.recordId
    })));
  
  if (insertError) {
    throw new Error(`保存处理后的新闻失败: ${insertError.message}`);
  }
  
  return {
    ...state,
    step: ProcessingStep.COMPLETE
  };
}

/**
 * 完成任务步骤
 */
async function completeTaskStep(state: ProcessingState): Promise<ProcessingState> {
  if (!state.processedItems) {
    throw new Error('缺少已处理新闻数据');
  }
  
  // 更新任务状态为已完成
  await completeTask(state.taskId, {
    success: true,
    count: state.processedItems.length,
    message: `成功处理 ${state.processedItems.length} 条新闻`,
    recordId: state.recordId
  });
  
  return state;
}
