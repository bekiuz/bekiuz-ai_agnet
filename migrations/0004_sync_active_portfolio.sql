-- Synchronise the 28 active products listed in PROJECT_PORTFOLIO.md.
-- This migration only updates the Manager registry; it does not deploy projects or touch their data.
INSERT INTO projects (id, name, category, repo_url, deployment_url, status) VALUES
  ('project-ai-manager', 'BEKIUZ AI Manager', 'platform', 'https://github.com/bekiuz/bekiuz-ai_agnet', NULL, 'not_connected'),
  ('project-jjk-arena', 'JJK Cursed Arena', 'game', 'https://github.com/bekiuz/jjk-cursed-arena', NULL, 'not_connected'),
  ('project-dublab', 'Bekiuz DubLab', 'media', 'https://github.com/bekiuz/bekiuz-dublab', NULL, 'not_connected'),
  ('project-ai-workers', 'BEKIUZ AI Workers', 'backend', 'https://github.com/bekiuz/bekiuz-ai-workers', NULL, 'not_connected'),
  ('project-bekiuz-company', 'Bekiuz Company', 'business', 'https://github.com/bekiuz/bekiuz-company', NULL, 'not_connected'),
  ('project-odiy', 'ODIY AI / IELTS', 'education', 'https://github.com/bekiuz/odiy-ai', NULL, 'not_connected'),
  ('project-bekiuz-build', 'Bekiuz Build', 'construction', 'https://github.com/bekiuz/BEKIUZ_BUILD', NULL, 'not_connected'),
  ('project-bekiuz-usta', 'BEKIUZ Usta', 'construction', 'https://github.com/bekiuz/BEKIUZ-Usta', NULL, 'not_connected'),
  ('project-market-ai', 'BEKIUZ Market AI', 'marketing', 'https://github.com/bekiuz/BEKIUZ-Market-AI', NULL, 'not_connected'),
  ('project-kunai', 'KunAI', 'productivity', 'https://github.com/bekiuz/KunAI', NULL, 'not_connected'),
  ('project-miniish', 'MiniIsh 2.0', 'marketplace', 'https://github.com/bekiuz/MiniIsh-2.0', NULL, 'not_connected'),
  ('project-ovozai', 'OvozAI', 'voice', 'https://github.com/bekiuz/OvozAI', NULL, 'not_connected'),
  ('project-biznesos', 'BiznesOS', 'business', 'https://github.com/bekiuz/BiznesOS', NULL, 'not_connected'),
  ('project-clipforge', 'ClipForge', 'content', 'https://github.com/bekiuz/ClipForge', NULL, 'not_connected'),
  ('project-codequest-uz', 'CodeQuest-UZ', 'education', 'https://github.com/bekiuz/CodeQuest-UZ', NULL, 'not_connected'),
  ('project-zuxrash', 'Zuxrash Android Assistant', 'mobile_assistant', 'https://github.com/bekiuz/zuxrash-android-assistant', NULL, 'not_connected'),
  ('project-nari-ai', 'Nari AI', 'ai_assistant', 'https://github.com/bekiuz/naricham', NULL, 'not_connected'),
  ('project-bekiuz-trade-ai', 'BEKIUZ TRADE AI', 'education', 'https://github.com/bekiuz/BEKIUZ-TRADE-AI', NULL, 'not_connected'),
  ('project-bekiuz-dictator', 'BEKIUZ Dictator', 'desktop_assistant', 'https://github.com/bekiuz/BEKIUZ-DICTATOR', NULL, 'not_connected'),
  ('project-heiyin-tv-dublaj-studio', 'Heiyin TV Dublaj Studio', 'media', 'https://github.com/bekiuz/heiyin-tv-dublaj-studio', NULL, 'not_connected'),
  ('project-aqlli-ustoz', 'Aqlli Ustoz', 'education', 'https://github.com/bekiuz/aqlli-ustoz', NULL, 'not_connected'),
  ('project-bekiuz-driving', 'Bekiuz Driving', 'game', 'https://github.com/bekiuz/bekiuz.driving', NULL, 'not_connected'),
  ('project-uzb-royale', 'Uzb Royale', 'game', 'https://github.com/bekiuz/uzb-royale', NULL, 'not_connected'),
  ('project-animelab', 'AnimeLab', 'education', 'https://github.com/bekiuz/animelab', NULL, 'not_connected'),
  ('project-odina-chocolate-universe', 'Odina Chocolate Universe', 'commerce', 'https://github.com/bekiuz/odina-chocolate-universe', NULL, 'not_connected'),
  ('project-music-bot', 'Bekiuz Music Bot', 'media', 'https://github.com/bekiuz/bekiuz-music-bot', NULL, 'not_connected'),
  ('project-forge', 'Bekiuz Forge', 'workspace', 'https://github.com/bekiuz/bekiuz-nexus', NULL, 'not_connected'),
  ('project-bekiuz-ai-core', 'BEKIUZ AI Core Worker', 'backend', 'https://github.com/bekiuz/bekiuz-ai', NULL, 'not_connected')
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  category = excluded.category,
  repo_url = excluded.repo_url,
  deployment_url = CASE
    WHEN excluded.id IN ('project-jjk-arena', 'project-miniish') THEN NULL
    ELSE projects.deployment_url
  END,
  updated_at = CURRENT_TIMESTAMP;
