-- 向 task_queue 表添加 progress 字段
ALTER TABLE task_queue ADD COLUMN IF NOT EXISTS progress JSONB DEFAULT NULL;
