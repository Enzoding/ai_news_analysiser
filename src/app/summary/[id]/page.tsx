import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProcessedNewsItem, NewsSummaryRecord } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

async function getSummaryDetails(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/summary/${id}`, {
      next: { revalidate: 60 } // 每分钟重新验证一次
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('获取摘要详情失败');
    }
    
    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('获取摘要详情失败:', error);
    return null;
  }
}

export default async function SummaryPage({ params }: { params: { id: string } }) {
  const details = await getSummaryDetails(params.id);
  
  if (!details || !details.record) {
    notFound();
  }
  
  const { record, news } = details;
  
  // 按新闻源分组
  const newsBySource: Record<string, typeof news> = {};
  news.forEach((item: ProcessedNewsItem) => {
    const sourceName = item.source_name || '未知来源';
    if (!newsBySource[sourceName]) {
      newsBySource[sourceName] = [];
    }
    newsBySource[sourceName].push(item);
  });
  
  const sourceNames = Object.keys(newsBySource);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-2">
            <Link href="/">返回摘要列表</Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{record.title}</h1>
          <p className="text-muted-foreground mt-1">
            创建于 {format(new Date(record.created_at), 'yyyy-MM-dd HH:mm')} · 包含 {record.items_count} 条新闻
          </p>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">全部新闻</TabsTrigger>
          {sourceNames.map(source => (
            <TabsTrigger key={source} value={source}>
              {source}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {news.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              没有找到相关新闻
            </div>
          ) : (
            news.map((item: ProcessedNewsItem) => (
              <NewsCard key={item.id} item={item} />
            ))
          )}
        </TabsContent>
        
        {sourceNames.map(source => (
          <TabsContent key={source} value={source} className="space-y-4">
            {newsBySource[source].map((item: ProcessedNewsItem) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function NewsCard({ item }: { item: ProcessedNewsItem }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{item.title}</CardTitle>
            <CardDescription className="mt-1">
              来源: {item.source_name} · 发布于 {format(new Date(item.pub_date), 'yyyy-MM-dd HH:mm')}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={item.original_link} target="_blank" rel="noopener noreferrer">
              查看原文
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">摘要</h3>
          <p className="text-muted-foreground whitespace-pre-line">{item.summary}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">大纲</h3>
          <div className="text-muted-foreground whitespace-pre-line">{item.outline}</div>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        总结于 {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}
      </CardFooter>
    </Card>
  );
}
