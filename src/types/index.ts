// 新闻源类型
export interface NewsSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api' | 'blog';
  created_at: string;
}

// 原始新闻文章类型
export interface RawNewsItem {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  source_id: string;
}

// 处理后的新闻文章类型
export interface ProcessedNewsItem {
  id: string;
  title: string;
  original_link: string;
  pub_date: string;
  source_id: string;
  summary: string;
  outline: string;
  created_at: string;
  source_name?: string;
}

// 新闻摘要记录类型
export interface NewsSummaryRecord {
  id: string;
  created_at: string;
  title: string;
  items_count: number;
}

// 大模型提供商类型
export type LLMProvider = 'deepseek' | 'grok';
