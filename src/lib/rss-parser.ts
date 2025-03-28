import Parser from 'rss-parser';
import { RawNewsItem } from '@/types';

// 创建RSS解析器实例
const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'content'],
      ['description', 'contentSnippet']
    ]
  }
});

/**
 * 从RSS源获取新闻
 * @param url RSS源URL
 * @param sourceId 新闻源ID
 * @returns 解析后的新闻项数组
 */
export async function fetchRssNews(url: string, sourceId: string): Promise<RawNewsItem[]> {
  try {
    const feed = await parser.parseURL(url);
    
    return feed.items.map(item => ({
      title: item.title || '',
      link: item.link || '',
      pubDate: item.pubDate || new Date().toISOString(),
      content: item.content || '',
      contentSnippet: item.contentSnippet || '',
      guid: item.guid || item.link || '',
      source_id: sourceId
    }));
  } catch (error) {
    console.error(`从 ${url} 获取RSS失败:`, error);
    return [];
  }
}
