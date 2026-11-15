PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  repo_url TEXT,
  deployment_url TEXT,
  status TEXT NOT NULL DEFAULT 'not_connected'
    CHECK (status IN ('not_connected', 'healthy', 'degraded', 'down', 'paused', 'unknown')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  assigned_agent TEXT NOT NULL DEFAULT 'manager',
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'queued', 'in_progress', 'blocked', 'completed', 'cancelled')),
  kind TEXT NOT NULL DEFAULT 'manual'
    CHECK (kind IN ('manual', 'owner_command', 'agent_task', 'system')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  operation TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at TEXT,
  decision_note TEXT
);

CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  account_label TEXT,
  permission_level TEXT NOT NULL DEFAULT 'read_only',
  status TEXT NOT NULL DEFAULT 'not_connected'
    CHECK (status IN ('not_connected', 'connected', 'error', 'disabled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_status_created ON tasks(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

INSERT OR IGNORE INTO projects (id, name, category, repo_url, status) VALUES
  ('project-bekiuz-company', 'Bekiuz Company', 'company_platform', 'https://github.com/bekiuz/bekiuz-company', 'not_connected'),
  ('project-nari-ai', 'Nari AI', 'ai_product', 'https://github.com/bekiuz/naricham', 'not_connected'),
  ('project-dublab', 'Bekiuz DubLab', 'telegram_bot', 'https://github.com/bekiuz/bekiuz-dublab', 'not_connected'),
  ('project-bekiuz-build', 'Bekiuz Build', 'web_app', 'https://github.com/bekiuz/BEKIUZ_BUILD', 'not_connected'),
  ('project-zuxrash', 'Zuxrash Android Assistant', 'android_app', 'https://github.com/bekiuz/zuxrash-android-assistant', 'not_connected'),
  ('project-jjk-arena', 'JJK Arena', 'game', 'https://github.com/bekiuz/JJK-Cursed-Game', 'not_connected'),
  ('project-music-bot', 'Bekiuz Music Bot', 'telegram_bot', 'https://github.com/bekiuz/bekiuz-music-bot', 'not_connected'),
  ('project-miniish', 'MiniIsh', 'web_app', 'https://github.com/bekiuz/miniish-platform', 'not_connected'),
  ('project-forge', 'Bekiuz Forge', 'web_app', 'https://github.com/bekiuz/bekiuz-nexus', 'not_connected'),
  ('project-odiy', 'ODIY AI / IELTS', 'web_app', 'https://github.com/bekiuz/odiy-ai', 'not_connected');
