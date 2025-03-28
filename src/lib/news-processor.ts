import { supabase } from './supabase';
import { fetchRssNews } from './rss-parser';
import { generateNewsSummary } from './llm-api';
import { getProviderToUse } from './llm-config';
import { NewsSource, RawNewsItem, ProcessedNewsItem, NewsSummaryRecord, LLMProvider } from '@/types';
import { format } from 'date-fns';

/**
 * 获取所有新闻源
 * @returns 新闻源数组
 */
export async function getAllNewsSources(): Promise<NewsSource[]> {
  const { data, error } = await supabase
    .from('news_sources')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('获取新闻源失败:', error);
    return [];
  }
  
  return data || [];
}

/**
 * 从所有新闻源获取最新新闻
 * @returns 原始新闻项数组
 */
export async function fetchAllLatestNews(): Promise<RawNewsItem[]> {
  const sources = await getAllNewsSources();
  let allNews: RawNewsItem[] = [];
  
  // 每个源最多获取10条新闻，为后续筛选留出空间
  const MAX_NEWS_PER_SOURCE = 10;
  
  for (const source of sources) {
    if (source.type === 'rss') {
      const news = await fetchRssNews(source.url, source.id);
      // 每个源最多添加10条
      allNews = [...allNews, ...news.slice(0, MAX_NEWS_PER_SOURCE)];
    }
    // 未来可以添加API和博客类型的处理
  }
  
  return allNews;
}

/**
 * 获取已处理的新闻项
 * @returns 已处理的新闻项ID集合
 */
export async function getProcessedNewsIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('processed_news')
    .select('original_link');
  
  if (error) {
    console.error('获取已处理新闻失败:', error);
    return new Set();
  }
  
  return new Set(data?.map(item => item.original_link) || []);
}

/**
 * 处理新闻并生成摘要
 * @param preferredProvider 首选LLM提供商（可选）
 * @returns 处理结果
 */
