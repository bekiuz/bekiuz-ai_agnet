const $ = (selector) => document.querySelector(selector);
const loginScreen = $("#login-screen");
const appShell = $("#app-shell");
const loginError = $("#login-error");
const setupHint = $("#setup-hint");

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: { ...(options.headers || {}), ...(options.body ? { "Content-Type": "application/json" } : {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "So‘rov bajarilmadi.");
    error.status = response.status;
    error.code = data.error;
    throw error;
  }
  return data;
}

function showLogin() {
  loginScreen.classList.remove("hidden");
  appShell.classList.add("hidden");
}

function showApp() {
  loginScreen.classList.add("hidden");
  appShell.classList.remove("hidden");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function shortRepo(url) {
  if (!url) return "Repository ulanmagan";
  try { return new URL(url).pathname.replace(/^\//, ""); } catch { return "Repository"; }
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value.includes("Z") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("uz-UZ", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function renderProjects(projects) {
  $("#project-count").textContent = projects.length;
  $("#projects-list").innerHTML = projects.length ? projects.map(project => `
    <div class="project-row">
      <span class="project-icon">${escapeHtml((project.name || "P").slice(0, 1).toUpperCase())}</span>
      <span class="project-main"><b>${escapeHtml(project.name)}</b><small>${escapeHtml(shortRepo(project.repo_url))}</small></span>
      <span class="project-status">${escapeHtml(project.status || "unknown")}</span>
    </div>`).join("") : '<div class="empty-state">Hali loyihalar qo‘shilmagan.</div>';
}

function renderTasks(tasks, taskSteps = []) {
  $("#task-count").textContent = tasks.length;
  const grouped = new Map();
  for (const step of taskSteps) {
    if (!grouped.has(step.task_id)) grouped.set(step.task_id, []);
    grouped.get(step.task_id).push(step);
  }
  const agentNames = { manager:"AI Manager",developer:"Developer AI",monitoring:"Monitoring AI",research:"Research AI",business:"Business AI",support:"Support AI",security:"Security AI" };
  $("#tasks-list").innerHTML = tasks.length ? tasks.map(task => {
    const steps = grouped.get(task.id) || [];
    const stepsHtml = steps.map(step => `
      <div class="plan-step">
        <span class="step-number">${escapeHtml(step.step_order)}</span>
        <span class="step-main"><b>${escapeHtml(agentNames[step.agent] || step.agent)} · ${escapeHtml(step.title)}</b><small>${escapeHtml(step.description)}</small></span>
        ${Number(step.requires_approval) ? '<span class="approval-tag">Tasdiq kerak</span>' : ''}
      </div>`).join("");
    return `
      <article class="task-card">
        <div class="task-row">
          <span class="project-icon">✳</span>
          <span class="task-main"><b>${escapeHtml(task.title)}</b><small>${escapeHtml(formatDate(task.created_at))} · ${escapeHtml(task.priority)}</small></span>
          <span class="task-status">${escapeHtml(task.status)}</span>
        </div>
        ${task.ai_summary ? `<p class="task-summary">${escapeHtml(task.ai_summary)}</p>` : ''}
        ${stepsHtml ? `<div class="plan-steps"><div class="plan-label">AI ISHCHILARGA TAQSIMLANGAN REJA</div>${stepsHtml}</div>` : ''}
      </article>`;
  }).join("") : '<div class="empty-state">Hozircha vazifalar yo‘q.</div>';
}

async function loadDashboard() {
  const data = await api("/api/bootstrap");
  $("#stat-projects").textContent = data.stats.projects ?? 0;
  $("#stat-tasks").textContent = data.stats.tasks ?? 0;
  $("#stat-active").textContent = data.stats.active ?? 0;
  $("#stat-approvals").textContent = data.stats.pending_approvals ?? 0;
  renderProjects(data.projects || []);
  renderTasks(data.tasks || [], data.taskSteps || []);
}

async function checkSetup() {
  try {
    const health = await api("/api/health");
    const missing = [];
    if (!health.authConfigured) missing.push("ADMIN_PASSWORD va SESSION_SECRET");
    if (!health.databaseConfigured) missing.push("D1 DB binding");
    if (!health.aiConfigured) missing.push("Workers AI binding");
    setupHint.textContent = missing.length
      ? "Sozlash kerak: " + missing.join(", ") + "."
      : "Server, xavfsizlik va ma’lumotlar bazasi sozlangan.";
  } catch {
    setupHint.textContent = "Server bilan bog‘lanib bo‘lmadi. Deploy va Worker sozlamalarini tekshiring.";
  }
}

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";
  const button = event.currentTarget.querySelector("button");
  button.disabled = true;
  button.textContent = "Tekshirilmoqda…";
  try {
    await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ password: $("#password").value })
    });
    $("#password").value = "";
    showApp();
    await loadDashboard();
  } catch (error) {
    loginError.textContent = error.message;
    await checkSetup();
  } finally {
    button.disabled = false;
    button.innerHTML = 'Tizimga kirish <span>→</span>';
  }
});

$("#logout-button").addEventListener("click", async () => {
  try { await api("/api/auth/logout", { method: "POST", body: "{}" }); } catch {}
  showLogin();
});

$("#command-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = $("#command-input");
  const message = $("#command-message");
  const button = event.currentTarget.querySelector("button");
  const command = input.value.trim();
  if (!command) return;
  button.disabled = true;
  message.style.color = "#c7b4ff";
  message.textContent = "Vazifa saqlanmoqda…";
  try {
    const result = await api("/api/commands", {
      method: "POST",
      body: JSON.stringify({ command })
    });
    input.value = "";
    message.textContent = result.summary ? result.title + ': ' + result.summary + ' (' + result.steps.length + ' ta ishchi qadami rejalashtirildi).' : result.message;
    await loadDashboard();
  } catch (error) {
    message.style.color = "#ff9eae";
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

$("#today-date").textContent = new Date().toLocaleDateString("uz-UZ", { weekday: "short", day: "numeric", month: "long" });

(async function start() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
  await checkSetup();
  try {
    await api("/api/auth/me");
    showApp();
    await loadDashboard();
  } catch {
    showLogin();
  }
})();
