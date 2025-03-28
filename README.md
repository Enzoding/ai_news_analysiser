# AI新闻助手

自动收集和总结AI领域最新新闻的应用程序，使用Next.js、TailwindCSS和Supabase构建。

## 功能特点

- 自动从RSS源收集AI领域最新新闻
- 使用大模型(DeepSeek、Grok)生成新闻摘要和大纲
- 支持手动触发和定时任务自动触发
- 按新闻源分类查看新闻
- 清爽简洁的现代UI界面

## 技术栈

- **前端框架**: Next.js
- **UI框架**: TailwindCSS + Shadcn/ui
- **数据库**: Supabase
- **部署**: Vercel (前端) + Supabase (后端+数据库)
- **大模型API**: DeepSeek、Grok

## 环境变量配置

在项目根目录创建`.env.local`文件，添加以下环境变量：

```
# 在此处添加您的环境变量
# 应用URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥

# 大模型API密钥
DEEPSEEK_API_KEY=你的DeepSeek API密钥
GROK_API_KEY=你的Grok API密钥
```

## 数据库设置

1. 在Supabase创建新项目
2. 使用`supabase/schema.sql`中的SQL脚本初始化数据库表结构
3. 将Supabase项目URL和匿名密钥添加到环境变量中

## 本地开发

1. 克隆项目

```bash
git clone <repository-url>
cd ai_news_analysis
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量（见上文）

4. 启动开发服务器

```bash
npm run dev
```

5. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)

## 部署

### Vercel部署

1. 在Vercel上导入项目
2. 配置环境变量
3. 部署

### Supabase设置

1. 在Supabase创建新项目
2. 使用`supabase/schema.sql`初始化数据库
3. 将Supabase项目URL和匿名密钥添加到Vercel环境变量中

## 使用说明

1. **订阅源管理**: 添加、删除RSS新闻源
2. **手动触发**: 手动触发新闻收集和摘要生成
3. **系统设置**: 配置定时任务和大模型提供商
4. **新闻摘要**: 查看已生成的新闻摘要和详情

## 预设RSS源

- 机器之心: https://www.jiqizhixin.com/rss
- TechCrunch AI: https://techcrunch.com/category/artificial-intelligence/feed/
- VentureBeat AI: https://venturebeat.com/category/ai/feed/
