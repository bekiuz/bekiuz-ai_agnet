# BEKIUZ AI Manager

BEKIUZ AI Manager — BEKIUZ ekotizimidagi barcha loyihalarni telefon orqali boshqarish uchun markaziy AI Control Center.

Bu mahsulot **BEKIUZ COMPANY** saytidan alohida. BEKIUZ COMPANY mijozlar uchun platforma bo‘lib qoladi; AI Manager esa ichki loyiha boshqaruvchisi bo‘ladi.

## Hozirgi Foundation bosqichi

- Mobilga mos PWA boshqaruv paneli.
- Owner uchun server-side parol tekshiruvi va imzolangan sessiya cookie.
- Cloudflare Worker API.
- D1 ma’lumotlar bazasi: loyihalar, vazifalar, tasdiqlar, integratsiyalar va audit tarixi.
- Boshlang‘ich loyiha reyestri.
- Buyruqlarni vazifalar navbatiga xavfsiz saqlash.

**Muhim:** bu foundation hali GitHub repository'larini o‘zgartirmaydi, deploy qilmaydi yoki AI ishchilarni real ishga tushirmaydi. Hozircha buyruqlar navbatda saqlanadi. GitHub/Cloudflare/Telegram integratsiyalari va agent execution keyingi bosqichlarda ulanadi.

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
