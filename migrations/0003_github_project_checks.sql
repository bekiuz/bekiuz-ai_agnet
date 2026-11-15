CREATE TABLE IF NOT EXISTS project_checks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'github',
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL,
  is_private INTEGER,
  default_branch TEXT,
  last_commit_sha TEXT,
  last_commit_at TEXT,
  last_commit_message TEXT,
  root_files_json TEXT NOT NULL DEFAULT '[]',
  error TEXT,
  UNIQUE(project_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_project_checks_checked ON project_checks(checked_at DESC);
