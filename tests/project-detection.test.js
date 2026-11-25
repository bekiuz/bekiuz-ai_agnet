import test from "node:test";
import assert from "node:assert/strict";
import { detectTelegramBot } from "../src/project-detection.js";

test("detects an aiogram Telegram bot from dependency and source evidence", () => {
  const result = detectTelegramBot({
    files: [{ name: "bot.py", type: "file" }, { name: "requirements.txt", type: "file" }],
    contents: {
      "requirements.txt": "aiogram>=3.13,<4.0\ngoogle-genai>=1.0",
      "bot.py": "from aiogram import Bot, Dispatcher\nbot = Bot(token=BOT_TOKEN)\ndp = Dispatcher()"
    }
  });
  assert.equal(result.type, "telegram_bot");
  assert.equal(result.label, "Telegram bot");
  assert.equal(result.confidence, 0.99);
  assert.equal(result.evidence.length, 2);
});

test("detects a Node Telegram bot using grammY", () => {
  const result = detectTelegramBot({
    files: [{ name: "package.json", type: "file" }, { name: "index.js", type: "file" }],
    contents: {
      "package.json": JSON.stringify({ dependencies: { grammy: "^1.21.0" } }),
      "index.js": "import { Bot } from 'grammy'; const bot = new Bot(process.env.BOT_TOKEN);"
    }
  });
  assert.equal(result.type, "telegram_bot");
  assert.equal(result.confidence, 0.99);
});

test("does not classify a web app from a Telegram mention in its README", () => {
  const result = detectTelegramBot({
    files: [{ name: "README.md", type: "file" }, { name: "package.json", type: "file" }],
    contents: {
      "README.md": "This web application can send a Telegram notification.",
      "package.json": JSON.stringify({ dependencies: { react: "^19.0.0" } })
    }
  });
  assert.equal(result.type, null);
  assert.equal(result.confidence, 0);
});

test("does not classify a repository from a bot.py filename alone", () => {
  const result = detectTelegramBot({
    files: [{ name: "bot.py", type: "file" }],
    contents: { "bot.py": "print('hello world')" }
  });
  assert.equal(result.type, null);
});

test("does not classify a Telegram API URL without bot-token or SDK evidence", () => {
  const result = detectTelegramBot({
    files: [{ name: "app.js", type: "file" }],
    contents: { "app.js": "const url = 'https://api.telegram.org/bot123456/sendMessage';" }
  });
  assert.equal(result.type, null);
});

test("detects direct Telegram Bot API calls only when a bot token variable is used", () => {
  const result = detectTelegramBot({
    files: [{ name: "telegram.js", type: "file" }],
    contents: {
      "telegram.js": "const BOT_TOKEN = process.env.BOT_TOKEN; fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage');"
    }
  });
  assert.equal(result.type, "telegram_bot");
  assert.equal(result.confidence, 0.94);
  assert.equal(result.evidence.length, 1);
});
