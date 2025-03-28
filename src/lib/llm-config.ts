import { LLMConfig, LLMProvider } from '@/types';
import { supabase } from './supabase';

// 默认LLM配置
const defaultLLMConfig: LLMConfig = {
  defaultProvider: 'deepseek',
  fallbackProvider: 'grok',
  useProviderOrder: ['deepseek', 'grok']
};

/**
 * 获取LLM配置
 * @returns LLM配置
 */
export async function getLLMConfig(): Promise<LLMConfig> {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .eq('key', 'llm_config')
      .single();
    
    if (error || !data) {
      console.log('未找到LLM配置，使用默认配置');
      return defaultLLMConfig;
    }
    
    return data.value as LLMConfig;
  } catch (error) {
    console.error('获取LLM配置失败:', error);
    return defaultLLMConfig;
  }
}

/**
 * 保存LLM配置
 * @param config LLM配置
 * @returns 是否保存成功
 */
export async function saveLLMConfig(config: LLMConfig): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('system_config')
      .upsert(
        { 
          key: 'llm_config', 
          value: config,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'key' }
      );
    
    if (error) {
      console.error('保存LLM配置失败:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('保存LLM配置失败:', error);
    return false;
  }
}

/**
 * 获取要使用的LLM提供商
 * 按照优先级顺序尝试使用配置的提供商
 * @param preferredProvider 优先使用的提供商（可选）
 * @returns 要使用的LLM提供商
 */
export async function getProviderToUse(preferredProvider?: LLMProvider): Promise<LLMProvider> {
  const config = await getLLMConfig();
  
  // 如果指定了优先提供商，优先使用
  if (preferredProvider) {
    return preferredProvider;
  }
  
  // 按照配置的顺序尝试使用提供商
  for (const provider of config.useProviderOrder) {
    // 这里可以添加检查API密钥是否有效的逻辑
    const apiKey = provider === 'deepseek' 
      ? process.env.DEEPSEEK_API_KEY 
      : process.env.GROK_API_KEY;
      
    if (apiKey) {
      return provider;
    }
  }
  
  // 都不可用时使用默认提供商
  return config.defaultProvider;
}
