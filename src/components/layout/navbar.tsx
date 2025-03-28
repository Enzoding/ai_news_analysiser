import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">AI新闻助手</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            新闻摘要
          </Link>
          <Link
            href="/sources"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            订阅源管理
          </Link>
          <Link
            href="/settings"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            系统设置
          </Link>
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/manual-trigger">
              手动触发
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
