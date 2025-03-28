-- 创建系统配置表
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认LLM配置
INSERT INTO system_config (key, value) VALUES
('llm_config', '{"defaultProvider": "deepseek", "fallbackProvider": "grok", "useProviderOrder": ["deepseek", "grok"]}')
ON CONFLICT (key) DO NOTHING;
