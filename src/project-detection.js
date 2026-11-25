const TELEGRAM_DEPENDENCIES = [
  /\baiogram\b/i, /python-telegram-bot/i, /pytelegrambotapi/i,
  /node-telegram-bot-api/i, /\btelegraf\b/i, /\bgrammy\b|@grammyjs\//i,
  /\bteloxide\b/i, /github\.com\/go-telegram-bot-api\/telegram-bot-api/i,
  /longman\/telegram-bot-api/i, /telegram\.bot\b/i
];

const TELEGRAM_CODE_PATTERNS = [
  /\bfrom\s+aiogram(?:\.[\w.]+)?\s+import\b|\bimport\s+aiogram\b/i,
  /\bfrom\s+telegram(?:\.ext)?\s+import\b|\bimport\s+telegram\b/i,
  /\bfrom\s+telebot\s+import\b|\btelebot\.TeleBot\b/i,
  /\bfrom\s+['"](?:grammy|telegraf)['"]|\brequire\(\s*['"](?:grammy|telegraf)['"]\s*\)/i,
  /\bfrom\s+['"](?:grammy|telegraf)['"]|\brequire\(\s*['"](?:grammy|telegraf)['"]\s*\)/i,
  /\bnew\s+Telegraf\s*\(|\bnew\s+grammy\.Bot\s*\(/i,
  /\bApplicationBuilder\s*\(|\bCommandStart\b|\bDispatcher\s*\(/i,
  /\bTelegramBot\s*\(|\bTelegram\.Bot\b/i
];

const MANIFEST_NAMES = new Set([
  "requirements.txt", "pyproject.toml", "pipfile", "package.json",
  "go.mod", "cargo.toml", "composer.json", "gemfile"
]);

function basename(path) {
  return String(path || "").split("/").pop().toLowerCase();
}

/** Detect a Telegram bot from repository manifests and source code. */
export function detectTelegramBot({ files = [], contents = {} } = {}) {
  const entries = Object.entries(contents || {});
  const manifests = entries.filter(([path]) => MANIFEST_NAMES.has(basename(path)));
  const sources = entries.filter(([path]) => /\.(py|js|jsx|ts|tsx|mjs|cjs|go|rs|php|rb|cs)$/i.test(path));
  const manifestText = manifests.map(([, content]) => String(content || "")).join("\n");
  const sourceText = sources.map(([, content]) => String(content || "")).join("\n");

  const hasDependency = TELEGRAM_DEPENDENCIES.some(pattern => pattern.test(manifestText));
  const hasBotCode = TELEGRAM_CODE_PATTERNS.some(pattern => pattern.test(sourceText));
  const hasDirectBotApi = /api\.telegram\.org\/bot/i.test(sourceText);

  // Require corroborating evidence; a repo name or README mention is not enough.
  if (!((hasDependency && hasBotCode) || hasDirectBotApi)) {
    return { type: null, label: null, confidence: 0, evidence: [] };
  }

  const evidence = [];
  for (const [path, content] of manifests) {
    if (TELEGRAM_DEPENDENCIES.some(pattern => pattern.test(String(content || "")))) {
      evidence.push(path + ": Telegram bot SDK dependency");
    }
  }
  for (const [path, content] of sources) {
    if (TELEGRAM_CODE_PATTERNS.some(pattern => pattern.test(String(content || "")))) {
      evidence.push(path + ": Telegram bot API usage");
    }
  }

  return {
    type: "telegram_bot",
    label: "Telegram bot",
    confidence: hasDependency ? 0.99 : 0.94,
    evidence: [...new Set(evidence)].slice(0, 6)
  };
}
