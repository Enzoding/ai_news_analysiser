"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { LLMProvider, LLMConfig } from "@/types";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ArrowUpDown, Check, ChevronsUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
  // LLM配置状态
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    defaultProvider: 'deepseek',
    fallbackProvider: 'grok',
    useProviderOrder: ['deepseek', 'grok']
  });
  const [llmConfigLoading, setLlmConfigLoading] = useState(true);
  const [savingLlmConfig, setSavingLlmConfig] = useState(false);
  
  // 定时任务状态
  const [jobStatus, setJobStatus] = useState<{ running: boolean; nextRun: string | null }>({
    running: false,
    nextRun: null,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cronExpression, setCronExpression] = useState("0 */6 * * *");
  const [provider, setProvider] = useState<LLMProvider>("deepseek");

  // 获取定时任务状态
  const fetchJobStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/scheduler");
      
      if (!response.ok) {
        throw new Error("获取定时任务状态失败");
      }
      
      const data = await response.json();
      setJobStatus(data.data || { running: false, nextRun: null });
    } catch (error) {
      console.error("获取定时任务状态失败:", error);
      toast.error("获取定时任务状态失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setLoading(false);
    }
  };

  // 启动或停止定时任务
  const toggleJob = async (action: "start" | "stop") => {
    try {
      setActionLoading(true);
      
      const response = await fetch("/api/scheduler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          cronExpression: action === "start" ? cronExpression : undefined,
          provider: action === "start" ? provider : undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`${action === "start" ? "启动" : "停止"}定时任务失败`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`${action === "start" ? "启动" : "停止"}定时任务成功`);
        setJobStatus(data.data || { running: false, nextRun: null });
      } else {
        throw new Error(data.error || `${action === "start" ? "启动" : "停止"}定时任务失败`);
      }
    } catch (error) {
      console.error(`${action === "start" ? "启动" : "停止"}定时任务失败:`, error);
      toast.error(`${action === "start" ? "启动" : "停止"}定时任务失败`, {
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 获取LLM配置
  const fetchLlmConfig = async () => {
    try {
      setLlmConfigLoading(true);
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getLLMConfig",
        }),
      });
      
      if (!response.ok) {
        throw new Error("获取LLM配置失败");
      }
      
      const data = await response.json();
      if (data.success && data.data) {
        setLlmConfig(data.data);
      }
    } catch (error) {
      console.error("获取LLM配置失败:", error);
      toast.error("获取LLM配置失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setLlmConfigLoading(false);
    }
  };

  // 保存LLM配置
  const saveLlmConfig = async () => {
    try {
      setSavingLlmConfig(true);
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "saveLLMConfig",
          config: llmConfig,
        }),
      });
      
      if (!response.ok) {
        throw new Error("保存LLM配置失败");
      }
      
      const data = await response.json();
      if (data.success) {
        toast.success("LLM配置已保存");
      } else {
        throw new Error(data.error || "保存LLM配置失败");
      }
    } catch (error) {
      console.error("保存LLM配置失败:", error);
      toast.error("保存LLM配置失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setSavingLlmConfig(false);
    }
  };

  // 更新默认提供商
  const updateDefaultProvider = (provider: LLMProvider) => {
    setLlmConfig(prev => ({
      ...prev,
      defaultProvider: provider
    }));
  };

  // 更新备用提供商
  const updateFallbackProvider = (provider: LLMProvider) => {
    setLlmConfig(prev => ({
      ...prev,
      fallbackProvider: provider
    }));
  };

  // 更新提供商顺序
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(llmConfig.useProviderOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setLlmConfig(prev => ({
      ...prev,
      useProviderOrder: items
    }));
  };

  // 初始化加载
  useEffect(() => {
    fetchJobStatus();
    fetchLlmConfig();
  }, []);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
        <p className="text-muted-foreground mt-2">管理系统配置和定时任务</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>定时任务设置</CardTitle>
          <CardDescription>
            设置自动收集新闻的定时任务
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">定时任务状态</h3>
                  <p className="text-sm text-muted-foreground">
                    {jobStatus.running ? "运行中" : "已停止"}
                  </p>
                </div>
                <div>
                  {jobStatus.running ? (
                    <Button
                      variant="destructive"
                      onClick={() => toggleJob("stop")}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "处理中..." : "停止任务"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => toggleJob("start")}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "处理中..." : "启动任务"}
                    </Button>
                  )}
                </div>
              </div>

              {jobStatus.nextRun && (
                <div>
                  <h3 className="font-medium">下次执行时间</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(jobStatus.nextRun).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Cron表达式</label>
                <Input
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                  placeholder="Cron表达式，例如：0 */6 * * *"
                />
                <p className="text-xs text-muted-foreground">
                  默认每6小时执行一次（0 */6 * * *）
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">大模型提供商</label>
                <div className="flex space-x-4">
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
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>LLM配置管理</CardTitle>
          <CardDescription>
            配置大模型调用优先级和策略
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {llmConfigLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">默认LLM提供商</label>
                <Select
                  value={llmConfig.defaultProvider}
                  onValueChange={(value: string) => updateDefaultProvider(value as LLMProvider)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择默认提供商" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deepseek">DeepSeek</SelectItem>
                    <SelectItem value="grok">Grok</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  默认使用的大模型提供商
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">备用LLM提供商</label>
                <Select
                  value={llmConfig.fallbackProvider || ""}
                  onValueChange={(value: string) => updateFallbackProvider(value as LLMProvider)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择备用提供商" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deepseek">DeepSeek</SelectItem>
                    <SelectItem value="grok">Grok</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  当默认提供商不可用时使用的备用提供商
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">提供商优先级顺序</label>
                <div className="border rounded-md p-4">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="providers">
                      {(provided: any) => (
                        <ul
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {llmConfig.useProviderOrder.map((provider, index) => (
                            <Draggable key={provider} draggableId={provider} index={index}>
                              {(provided: any) => (
                                <li
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="flex items-center justify-between p-2 border rounded-md bg-background"
                                >
                                  <div className="flex items-center">
                                    <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                                    <span>{provider === "deepseek" ? "DeepSeek" : "Grok"}</span>
                                  </div>
                                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                                </li>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </ul>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
                <p className="text-xs text-muted-foreground">
                  拖拽调整提供商的优先级顺序，系统将按此顺序尝试调用
                </p>
              </div>

              <Button
                onClick={saveLlmConfig}
                disabled={savingLlmConfig}
                className="w-full"
              >
                {savingLlmConfig ? "保存中..." : "保存LLM配置"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API密钥设置</CardTitle>
          <CardDescription>
            配置大模型API密钥
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">DeepSeek API密钥</label>
            <Input
              type="password"
              value="sk-kiucuvyvfgoovmnzneisrmcfxaxaofxzlulydorjishkocgw"
              readOnly
              disabled
            />
            <p className="text-xs text-muted-foreground">
              已通过环境变量配置，如需修改请更新环境变量DEEPSEEK_API_KEY
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Grok API密钥</label>
            <Input
              type="password"
              value="xai-F6mxqy4VauptUAFhuQ6wr0Hv19SFxLsSU6GGYXyhpcAnFK65S5jDgc1lP9aLsapegZ9qNMHwHBCvB8mO"
              readOnly
              disabled
            />
            <p className="text-xs text-muted-foreground">
              已通过环境变量配置，如需修改请更新环境变量GROK_API_KEY
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>关于</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI新闻助手 - 自动收集和总结AI领域最新新闻
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            版本：1.0.0
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
