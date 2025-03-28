import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SummaryCard } from "@/components/summary-card";
import { LoadingState } from "@/components/loading-state";
import { NewsSummaryRecord } from "@/types";

async function getSummaryRecords() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/summary`, {
      next: { revalidate: 60 } // 每分钟重新验证一次
    });
    
    if (!response.ok) {
      throw new Error('获取摘要记录失败');
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('获取摘要记录失败:', error);
    return [];
  }
}

export default async function Home() {
  const records = await getSummaryRecords();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI新闻摘要</h1>
          <p className="text-muted-foreground mt-2">查看AI领域最新新闻摘要和大纲</p>
        </div>
        <Button asChild>
          <Link href="/manual-trigger">手动触发</Link>
        </Button>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">暂无新闻摘要</p>
          <Button asChild>
            <Link href="/manual-trigger">立即生成</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record: NewsSummaryRecord) => (
            <SummaryCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}