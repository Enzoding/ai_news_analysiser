import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { NewsSummaryRecord } from "@/types";

interface SummaryCardProps {
  record: NewsSummaryRecord;
}

export function SummaryCard({ record }: SummaryCardProps) {
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="flex-none">
        <CardTitle className="line-clamp-2 text-lg">
          <Link href={`/summary/${record.id}`} className="hover:underline">
            {record.title}
          </Link>
        </CardTitle>
        <CardDescription>
          创建于 {format(new Date(record.created_at), "yyyy-MM-dd HH:mm")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground">
          包含 {record.items_count} 条新闻
        </p>
      </CardContent>
      <CardFooter className="flex-none">
        <Link
          href={`/summary/${record.id}`}
          className="text-xs text-muted-foreground hover:underline"
        >
          查看详情
        </Link>
      </CardFooter>
    </Card>
  );
}
