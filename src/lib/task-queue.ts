import { supabase } from './supabase';
import { LLMProvider } from '@/types';

// 任务类型
export type TaskType = 'news_collection';

// 任务状态
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

// 任务参数
export interface NewsCollectionParams {
  provider: LLMProvider;
}

// 任务结果
export interface NewsCollectionResult {
  success: boolean;
  count: number;
  message: string;
  recordId?: string;
}

// 任务进度信息
export interface TaskProgress {
  step: string;
  progress: number; // 0-100
  details?: any;
}

// 任务接口
export interface Task {
  id: string;
  task_type: TaskType;
  status: TaskStatus;
  params: NewsCollectionParams;
  result?: NewsCollectionResult;
  error?: string;
  progress?: TaskProgress;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

/**
 * 创建新闻收集任务
 * @param provider LLM提供商
 * @returns 任务ID
 */
export async function createNewsCollectionTask(provider: LLMProvider): Promise<string> {
  const { data, error } = await supabase
    .from('task_queue')
    .insert([
      {
        task_type: 'news_collection',
        status: 'pending',
        params: { provider }
      }
    ])
    .select();

  if (error || !data || data.length === 0) {
    throw new Error(`创建任务失败: ${error?.message}`);
  }

  return data[0].id;
}

/**
 * 获取任务状态
 * @param taskId 任务ID
 * @returns 任务信息
 */
export async function getTaskStatus(taskId: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('task_queue')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) {
    console.error('获取任务状态失败:', error);
    return null;
  }

  return data as Task;
}

/**
 * 获取下一个待处理任务
 * @returns 待处理任务
 */
export async function getNextPendingTask(): Promise<Task | null> {
  const { data, error } = await supabase
    .from('task_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // 没有找到记录，返回null
      return null;
    }
    console.error('获取待处理任务失败:', error);
    return null;
  }

  return data as Task;
}

/**
 * 更新任务状态为处理中
 * @param taskId 任务ID
 * @returns 是否成功
 */
export async function updateTaskToProcessing(taskId: string): Promise<boolean> {
  const { error } = await supabase
    .from('task_queue')
    .update({
      status: 'processing',
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId);

  if (error) {
    console.error('更新任务状态失败:', error);
    return false;
  }

  return true;
}

/**
 * 更新任务状态为已完成
 * @param taskId 任务ID
 * @param result 任务结果
 * @returns 是否成功
 */
export async function completeTask(
  taskId: string,
  result: NewsCollectionResult
): Promise<boolean> {
  const { error } = await supabase
    .from('task_queue')
    .update({
      status: 'completed',
      result,
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    })
    .eq('id', taskId);

  if (error) {
    console.error('更新任务状态失败:', error);
    return false;
  }

  return true;
}

/**
 * 更新任务状态为失败
 * @param taskId 任务ID
 * @param errorMessage 错误信息
 * @returns 是否成功
 */
export async function failTask(taskId: string, errorMessage: string): Promise<boolean> {
  const { error } = await supabase
    .from('task_queue')
    .update({
      status: 'failed',
      error: errorMessage,
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    })
    .eq('id', taskId);

  if (error) {
    console.error('更新任务状态失败:', error);
    return false;
  }

  return true;
}

/**
 * 更新任务进度
 * @param taskId 任务ID
 * @param progress 进度信息
 * @returns 是否成功
 */
export async function updateTaskProgress(taskId: string, progress: TaskProgress): Promise<boolean> {
  const { error } = await supabase
    .from('task_queue')
    .update({
      progress,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId);

  if (error) {
    console.error('更新任务进度失败:', error);
    return false;
  }

  return true;
}
