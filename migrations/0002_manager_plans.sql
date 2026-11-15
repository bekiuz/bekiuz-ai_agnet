CREATE TABLE IF NOT EXISTS manager_plans (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  plan_json TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_steps (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  agent TEXT NOT NULL CHECK (agent IN ('manager','developer','monitoring','research','business','support','security')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  operation TEXT NOT NULL DEFAULT 'other' CHECK (operation IN ('analysis','code_change','deploy','external_message','monitoring','other')),
  requires_approval INTEGER NOT NULL DEFAULT 0 CHECK (requires_approval IN (0,1)),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','blocked','completed','cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_task_steps_task_order ON task_steps(task_id, step_order);
