import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const call = (path, init = {}, env = {}) => worker.fetch(
  new Request("https://manager.example" + path, init),
  env,
  {}
);

test("health reports configured services without exposing secrets", async () => {
  const response = await call("/api/health", {}, { ADMIN_PASSWORD: "not-for-display", SESSION_SECRET: "another-secret" });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.authConfigured, true);
  assert.equal(body.databaseConfigured, false);
  assert.equal(JSON.stringify(body).includes("not-for-display"), false);
});

test("login is unavailable until secrets are configured", async () => {
  const response = await call("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "anything" })
  });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "AUTH_NOT_CONFIGURED");
});

test("owner can sign in and validate a signed session", async () => {
  const env = { ADMIN_PASSWORD: "test-owner-password", SESSION_SECRET: "a-long-test-session-secret-for-local-tests" };
  const login = await call("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: env.ADMIN_PASSWORD })
  }, env);
  assert.equal(login.status, 200);
  const cookie = (login.headers.get("Set-Cookie") || "").split(";")[0];
  assert.match(cookie, /^bkm_session=/);
  const me = await call("/api/auth/me", { headers: { Cookie: cookie } }, env);
  assert.equal(me.status, 200);
  assert.equal((await me.json()).authenticated, true);
});

test("private dashboard routes reject unauthenticated requests", async () => {
  const response = await call("/api/bootstrap");
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "UNAUTHORIZED");
});


function createMockDatabase() {
  const writes = [];
  const projects = [
    { id:"project-dublab", name:"Bekiuz DubLab", category:"telegram_bot", repo_url:"https://github.com/bekiuz/bekiuz-dublab", deployment_url:null, status:"not_connected" },
    { id:"project-company", name:"Bekiuz Company", category:"company_platform", repo_url:"https://github.com/bekiuz/bekiuz-company", deployment_url:null, status:"not_connected" }
  ];
  return {
    writes,
    prepare(sql) {
      let params = [];
      const statement = {
        bind(...values) { params = values; return statement; },
        async all() {
          if (sql.includes("SELECT id, name, category, repo_url")) return { results:projects };
          return { results:[] };
        },
        async first() { return null; },
        async run() { writes.push({sql,params}); return {success:true}; }
      };
      return statement;
    }
  };
}

test("AI Manager creates structured specialist plan and persists it", async () => {
  const db = createMockDatabase();
  const env = {
    ADMIN_PASSWORD: "test-owner-password",
    SESSION_SECRET: "a-long-test-session-secret-for-local-tests",
    DB: db,
    AI_MODEL: "@cf/google/gemma-4-26b-a4b-it",
    AI: {
      async run(model, options) {
        assert.equal(model, env.AI_MODEL);
        assert.deepEqual(options.response_format, { type:"json_object" });
        return {
          response: JSON.stringify({
            title:"DubLab loyihasini tahlil qilish",
            summary:"DubLab holatini tekshirish va rivojlantirish rejasini tuzish.",
            priority:"normal",
            projectId:"project-dublab",
            steps:[
              {agent:"manager",title:"Loyihani ko‘rib chiqish",description:"Repo va vazifalarni ko‘rib chiqish.",operation:"analysis",requiresApproval:false},
              {agent:"developer",title:"Texnik kamchiliklarni aniqlash",description:"Kod va testlarni tahlil qilish.",operation:"code_change",requiresApproval:false},
              {agent:"monitoring",title:"Ishlash holatini tekshirish",description:"Deploy va monitoring holatini tekshirish.",operation:"monitoring",requiresApproval:false}
            ]
          })
        };
      }
    }
  };
  const login = await call("/api/auth/login", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({password:env.ADMIN_PASSWORD})
  }, env);
  const cookie = (login.headers.get("Set-Cookie") || "").split(";")[0];

  const response = await call("/api/commands", {
    method:"POST",
    headers:{"Content-Type":"application/json",Cookie:cookie},
    body:JSON.stringify({command:"Bekiuz DubLab loyihasini tahlil qilib, rivojlantirish rejasini tuz."})
  }, env);
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.status, "planned");
  assert.equal(body.steps.length, 3);
  assert.equal(body.steps[1].agent, "developer");
  assert.equal(db.writes.filter(write => write.sql.includes("INSERT INTO tasks")).length, 1);
  assert.equal(db.writes.filter(write => write.sql.includes("INSERT INTO manager_plans")).length, 1);
  assert.equal(db.writes.filter(write => write.sql.includes("INSERT INTO task_steps")).length, 3);
});
