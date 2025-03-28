"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LLMProvider } from "@/types";

export default function ManualTriggerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<LLMProvider>("deepseek");

  const handleTrigger = async () => {
    try {
      setLoading(true);
      
      // 使用新的手动触发API，只创建任务不执行实际处理
      const response = await fetch(`/api/manual-trigger?provider=${provider}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "触发新闻收集失败");
      }
      
      if (data.success) {
        toast.success("任务已创建", {
          description: "新闻收集任务已添加到队列，将在后台处理",
        });
        
        // 跳转到首页
        router.push("/");
      } else {
        toast.error("创建任务失败", {
          description: data.error || "未知错误",
        });
      }
    } catch (error) {
      console.error("触发新闻收集失败:", error);
      toast.error("触发新闻收集失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Button variant="outline" size="sm" asChild className="mb-2">
          <Link href="/">返回摘要列表</Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">手动触发新闻收集</h1>
        <p className="text-muted-foreground mt-2">
          手动触发新闻收集和摘要生成，系统将从配置的RSS源获取最新新闻，并使用大模型生成摘要和大纲
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>选择大模型</CardTitle>
          <CardDescription>
            选择用于生成新闻摘要和大纲的大模型
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="provider"
                value="deepseek"
                checked={provider === "deepseek"}
                onChange={() => setProvider("deepseek")}
                className="h-4 w-4"
              />
              <span>DeepSeek</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="provider"
                value="grok"
                checked={provider === "grok"}
                onChange={() => setProvider("grok")}
                className="h-4 w-4"
              />
              <span>Grok</span>
            </label>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleTrigger} disabled={loading}>
            {loading ? "处理中..." : "开始收集并总结"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>定时任务设置</CardTitle>
          <CardDescription>
            设置自动收集新闻的定时任务
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            系统已配置为每6小时自动收集一次新闻，您也可以在系统设置中修改定时任务的频率
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild>
            <Link href="/settings">前往系统设置</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
