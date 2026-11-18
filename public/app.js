const $ = (selector) => document.querySelector(selector);
const loginScreen = $("#login-screen");
const appShell = $("#app-shell");
const loginError = $("#login-error");
const setupHint = $("#setup-hint");
let dashboardProjects = [];
let dashboardTasks = [];
let dashboardTaskSteps = [];

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

function githubStatusLabel(status) {
  return ({
    healthy: "Tekshirildi",
    partial: "Qisman tekshirildi",
    permission_required: "Private ruxsat kerak",
    not_found_or_no_access: "Topilmadi / ruxsat yo‘q",
    invalid_repository: "Havola xato",
    error: "Xatolik"
  })[status] || "Hali tekshirilmagan";
}

function renderProjects(projects) {
  dashboardProjects = projects;
  const query = ($("#project-search")?.value || "").trim().toLocaleLowerCase("uz");
  const visible = projects.filter(project => `${project.name || ""} ${shortRepo(project.repo_url)} ${project.github_status || ""}`.toLocaleLowerCase("uz").includes(query));
  $("#project-count").textContent = query ? `${visible.length}/${projects.length}` : projects.length;
  $("#projects-list").innerHTML = visible.length ? visible.map(project => {
    const status = project.github_status || "not_checked";
    const commit = project.github_last_commit_message
      ? `<small class="project-commit">${escapeHtml(project.github_last_commit_message)}</small>`
      : "";
    return `
    <div class="project-row">
      <span class="project-icon">${escapeHtml((project.name || "P").slice(0, 1).toUpperCase())}</span>
      <span class="project-main"><b>${escapeHtml(project.name)}</b><small>${escapeHtml(shortRepo(project.repo_url))}</small>${commit}</span>
      <span class="project-status ${status === "healthy" ? "github-ok" : status === "permission_required" ? "github-warn" : ""}">${escapeHtml(githubStatusLabel(status))}</span>
      <form class="project-url-form" data-deployment-url="${escapeHtml(project.id)}">
        <input type="url" aria-label="${escapeHtml(project.name)} deployment URL" placeholder="https://sayt-manzili..." value="${escapeHtml(project.deployment_url || "")}">
        <button type="submit">Saqlash</button>
      </form>
    </div>`;
  }).join("") : `<div class="empty-state">${query ? "Qidiruv bo‘yicha loyiha topilmadi." : "Hali loyihalar qo‘shilmagan."}</div>`;
}

function renderGitHubResults(checks = []) {
  const target = $("#github-scan-results");
  if (!checks.length) {
    target.innerHTML = '<div class="empty-state">Hali GitHub tekshiruvi bajarilmagan.</div>';
    return;
  }
  const healthy = checks.filter(item => item.status === "healthy").length;
  const privateNeeded = checks.filter(item => item.status === "permission_required").length;
  $("#github-integration-status").textContent = healthy + "/" + checks.length + " tekshirildi";
  target.innerHTML = checks.map(item => {
    let files = [];
    try { files = JSON.parse(item.root_files_json || "[]"); } catch {}
    const names = files.slice(0, 6).map(file => file.name).join(" · ");
    return `<div class="github-result-row">
      <div class="github-result-top"><b>${escapeHtml(item.project_name || item.name || "Loyiha")}</b><span class="github-result-status">${escapeHtml(githubStatusLabel(item.status))}</span></div>
      <small>${escapeHtml(item.repository || "")}${item.default_branch ? " · " + escapeHtml(item.default_branch) : ""}</small>
      ${item.last_commit_message ? `<small class="project-commit">${escapeHtml(item.last_commit_message)}</small>` : ""}
      ${names ? `<small class="github-files">${escapeHtml(names)}</small>` : ""}
      ${item.error ? `<small class="github-error">${escapeHtml(item.error)}</small>` : ""}
    </div>`;
  }).join("");
  if (privateNeeded) {
    $("#github-scan-message").textContent = healthy + " ta repository tekshirildi. " + privateNeeded + " ta private repository uchun Worker’ga read-only GitHub ruxsati kerak.";
  } else {
    $("#github-scan-message").textContent = healthy + " ta repository tekshirildi.";
  }
}


