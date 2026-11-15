const COOKIE_NAME = "bkm_session";
const SESSION_TTL = 12 * 60 * 60;
const MODEL = "@cf/google/gemma-4-26b-a4b-it";

const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=()"
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8", ...extra }
  });
}

function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function hmacKey(secret, usages) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages
  );
}

async function createSession(secret) {
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    sub: "owner",
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL
  })));
  const key = await hmacKey(secret, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return payload + "." + base64UrlEncode(new Uint8Array(signature));
}

async function verifySession(token, secret) {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  try {
    const key = await hmacKey(secret, ["verify"]);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(parts[1]),
      new TextEncoder().encode(parts[0])
    );
    if (!valid) return false;
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0])));
    return payload.sub === "owner" && Number(payload.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return "";
}

async function constantTimeEqual(left, right) {
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right))
  ]);
  const aa = new Uint8Array(a);
  const bb = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < aa.length; i++) difference |= aa[i] ^ bb[i];
  return difference === 0;
}

async function readJson(request) {
  const type = request.headers.get("Content-Type") || "";
  if (!type.toLowerCase().includes("application/json")) {
    throw new Error("JSON format is required.");
  }
  const text = await request.text();
  if (text.length > 12_000) throw new Error("Request is too large.");
  return JSON.parse(text || "{}");
}

async function audit(env, action, targetType, targetId, details = {}) {
  if (!env.DB) return;
  await env.DB.prepare(
    "INSERT INTO audit_logs (id, actor, action, target_type, target_id, details_json) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(
    crypto.randomUUID(),
    "owner",
    action,
    targetType,
    targetId || null,
    JSON.stringify(details)
  ).run();
}

