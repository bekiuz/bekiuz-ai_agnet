# BEKIUZ AI Manager

BEKIUZ AI Manager — BEKIUZ ekotizimidagi barcha loyihalarni telefon orqali boshqarish uchun markaziy AI Control Center.

Bu mahsulot **BEKIUZ COMPANY** saytidan alohida. BEKIUZ COMPANY mijozlar uchun platforma bo‘lib qoladi; AI Manager esa ichki loyiha boshqaruvchisi bo‘ladi.

## Hozirgi Foundation bosqichi

- Mobilga mos PWA boshqaruv paneli.
- Owner uchun server-side parol tekshiruvi va imzolangan sessiya cookie.
- Cloudflare Worker API.
- D1 ma’lumotlar bazasi: loyihalar, vazifalar, tasdiqlar, integratsiyalar va audit tarixi.
- Boshlang‘ich loyiha reyestri.
- Workers AI orqali buyruqlarni tahlil qilish va o‘zbek tilida ish rejasini tuzish.
- Specialist AI rollariga reja qadamlarini taqsimlash.
- Har bir qadamni D1 bazasida saqlash va boshqaruv panelida ko‘rsatish.

**Muhim:** bu foundation hali GitHub repository'larini o‘zgartirmaydi, deploy qilmaydi yoki AI ishchilarni real ishga tushirmaydi. Hozir Workers AI orqali command planning va role-based delegation ishlaydi. Bu bosqichda agentlar ish rejasi tuzadi, ammo repository kodini o‘zgartirish, deploy yoki tashqi xabar yuborish hali bajarilmaydi. Bular uchun keyingi GitHub/Cloudflare/Telegram integratsiyalari zarur.

## Arxitektura

- Cloudflare Workers — API.
- Cloudflare Workers AI — keyingi bosqichdagi Manager reasoning.
- Cloudflare D1 — persistent ma’lumotlar.
- GitHub — loyiha kodlari va review qilinadigan o‘zgarishlar.
- Telegram — egaga xabarnomalar.
- PWA — telefon va desktop boshqaruv interfeysi.

## Cloudflare sozlamalari

Worker nomi: `bekiuz-ai-manager`

D1 database: `bekiuz-ai-manager`

D1 ID: `85f19200-09a6-4f6b-8417-c4ad1fd8972f`

### 1. Secretlarni sozlash

Parollarni hech qachon GitHub fayliga yoki chatga joylamang. Cloudflare Worker secrets sifatida qo‘shing:

- `ADMIN_PASSWORD` — faqat egaga ma’lum kuchli admin parol.
- `SESSION_SECRET` — tasodifiy, kamida 32 baytli maxfiy qiymat.

PowerShell / terminalda:

```powershell
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
```

Har bir buyruqdan keyin terminal maxfiy qiymatni so‘raydi. Qiymatlarni chatga yubormang.

### 2. D1 migratsiya

```powershell
npm install
npm run db:migrate:remote
```

### 3. Development va deploy

```powershell
npm run dev
```

Deploy:

```powershell
npm run deploy
```

### 4. Tekshirish

`/api/health` quyidagi holatlarni ko‘rsatadi:
- `authConfigured`
- `databaseConfigured`
- `aiConfigured`

Health endpoint secret qiymatlarini hech qachon qaytarmaydi.

## GitHub Actions orqali deploy

Repo Settings → Secrets and variables → Actions bo‘limida `CLOUDFLARE_API_TOKEN` nomli secret yarating. Token faqat ushbu accountdagi Workers Scripts edit ruxsati bilan cheklangan bo‘lsin. Tokenni GitHub kodi yoki chatga yozmang.

Keyin GitHub → Actions → **Deploy BEKIUZ AI Manager** workflow'ini qo‘lda ishga tushiring. Deploy workflow faqat manual ishga tushiriladi; har bir commit avtomatik production'ga chiqmaydi.

Deploydan oldin Cloudflare Worker secrets (`ADMIN_PASSWORD`, `SESSION_SECRET`) va D1 migration sozlangan bo‘lishi kerak.

## AI Manager planning

`POST /api/commands` Workers AI modeliga buyruq va loyiha reyestrini yuboradi, JSON ish rejasini tekshiradi, vazifani va agent qadamlarini D1 bazasiga yozadi.

- Specialist rollar: manager, developer, monitoring, research, business, support, security.
- Kod o‘zgartirish, deploy va tashqi xabar amallari tasdiq talab qiladigan qadam sifatida belgilanadi.
- Rejalar `/api/bootstrap` orqali boshqaruv panelida ko‘rsatiladi.
- AI plan tuzishi real kod o‘zgartirildi yoki deploy bo‘ldi degani emas.

## Birinchi bosqichda ishlaydigan API

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/bootstrap` — login talab qiladi.
- `POST /api/commands` — buyruqni vazifa navbatiga saqlaydi.
- `POST /api/tasks` — qo‘lda vazifa yaratadi.
- `POST /api/projects` — loyiha qo‘shadi.

## Rejalashtirilgan keyingi bosqichlar

1. GitHub App ulash: repo tanlash, read-only scan, work branch, kod patch, test, PR.
2. Manager Orchestrator: vazifani tahlil qilish va specialist agentlarga taqsimlash.
3. Cloudflare ulash: Workers/Pages holati, deploy boshqaruvi va monitoring.
4. Telegram bot: mobil buyruqlar, tasdiqlar va bildirishnomalar.
5. Developer, Monitoring, Research, Business, Support va Security agentlari.
6. BEKIUZ COMPANY bilan himoyalangan lead/project brief integratsiyasi.

## Xavfsizlik tamoyillari

- Default: read-only.
- Credentials faqat Worker secrets yoki OAuth token storage'da.
- Frontendga API token yoki provider key berilmaydi.
- Kod o‘zgarishlari alohida branch va review orqali.
- Deploy, delete, secret rotation va tashqi xabar yuborish alohida tasdiq talab qiladi.
- Har bir amal audit log'ga yoziladi.


## GitHub portfolio inventory

The Manager's GitHub integration is read-only:

- `GET /api/integrations/status` checks configured GitHub, Netlify and Cloudflare credentials without returning secret values.
- `POST /api/integrations/github/scan?offset=0&limit=3` checks up to three registered repositories per request. The dashboard follows the returned `nextOffset` until the inventory is complete.
- The scan records repository visibility, default branch, latest commit and root files. It reads a small set of manifests/source files only to classify Telegram bots; it does not write to GitHub.
- `POST /api/agents/developer/analyze` sends a read-only repository review request to the Developer AI Worker.

Optional Worker secrets:

- `GITHUB_TOKEN` — fine-grained token with read-only Metadata and Contents access to the repositories the Manager should inspect. Public repositories can be scanned without it; private repositories need access.
- `DEVELOPER_AI_SHARED_SECRET` — must match `MANAGER_SHARED_SECRET` on the Developer AI Worker.
- `NETLIFY_ACCESS_TOKEN` — optional read-only access for matching repositories to Netlify sites.

Never commit these values or paste them into chat. Adding a project to the Manager registry does not deploy it or prove that its production URL is live.
