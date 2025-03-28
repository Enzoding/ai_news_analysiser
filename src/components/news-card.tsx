import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ProcessedNewsItem } from "@/types";

interface NewsCardProps {
  item: ProcessedNewsItem;
  showSummary?: boolean;
  linkToDetail?: boolean;
}

export function NewsCard({ item, showSummary = true, linkToDetail = true }: NewsCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-none">
        <CardTitle className="line-clamp-2 text-lg">
          {linkToDetail ? (
            <Link href={`/news/${item.id}`} className="hover:underline">
              {item.title}
            </Link>
          ) : (
            <a href={item.original_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {item.title}
            </a>
          )}
        </CardTitle>
        <CardDescription>
          {item.source_name && (
            <span className="mr-2">{item.source_name}</span>
          )}
          <span>{format(new Date(item.pub_date), "yyyy-MM-dd")}</span>
        </CardDescription>
      </CardHeader>
      {showSummary && (
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground line-clamp-3">{item.summary}</p>
        </CardContent>
      )}
      <CardFooter className="flex-none">
        <a
          href={item.original_link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:underline"
        >
          查看原文
        </a>
      </CardFooter>
    </Card>
  );
}