async function requireDatabase(env) {
  if (!env.DB) return json({ error: "DATABASE_NOT_CONFIGURED", message: "D1 database binding DB is not configured." }, 503);
  return null;
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();

  if (path === "/api/health" && method === "GET") {
    return json({
      ok: true,
      service: "BEKIUZ AI Manager",
      stage: "foundation",
      authConfigured: Boolean(env.ADMIN_PASSWORD && env.SESSION_SECRET),
      databaseConfigured: Boolean(env.DB),
      aiConfigured: Boolean(env.AI),
      timestamp: new Date().toISOString()
    });
  }

  if (path === "/api/auth/login" && method === "POST") {
    if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
      return json({ error: "AUTH_NOT_CONFIGURED", message: "Set ADMIN_PASSWORD and SESSION_SECRET as Worker secrets first." }, 503);
    }
    let body;
    try { body = await readJson(request); } catch (error) {
      return json({ error: "INVALID_REQUEST", message: error.message }, 400);
    }
    const password = typeof body.password === "string" ? body.password : "";
    if (!password || password.length > 256 || !(await constantTimeEqual(password, env.ADMIN_PASSWORD))) {
      return json({ error: "INVALID_CREDENTIALS", message: "Parol noto‘g‘ri." }, 401);
    }
    const token = await createSession(env.SESSION_SECRET);
    return json({ ok: true, user: { role: "owner" } }, 200, {
      "Set-Cookie": COOKIE_NAME + "=" + token + "; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=" + SESSION_TTL
    });
  }

  if (path === "/api/auth/logout" && method === "POST") {
    return json({ ok: true }, 200, {
      "Set-Cookie": COOKIE_NAME + "=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
    });
  }

  if (path === "/api/auth/me" && method === "GET") {
    const valid = await verifySession(getCookie(request, COOKIE_NAME), env.SESSION_SECRET);
    return valid ? json({ authenticated: true, user: { role: "owner" } }) : json({ authenticated: false }, 401);
  }

  const validSession = await verifySession(getCookie(request, COOKIE_NAME), env.SESSION_SECRET);
  if (!validSession) return json({ error: "UNAUTHORIZED", message: "Avval tizimga kiring." }, 401);

  const dbError = await requireDatabase(env);
  if (dbError) return dbError;

  if (path === "/api/bootstrap" && method === "GET") {
    const [projectsResult, tasksResult, counts, approvalsResult, activityResult] = await Promise.all([
      env.DB.prepare("SELECT id, name, category, repo_url, deployment_url, status, updated_at FROM projects ORDER BY name").all(),
      env.DB.prepare("SELECT id, title, description, project_id, assigned_agent, priority, status, created_at FROM tasks ORDER BY created_at DESC LIMIT 20").all(),
      env.DB.prepare("SELECT (SELECT COUNT(*) FROM projects) AS projects, (SELECT COUNT(*) FROM tasks) AS tasks, (SELECT COUNT(*) FROM tasks WHERE status = 'in_progress') AS active, (SELECT COUNT(*) FROM approvals WHERE status = 'pending') AS pending_approvals").first(),
      env.DB.prepare("SELECT id, title, operation, requested_at FROM approvals WHERE status = 'pending' ORDER BY requested_at DESC LIMIT 10").all(),
      env.DB.prepare("SELECT id, action, target_type, target_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 12").all()
    ]);
    return json({
      stats: counts || { projects: 0, tasks: 0, active: 0, pending_approvals: 0 },
      projects: projectsResult.results || [],
      tasks: tasksResult.results || [],
      approvals: approvalsResult.results || [],
      activity: activityResult.results || []
    });
  }

  if (path === "/api/projects" && method === "POST") {
    let body;
    try { body = await readJson(request); } catch (error) {
      return json({ error: "INVALID_REQUEST", message: error.message }, 400);
    }
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
    const repoUrl = typeof body.repoUrl === "string" ? body.repoUrl.trim().slice(0, 500) : "";
    if (!name) return json({ error: "VALIDATION_ERROR", message: "Loyiha nomi kerak." }, 400);
    if (repoUrl && !/^https:\/\/(github\.com|gitlab\.com)\//i.test(repoUrl)) {
      return json({ error: "VALIDATION_ERROR", message: "Repository havolasi https://github.com yoki https://gitlab.com bilan boshlanishi kerak." }, 400);
    }
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO projects (id, name, category, repo_url, deployment_url, status) VALUES (?, ?, ?, ?, ?, 'not_connected')"
    ).bind(id, name, String(body.category || "other").slice(0, 40), repoUrl || null, null).run();
    await audit(env, "project.created", "project", id, { name });
    return json({ ok: true, id }, 201);
  }

  if (path === "/api/commands" && method === "POST") {
    let body;
    try { body = await readJson(request); } catch (error) {
      return json({ error: "INVALID_REQUEST", message: error.message }, 400);
    }
    const command = typeof body.command === "string" ? body.command.trim() : "";
    if (!command || command.length > 2000) {
      return json({ error: "VALIDATION_ERROR", message: "Buyruq 1–2000 belgi bo‘lishi kerak." }, 400);
    }
    const taskId = crypto.randomUUID();
    const title = command.split(/[\n.!?]/)[0].trim().slice(0, 120) || "Yangi buyruq";
    await env.DB.prepare(
      "INSERT INTO tasks (id, title, description, project_id, assigned_agent, priority, status, kind) VALUES (?, ?, ?, ?, 'manager', 'normal', 'queued', 'owner_command')"
    ).bind(taskId, title, command, body.projectId || null).run();
    await audit(env, "command.queued", "task", taskId, { title });
    return json({
      ok: true,
      taskId,
      status: "queued",
      message: "Buyruq vazifalar navbatiga saqlandi. Agentlar va amallarni ulash keyingi bosqichda amalga oshiriladi."
    }, 201);
  }

  if (path === "/api/tasks" && method === "POST") {
    let body;
    try { body = await readJson(request); } catch (error) {
      return json({ error: "INVALID_REQUEST", message: error.message }, 400);
    }
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 2000) : "";
    if (!title) return json({ error: "VALIDATION_ERROR", message: "Vazifa nomi kerak." }, 400);
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO tasks (id, title, description, project_id, assigned_agent, priority, status, kind) VALUES (?, ?, ?, ?, 'manager', ?, 'planned', 'manual')"
    ).bind(id, title, description, body.projectId || null, ["low", "normal", "high"].includes(body.priority) ? body.priority : "normal").run();
    await audit(env, "task.created", "task", id, { title });
    return json({ ok: true, id }, 201);
  }

  return json({ error: "NOT_FOUND", message: "API endpoint topilmadi." }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(request, env);
      } catch (error) {
        console.error("BEKIUZ AI Manager API error:", error);
        return json({ error: "INTERNAL_ERROR", message: "Serverda xatolik yuz berdi." }, 500);
      }
    }
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      const response = new Response(assetResponse.body, assetResponse);
      for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
      );
      if (url.protocol === "https:") response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
      return response;
    }
    return new Response("BEKIUZ AI Manager assets are not configured.", { status: 503, headers });
  }
};
