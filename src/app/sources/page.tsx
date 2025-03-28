"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { NewsSource } from "@/types";

export default function SourcesPage() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSource, setNewSource] = useState({
    name: "",
    url: "",
    type: "rss" as 'rss' | 'api' | 'blog',
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  // 获取所有新闻源
  const fetchSources = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/news-sources");
      
      if (!response.ok) {
        throw new Error("获取新闻源失败");
      }
      
      const data = await response.json();
      setSources(data.data || []);
    } catch (error) {
      console.error("获取新闻源失败:", error);
      toast.error("获取新闻源失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setLoading(false);
    }
  };

  // 添加新闻源
  const addSource = async () => {
    try {
      if (!newSource.name.trim() || !newSource.url.trim()) {
        toast.error("请填写完整信息");
        return;
      }
      
      const response = await fetch("/api/news-sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSource),
      });
      
      if (!response.ok) {
        throw new Error("添加新闻源失败");
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("添加新闻源成功");
        setNewSource({
          name: "",
          url: "",
          type: "rss",
        });
        setDialogOpen(false);
        fetchSources();
      } else {
        throw new Error(data.error || "添加新闻源失败");
      }
    } catch (error) {
      console.error("添加新闻源失败:", error);
      toast.error("添加新闻源失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    }
  };

  // 删除新闻源
  const deleteSource = async (id: string) => {
    try {
      const response = await fetch(`/api/news-sources/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("删除新闻源失败");
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("删除新闻源成功");
        fetchSources();
      } else {
        throw new Error(data.error || "删除新闻源失败");
      }
    } catch (error) {
      console.error("删除新闻源失败:", error);
      toast.error("删除新闻源失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchSources();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">订阅源管理</h1>
          <p className="text-muted-foreground mt-2">管理AI新闻订阅源</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>添加订阅源</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加新闻订阅源</DialogTitle>
              <DialogDescription>
                添加RSS源、API或博客以获取AI领域最新新闻
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">名称</label>
                <Input
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  placeholder="例如：机器之心"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL</label>
                <Input
                  value={newSource.url}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  placeholder="例如：https://www.jiqizhixin.com/rss"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">类型</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="type"
                      value="rss"
                      checked={newSource.type === "rss"}
                      onChange={() => setNewSource({ ...newSource, type: "rss" })}
                      className="h-4 w-4"
                    />
                    <span>RSS</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="type"
                      value="api"
                      checked={newSource.type === "api"}
                      onChange={() => setNewSource({ ...newSource, type: "api" })}
                      className="h-4 w-4"
                    />
                    <span>API</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="type"
                      value="blog"
                      checked={newSource.type === "blog"}
                      onChange={() => setNewSource({ ...newSource, type: "blog" })}
                      className="h-4 w-4"
                    />
                    <span>博客</span>
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={addSource}>添加</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {sources.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">暂无订阅源，请添加</p>
              <Button onClick={() => setDialogOpen(true)}>添加订阅源</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((source) => (
                <Card key={source.id}>
                  <CardHeader>
                    <CardTitle>{source.name}</CardTitle>
                    <CardDescription className="truncate">
                      {source.url}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {source.type === "rss"
                          ? "RSS"
                          : source.type === "api"
                          ? "API"
                          : "博客"}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`确定要删除 ${source.name} 吗？`)) {
                          deleteSource(source.id);
                        }
                      }}
                    >
                      删除
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* 预设订阅源提示 */}
      <Card>
        <CardHeader>
          <CardTitle>系统预设订阅源</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            系统已预设以下订阅源，您可以点击添加按钮快速添加：
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">机器之心</p>
                <p className="text-xs text-muted-foreground">https://www.jiqizhixin.com/rss</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNewSource({
                    name: "机器之心",
                    url: "https://www.jiqizhixin.com/rss",
                    type: "rss",
                  });
                  setDialogOpen(true);
                }}
              >
                添加
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">TechCrunch AI</p>
                <p className="text-xs text-muted-foreground">https://techcrunch.com/category/artificial-intelligence/feed/</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNewSource({
                    name: "TechCrunch AI",
                    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
                    type: "rss",
                  });
                  setDialogOpen(true);
                }}
              >
                添加
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">VentureBeat AI</p>
                <p className="text-xs text-muted-foreground">https://venturebeat.com/category/ai/feed/</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNewSource({
                    name: "VentureBeat AI",
                    url: "https://venturebeat.com/category/ai/feed/",
                    type: "rss",
                  });
                  setDialogOpen(true);
                }}
              >
                添加
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