export async function processAndSummarizeNews(preferredProvider?: LLMProvider): Promise<{
  success: boolean;
  recordId?: string;
  count: number;
  message: string;
}> {
  try {
    // 获取最新新闻
    const latestNews = await fetchAllLatestNews();
    if (latestNews.length === 0) {
      return { success: false, count: 0, message: '没有找到新闻' };
    }
    
    // 获取已处理的新闻ID
    const processedIds = await getProcessedNewsIds();
    
    // 过滤出未处理的新闻
    const unprocessedNews = latestNews.filter(news => !processedIds.has(news.link));
    if (unprocessedNews.length === 0) {
      return { success: false, count: 0, message: '没有新的未处理新闻' };
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
    
    // 获取要使用的LLM提供商
    const provider = await getProviderToUse(preferredProvider);
    console.log(`使用${provider}模型处理新闻`);
    
    // 创建摘要记录
    const summaryTitle = `AI新闻摘要 - ${format(new Date(), 'yyyy-MM-dd HH:mm')}`;
    const { data: recordData, error: recordError } = await supabase
      .from('summary_records')
      .insert([{ title: summaryTitle, items_count: newsToProcess.length }])
      .select();
    
    if (recordError || !recordData || recordData.length === 0) {
      throw new Error(`创建摘要记录失败: ${recordError?.message}`);
    }
    
    const recordId = recordData[0].id;
    
    // 处理每条新闻
    const processedItems: ProcessedNewsItem[] = [];
    
    // 添加请求超时处理
    const TIMEOUT_DURATION = 180000; // 180秒超时，更适合大模型生成时间
    
    for (const news of newsToProcess) {
      const content = news.content || news.contentSnippet || '';
      
      try {
        // 使用LLM生成摘要和大纲，并添加超时处理
        const summaryPromise = generateNewsSummary(provider, news.title, content);
        
        // 创建超时Promise
        const timeoutPromise = new Promise<{summary: string; outline: string}>((_, reject) => {
          setTimeout(() => reject(new Error('生成摘要超时')), TIMEOUT_DURATION);
        });
        
        // 使用Promise.race实现超时处理
        const { summary, outline } = await Promise.race([summaryPromise, timeoutPromise]);
      
      
        processedItems.push({
          id: crypto.randomUUID(),
          title: news.title,
          original_link: news.link,
          pub_date: news.pubDate,
          source_id: news.source_id,
          summary,
          outline,
          created_at: new Date().toISOString()
        });
      } catch (error) {
        console.error(`处理新闻 [${news.title}] 失败:`, error);
        // 失败时使用简单的摘要
        processedItems.push({
          id: crypto.randomUUID(),
          title: news.title,
          original_link: news.link,
          pub_date: news.pubDate,
          source_id: news.source_id,
          summary: `无法生成摘要: ${error instanceof Error ? error.message : '未知错误'}`,
          outline: '无法生成大纲',
          created_at: new Date().toISOString()
        });
      }
    }
    
    // 保存处理后的新闻
    const { error: insertError } = await supabase
      .from('processed_news')
      .insert(processedItems);
    
    if (insertError) {
      throw new Error(`保存处理后的新闻失败: ${insertError.message}`);
    }
    
    // 保存新闻与摘要记录的关联
    const newsRecordRelations = processedItems.map(item => ({
      news_id: item.id,
      record_id: recordId
    }));
    
    const { error: relationsError } = await supabase
      .from('news_record_relations')
      .insert(newsRecordRelations);
    
    if (relationsError) {
      throw new Error(`保存新闻与摘要记录关联失败: ${relationsError.message}`);
    }
    
    return {
      success: true,
      recordId,
      count: processedItems.length,
      message: `成功处理 ${processedItems.length} 条新闻`
    };
  } catch (error) {
    console.error('处理新闻失败:', error);
    return {
      success: false,
      count: 0,
      message: `处理新闻失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 获取摘要记录列表
 * @param limit 限制数量
 * @returns 摘要记录数组
 */
export async function getSummaryRecords(limit = 20): Promise<NewsSummaryRecord[]> {
  const { data, error } = await supabase
    .from('summary_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('获取摘要记录失败:', error);
    return [];
  }
  
  return data || [];
}

/**
 * 获取摘要记录详情
 * @param recordId 摘要记录ID
 * @returns 摘要记录和相关新闻
 */
export async function getSummaryRecordDetails(recordId: string): Promise<{
  record: NewsSummaryRecord | null;
  news: ProcessedNewsItem[];
}> {
  // 获取摘要记录
  const { data: recordData, error: recordError } = await supabase
    .from('summary_records')
    .select('*')
    .eq('id', recordId)
    .single();
  
  if (recordError) {
    console.error('获取摘要记录详情失败:', recordError);
    return { record: null, news: [] };
  }
  
  // 获取关联的新闻ID
  const { data: relationsData, error: relationsError } = await supabase
    .from('news_record_relations')
    .select('news_id')
    .eq('record_id', recordId);
  
  if (relationsError) {
    console.error('获取新闻关联失败:', relationsError);
    return { record: recordData, news: [] };
  }
  
  const newsIds = relationsData.map(relation => relation.news_id);
  
  if (newsIds.length === 0) {
    return { record: recordData, news: [] };
  }
  
  // 获取新闻详情
  const { data: newsData, error: newsError } = await supabase
    .from('processed_news')
    .select(`
      *,
      news_sources:source_id (name)
    `)
    .in('id', newsIds);
  
  if (newsError) {
    console.error('获取新闻详情失败:', newsError);
    return { record: recordData, news: [] };
  }
  
  // 处理新闻数据，添加source_name字段
  const processedNews = newsData.map(item => ({
    ...item,
    source_name: item.news_sources?.name || '未知来源'
  }));
  
  return { record: recordData, news: processedNews };
}

/**
 * 获取新闻源的新闻
 * @param sourceId 新闻源ID
 * @param limit 限制数量
 * @returns 新闻数组
 */
export async function getNewsBySource(sourceId: string, limit = 50): Promise<ProcessedNewsItem[]> {
  const { data, error } = await supabase
    .from('processed_news')
    .select(`
      *,
      news_sources:source_id (name)
    `)
    .eq('source_id', sourceId)
    .order('pub_date', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('获取新闻源新闻失败:', error);
    return [];
  }
  
  // 处理新闻数据，添加source_name字段
  return data.map(item => ({
    ...item,
    source_name: item.news_sources?.name || '未知来源'
  }));
}