function monitoringStatusLabel(status) {
  return ({
    online: "Ishlayapti",
    http_error: "HTTP xatosi",
    offline: "Ishlamayapti",
    not_configured: "URL sozlanmagan",
    invalid_url: "URL noto‘g‘ri"
  })[status] || "Tekshirilmagan";
}

function renderMonitoringResults(checks = []) {
  const target = $("#monitoring-results");
  if (!checks.length) {
    target.innerHTML = '<div class="empty-state">Hali monitoring tekshiruvi bajarilmagan.</div>';
    return;
  }
  const online = checks.filter(item => item.status === "online").length;
  const missing = checks.filter(item => item.status === "not_configured").length;
  $("#monitoring-summary").textContent = online + "/" + checks.length + " online";
  target.innerHTML = checks.map(item => {
    const details = [
      item.http_status ? "HTTP " + item.http_status : "",
      item.response_ms !== null && item.response_ms !== undefined ? item.response_ms + " ms" : "",
      item.checked_at ? formatDate(item.checked_at) : ""
    ].filter(Boolean).join(" · ");
    return `<div class="monitoring-result-row">
      <div class="monitoring-result-top"><b>${escapeHtml(item.name || "Loyiha")}</b><span class="monitoring-status status-${escapeHtml(item.status)}">${escapeHtml(monitoringStatusLabel(item.status))}</span></div>
      <small>${escapeHtml(item.target_url || "Deployment URL kiritilmagan")}</small>
      ${details ? `<small>${escapeHtml(details)}</small>` : ""}
      ${item.error ? `<small class="github-error">${escapeHtml(item.error)}</small>` : ""}
    </div>`;
  }).join("");
  $("#monitoring-message").textContent = online + " ta loyiha javob berdi, " + missing + " tasida deployment URL sozlanmagan.";
}

