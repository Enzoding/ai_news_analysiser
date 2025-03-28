-- 创建新闻源表
CREATE TABLE IF NOT EXISTS news_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rss', 'api', 'blog')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建处理后的新闻表
CREATE TABLE IF NOT EXISTS processed_news (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  original_link TEXT NOT NULL UNIQUE,
  pub_date TIMESTAMP WITH TIME ZONE NOT NULL,
  source_id UUID NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  outline TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建摘要记录表
CREATE TABLE IF NOT EXISTS summary_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  items_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建新闻与摘要记录关联表
CREATE TABLE IF NOT EXISTS news_record_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_id UUID NOT NULL REFERENCES processed_news(id) ON DELETE CASCADE,
  record_id UUID NOT NULL REFERENCES summary_records(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(news_id, record_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_processed_news_source_id ON processed_news(source_id);
CREATE INDEX IF NOT EXISTS idx_processed_news_pub_date ON processed_news(pub_date);
CREATE INDEX IF NOT EXISTS idx_news_record_relations_news_id ON news_record_relations(news_id);
CREATE INDEX IF NOT EXISTS idx_news_record_relations_record_id ON news_record_relations(record_id);

-- 插入默认新闻源
INSERT INTO news_sources (name, url, type) VALUES
('机器之心', 'https://www.jiqizhixin.com/rss', 'rss'),
('TechCrunch AI', 'https://techcrunch.com/category/artificial-intelligence/feed/', 'rss'),
('VentureBeat AI', 'https://venturebeat.com/category/ai/feed/', 'rss')
ON CONFLICT (id) DO NOTHING;