function renderTasks(tasks, taskSteps = []) {
  dashboardTasks = tasks;
  dashboardTaskSteps = taskSteps;
  const query = ($("#task-search")?.value || "").trim().toLocaleLowerCase("uz");
  const visibleTasks = tasks.filter(task => `${task.title || ""} ${task.description || ""} ${task.status || ""} ${task.priority || ""}`.toLocaleLowerCase("uz").includes(query));
  $("#task-count").textContent = query ? `${visibleTasks.length}/${tasks.length}` : tasks.length;
  const grouped = new Map();
  for (const step of taskSteps) {
    if (!grouped.has(step.task_id)) grouped.set(step.task_id, []);
    grouped.get(step.task_id).push(step);
  }
  const agentNames = { manager:"AI Manager",developer:"Developer AI",monitoring:"Monitoring AI",research:"Research AI",business:"Business AI",support:"Support AI",security:"Security AI" };
  const statusLabels = { planned:"Rejalashtirilgan", in_progress:"Jarayonda", active:"Faol", completed:"Bajarildi", cancelled:"Bekor qilingan", pending:"Kutilmoqda", failed:"Xatolik" };
  const priorityLabels = { low:"Past", normal:"O‘rtacha", high:"Yuqori" };
  $("#tasks-list").innerHTML = visibleTasks.length ? visibleTasks.map(task => {
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
          <span class="task-main"><b>${escapeHtml(task.title)}</b><small>${escapeHtml(formatDate(task.created_at))} · Ustuvorlik: ${escapeHtml(priorityLabels[task.priority] || task.priority || "—")}</small></span>
          <span class="task-status">${escapeHtml(statusLabels[task.status] || task.status || "Noma’lum")}</span>
        </div>
        ${task.ai_summary ? `<p class="task-summary">${escapeHtml(task.ai_summary)}</p>` : ''}
        ${stepsHtml ? `<div class="plan-steps"><div class="plan-label">AI ISHCHILARGA TAQSIMLANGAN REJA</div>${stepsHtml}</div>` : ''}
        ${["completed", "cancelled"].includes(task.status) ? "" : `<div class="task-actions"><button class="cancel-task-button" type="button" data-cancel-task="${escapeHtml(task.id)}">Bekor qilish</button></div>`}
      </article>`;
  }).join("") : `<div class="empty-state">${query ? "Qidiruv bo‘yicha vazifa topilmadi." : "Hozircha vazifalar yo‘q."}</div>`;
}


$("#projects-list").addEventListener("submit", async (event) => {
  const form = event.target.closest("form[data-deployment-url]");
  if (!form) return;
  event.preventDefault();
  const button = form.querySelector("button");
  const input = form.querySelector("input");
  button.disabled = true;
  button.textContent = "Saqlanmoqda…";
  try {
    await api("/api/projects/" + encodeURIComponent(form.dataset.deploymentUrl) + "/deployment-url", {
      method: "PUT",
      body: JSON.stringify({ deploymentUrl: input.value.trim() })
    });
    await loadDashboard();
    $("#monitoring-message").textContent = "Deployment manzili saqlandi. Endi monitoringni ishga tushiring.";
  } catch (error) {
    $("#monitoring-message").textContent = error.message;
    button.disabled = false;
    button.textContent = "Saqlash";
  }
});

$("#tasks-list").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-cancel-task]");
  if (!button) return;
  const taskId = button.dataset.cancelTask;
  if (!confirm("Ushbu vazifani bekor qilmoqchimisiz?")) return;
  button.disabled = true;
  button.textContent = "Bekor qilinmoqda…";
  try {
    await api("/api/tasks/" + encodeURIComponent(taskId) + "/cancel", { method: "POST", body: "{}" });
    await loadDashboard();
    $("#command-message").textContent = "Vazifa bekor qilindi.";
  } catch (error) {
    button.disabled = false;
    button.textContent = "Bekor qilish";
    $("#command-message").textContent = error.message;
  }
});

function renderIntegrationCards(items = []) {
  const target = $("#integration-cards");
  const labels = { connected: "Ulangan", not_connected: "Ulanmagan", error: "Tekshiruv xatosi" };
  const icons = { github: "GH", netlify: "N", cloudflare: "CF" };
  target.innerHTML = items.map(item => {
    const connected = item.status === "connected";
    return `<div class="integration-card">
      <div class="integration-card-top">
        <span class="integration-icon ${escapeHtml(item.provider)}">${icons[item.provider] || "↗"}</span>
        <span class="integration-state ${connected ? "connected" : item.status === "error" ? "failed" : ""}">${labels[item.status] || "Noma’lum"}</span>
      </div>
      <b>${escapeHtml(item.label)}</b>
      <small>${escapeHtml(item.accountLabel || item.permission || "")}</small>
      <div class="integration-card-bottom">
        <span>${connected ? "Server tokeni tasdiqlandi" : "Secret: " + escapeHtml(item.secretName)}</span>
        ${item.error ? `<small class="github-error">${escapeHtml(item.error)}</small>` : ""}
      </div>
    </div>`;
  }).join("");
}

async function refreshIntegrations() {
  const target = $("#integration-cards");
  target.innerHTML = '<div class="empty-state">Akkauntlar tekshirilmoqda…</div>';
  try {
    const result = await api("/api/integrations/status");
    renderIntegrationCards(result.integrations || []);
  } catch (error) {
    target.innerHTML = '<div class="empty-state">' + escapeHtml(error.message) + '</div>';
  }
}

function renderDeveloperProjectOptions(projects = []) {
  const select = $("#developer-project");
  if (!select) return;
  const previous = select.value;
  const eligible = projects.filter(project => project.repo_url);
  select.innerHTML = '<option value="">Loyiha tanlang</option>' + eligible.map(project =>
    '<option value="' + escapeHtml(project.id) + '">' + escapeHtml(project.name) + ' · ' + escapeHtml(shortRepo(project.repo_url)) + '</option>'
  ).join("");
  if (eligible.some(project => project.id === previous)) select.value = previous;
}

$("#developer-analyze-button").addEventListener("click", async () => {
  const button = $("#developer-analyze-button");
  const message = $("#developer-message");
  const resultBox = $("#developer-result");
  const projectId = $("#developer-project").value;
  const task = $("#developer-task").value.trim();
  if (!projectId || !task) {
    message.textContent = "Loyiha va vazifani kiriting.";
    return;
  }
  button.disabled = true;
  button.textContent = "Tahlil qilinmoqda…";
  resultBox.classList.add("hidden");
  message.textContent = "Developer AI repositoryni tekshirmoqda…";
  try {
    const result = await api("/api/agents/developer/analyze", {
      method: "POST",
      body: JSON.stringify({ projectId, task })
    });
    const analysis = result.result || {};
    const info = analysis.repository_info || {};
    const files = Array.isArray(analysis.root_files) ? analysis.root_files : [];
    const fileList = files.length ? files.map(file => "• " + file.path + (file.type === "dir" ? "/" : "")).join("\\n") : "Root fayllar ro‘yxati topilmadi.";
    const report = [
      "REPOSITORY: " + (analysis.repository || "—"),
      "Asosiy branch: " + (info.default_branch || "—"),
      "Til: " + (info.language || "Aniqlanmagan"),
      "Ko‘rinishi: " + (info.visibility || "—"),
      "",
      "AI TAHLILI:",
      analysis.ai_review || "AI xulosasi mavjud emas.",
      "",
      "ROOT FAYLLAR (" + files.length + "):",
      fileList,
      "",
      "CHEKLOV: Read-only. Fayllar o‘zgartirilmadi, commit yoki deploy qilinmadi."
    ].join("\\n");
    resultBox.textContent = report;
    resultBox.classList.remove("hidden");
    message.textContent = "Tahlil yakunlandi. " + files.length + " ta root element ko‘rib chiqildi.";
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = "Developer AI'ga yuborish <span>→</span>";
  }
});

async function loadDashboard() {
  const data = await api("/api/bootstrap");
  $("#stat-projects").textContent = data.stats.projects ?? 0;
  $("#stat-tasks").textContent = data.stats.tasks ?? 0;
  $("#stat-active").textContent = data.stats.active ?? 0;
  $("#stat-approvals").textContent = data.stats.pending_approvals ?? 0;
  renderProjects(data.projects || []);
  renderDeveloperProjectOptions(data.projects || []);
  renderGitHubResults((data.projects || []).filter(project => project.github_status).map(project => ({
    name: project.name,
    repository: shortRepo(project.repo_url),
    status: project.github_status,
    default_branch: project.github_default_branch,
    last_commit_message: project.github_last_commit_message,
    root_files_json: project.github_root_files_json,
    error: project.github_error
  })));
  renderTasks(data.tasks || [], data.taskSteps || []);
  renderMonitoringResults(data.monitoringChecks || []);
  await refreshIntegrations();
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

$("#refresh-integrations-button").addEventListener("click", refreshIntegrations);
$("#project-search").addEventListener("input", () => renderProjects(dashboardProjects));
const commandInput = $("#command-input");
const commandCounter = $("#command-counter");
function updateCommandCounter() {
  if (commandCounter) commandCounter.textContent = `${commandInput.value.length} / 2000`;
}
commandInput.addEventListener("input", updateCommandCounter);
updateCommandCounter();
commandInput.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") $("#command-form").requestSubmit();
});
$("#task-search").addEventListener("input", () => renderTasks(dashboardTasks, dashboardTaskSteps));
$("#refresh-dashboard-button").addEventListener("click", async () => {
  const button = $("#refresh-dashboard-button");
  button.disabled = true;
  button.textContent = "Yangilanmoqda…";
  try { await loadDashboard(); }
  catch (error) { $("#command-message").textContent = "Yangilashda xatolik: " + error.message; }
  finally { button.disabled = false; button.textContent = "Yangilash ↻"; }
});

$("#github-scan-button").addEventListener("click", async () => {
  const button = $("#github-scan-button");
  const message = $("#github-scan-message");
  button.disabled = true;
  button.textContent = "Repositorylar tekshirilmoqda…";
  message.textContent = "GitHub API orqali repositorylar, oxirgi commit va asosiy fayllar tekshirilmoqda.";
  try {
    const result = await api("/api/integrations/github/scan", { method: "POST", body: "{}" });
    message.textContent = result.healthy + "/" + result.total + " ta repository ochildi. Private ruxsat kerak bo‘lganlari alohida ko‘rsatiladi.";
    await loadDashboard();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = 'GitHub loyihalarini tekshirish <span>→</span>';
  }
});

$("#discover-deployments-button").addEventListener("click", async () => {
  const button = $("#discover-deployments-button");
  const message = $("#discover-deployments-message");
  button.disabled = true;
  button.textContent = "GitHub va Netlify qidirilmoqda…";
  message.textContent = "Repository metadata, GitHub Pages va Netlify’dagi bog‘langan deploylar tekshirilmoqda.";
  try {
    const result = await api("/api/integrations/deployments/discover", { method: "POST", body: "{}" });
    const sources = result.results.filter(item => item.status === "discovered").reduce((counts, item) => {
      counts[item.source] = (counts[item.source] || 0) + 1;
      return counts;
    }, {});
    const sourceText = [
      sources.netlify ? "Netlify: " + sources.netlify : "",
      sources.github_pages ? "GitHub Pages: " + sources.github_pages : "",
      sources.github_homepage ? "GitHub homepage: " + sources.github_homepage : ""
    ].filter(Boolean).join(" · ");
    message.textContent = result.discovered + " ta yangi sayt manzili topilib saqlandi. " +
      result.alreadyConfigured + " tasida manzil oldindan bor, " + result.notFound + " tasida mos manzil topilmadi." +
      (sourceText ? " " + sourceText + "." : "") +
      (!result.netlifyConfigured ? " Netlify’ni avtomatik tekshirish uchun Worker’ga NETLIFY_ACCESS_TOKEN secret’i kerak." : "") +
      (result.netlifyError ? " " + result.netlifyError : "");
    await loadDashboard();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = 'Sayt linklarini avtomatik topish <span>✦</span>';
  }
});

$("#monitoring-scan-button").addEventListener("click", async () => {
  const button = $("#monitoring-scan-button");
  const message = $("#monitoring-message");
  button.disabled = true;
  button.textContent = "Saytlar tekshirilmoqda…";
  message.textContent = "Har bir sozlangan HTTPS manziliga xavfsiz so‘rov yuborilmoqda (8 soniyagacha).";
  try {
    const result = await api("/api/monitoring/scan", { method: "POST", body: "{}" });
    message.textContent = result.online + "/" + result.total + " ta loyiha online. URL sozlanmagan: " + result.notConfigured + ".";
    await loadDashboard();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = 'Sayt va servislarni tekshirish <span>→</span>';
  }
});

const navLinks = [...document.querySelectorAll(".sidebar nav .nav-item")];
navLinks.forEach(link => link.addEventListener("click", () => {
  navLinks.forEach(item => item.classList.toggle("active", item === link));
}));
if ("IntersectionObserver" in window) {
  const sections = navLinks.map(link => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  const observer = new IntersectionObserver(entries => {
    const current = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
    if (current) navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === "#" + current.target.id));
  }, { rootMargin: "-18% 0px -65% 0px", threshold: [0, .15, .35] });
  sections.forEach(section => observer.observe(section));
}

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
