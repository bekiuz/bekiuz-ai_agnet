# BEKIUZ Project Portfolio

**Audit date:** 2026-11-25  
**Purpose:** one verified index for the BEKIUZ project ecosystem and the next practical work item for each active product.

## Operating rules

- Prefer the existing repository; do not create duplicate projects for the same product.
- Read and test before changing code. Keep changes small and reviewable.
- Keep secrets out of source files and commits.
- Keep the default mode read-only. Use a separate branch/PR for substantial code changes.
- Do not deploy, delete data, rotate secrets, publish external posts, or send user-facing messages without the owner's explicit approval.
- A successful GitHub commit or CI check does not prove that a production service is live.

## Priority queue

| Priority | Project / repository | Verified state | Next practical milestone |
|---:|---|---|---|
| 1 | **BEKIUZ AI Manager** — `bekiuz-ai_agnet` | Latest code commit `8af6f6d` (2026-11-18); CI and manual deploy workflow succeeded on that commit. The Worker plans tasks and delegates specialist steps, but does not yet modify repositories or run deployments. | Add GitHub App read-only repository inventory and sync project status; then introduce branch/patch/test/PR workflow with approval gates. |
| 2 | **JJK Cursed Arena** — `jjk-cursed-arena` | Latest commit `c5d035e` (2026-11-24). JavaScript validation and Pages artifact upload passed; the final Pages deployment failed because the deploy action reported zero artifacts. This is a deployment/API issue, not a JavaScript syntax failure. | With deployment approval, retry the Pages deployment; then work on rigged animations, character models, more curses and boss encounters. |
| 3 | **Bekiuz DubLab** — `bekiuz-dublab` | Latest commit `aca8ed5` (2026-11-21); Python checks and Docker image build checks passed. Studio currently replaces the original audio track, so music and background effects are lost. | Research and prototype speech/source separation so dialogue can be replaced while preserving music and effects; improve timing correction. |
| 4 | **BEKIUZ AI Workers** — `bekiuz-ai-workers` | Latest commit `fa97560` (2026-11-22), fixing Developer AI source-scan syntax. | Add regression tests for Worker actions used by Market AI and ClipForge, plus timeout, CORS and failure-fallback checks. |
| 5 | **BEKIUZ COMPANY** — `bekiuz-company` | Latest commit `e49cbbb` (2026-11-15), fixing the Workers AI function-tool schema. It remains a customer-facing platform, separate from the internal AI Manager. | Verify the customer lead/project-brief flow and define a protected handoff into AI Manager. |
| 6 | **ODIY IELTS** — `odiy-ai` | Latest commit `34293f8` (2026-11-10); GitHub Pages deployment succeeded on that commit. The repository still has an unchecked delivery checklist. | Run a complete learner-flow audit: Reading, Listening, Writing, Speaking, mock timer, feedback, progress and local fallback; update `TODO.md` only after verification. |
| 7 | **BEKIUZ BUILD** — `BEKIUZ_BUILD` | Latest commit `cf91e47` (2026-10-29); validation and Pages build succeeded. The project has a separate imported mirror repository. | Verify the AI Worker connection and decide which repository is canonical before syncing further changes. |
| 8 | **BEKIUZ Usta** — `BEKIUZ-Usta` | Code update `b0f67c8` (2026-11-24) subtracts door/window area; material calculator is present. README was refreshed on 2026-11-25. | Add saved house estimates and configurable local material prices; keep engineering limitations visible. |
| 9 | **BEKIUZ Market AI** — `BEKIUZ-Market-AI` | Code update `5696aef` (2026-11-24) connects listing generation to Workers AI; local fallback remains. README was refreshed on 2026-11-25. | Test each platform format and add photo-based product detail extraction without inventing product facts. |
| 10 | **KunAI** — `KunAI` | Code update `b07a258` (2026-11-24) improves sorting, overdue tracking and completed-task cleanup. README was refreshed on 2026-11-25. | Add safe task export/import and recurring tasks before considering cloud sync. |
| 11 | **MiniIsh 2.0** — `MiniIsh-2.0` | Code update `410a597` (2026-11-24) adds search, status and summary to the local task board. README was refreshed on 2026-11-25. | Design buyer/worker roles and a secure backend; the current prototype is not yet a multi-user marketplace. |
| 12 | **OvozAI** — `OvozAI` | Code update `0e167af` (2026-11-24) improves voice selection, speech controls and browser compatibility. README was refreshed on 2026-11-25. | Verify Uzbek voice availability across browsers and add explicit speech-rate/pause controls. |
| 13 | **BiznesOS** — `BiznesOS` | Code update `bede077` (2026-11-24) improves stock controls, low-stock alerts and validation. README was refreshed on 2026-11-25. | Add CSV reports, expense tracking and a clear backup path before multi-user accounts. |
| 14 | **ClipForge** — `ClipForge` | Code update `44164fa` (2026-11-24) connects Workers AI with an offline fallback. README was refreshed on 2026-11-25. | Add multi-variant scripts and a content calendar; keep generated factual claims reviewable. |
| 15 | **CodeQuest-UZ** — `CodeQuest-UZ` | Code update `e1274dc` (2026-11-24) prevents repeated XP farming and persists quiz progress. README was refreshed on 2026-11-25. | Expand the small quiz bank into lessons and coding exercises with answer explanations. |
| 16 | **Zuxrash Android** — `zuxrash-android-assistant` | Latest commit `3325ba1` (2026-11-02) closes the in-app Vosk model before resuming the background assistant. The current wake phrase flow still depends on Android speech recognition. | Stabilize Uzbek/Russian voice handling and evaluate an offline wake-word engine; preserve clear microphone controls and permissions. |
| 17 | **Nari AI** — `naricham`, `nari_ai`, `naricham-backend` | The repositories have different activity levels: `naricham` last changed 2026-08-20, `nari_ai` 2026-10-26, backend 2026-08-29. | Identify the canonical frontend/backend pair and document which deployment is authoritative before adding features. |
| 18 | **BEKIUZ TRADE AI** — `BEKIUZ-TRADE-AI` | Latest commit `1273fd3` (2026-11-18) adds Academy, glossary, demo quiz, journal and AI tutor UI. | Verify which learning flows use live data/AI and which remain demo-only; then add progress persistence. |
| 19 | **BEKIUZ Dictator** — `BEKIUZ-DICTATOR` | Latest commit `a76fbe7` (2026-11-20) adds a desktop voice-assistant prototype. | Audit command permissions and define a small, safe first set of device actions. |
| 20 | **Heiyin TV Dublaj Studio** — `heiyin-tv-dublaj-studio` | Latest commit `fd809c4` (2026-11-20) polishes poster cards and removes empty hero artwork. | Verify the real media workflow separately from the visual catalog prototype. |
| 21 | **Aqlli Ustoz** — `aqlli-ustoz` | Latest commit `4121b48` (2026-11-18) makes the app speak complete AI replies. | Test speech output on Android and desktop browsers and improve interruption/retry handling. |
| 22 | **Bekiuz Driving** — `bekiuz.driving` | Latest commit `668fc6d` (2026-11-09) fixes pause, mobile input release and ad reward handling. | Re-test touch controls and game-state transitions before expanding maps and vehicles. |
| 23 | **Uzb Royale** — `uzb-royale` | Latest commit `4ad3339` (2026-10-18) documents improved shooting and aiming controls. | Re-check the current playable build and define the next gameplay milestone. |
| 24 | **AnimeLab** — `animelab` | Latest commit `0cb75fd` (2026-10-30) initializes the project structure. | Confirm the MVP scope and remove overlap with the separate anime/TV bot projects. |
| 25 | **Odina Chocolate Universe** — `odina-chocolate-universe` | Latest commit `e0106f0` (2026-11-14) initializes the repository. | Define the product catalog and ordering experience before adding backend work. |
| 26 | **Bekiuz Music Bot** — `bekiuz-music-bot` | Latest commit `611152d` (2026-10-29) adds YouTube runtime detection and host diagnostics. A previous download flow still needs source-specific reliability work. | Diagnose permitted source handling and error reporting; do not promise downloads until tested end-to-end. |
| 27 | **BEKIUZ Nexus** — `bekiuz-nexus` | Latest commit `62ffc9f` (2026-10-14) prevents prompt labels from leaking into generated copy. | Clarify whether Nexus is an agent workspace, prompt library or separate product and keep one clear scope. |

## Maintenance and legacy repositories

These repositories remain in the account but are not ahead of the current priority queue. Audit before investing in new features:

- **Selecon TV family:** `kino` (2026-11-14), `salecon-tv` (2026-11-11), `Selecon-tv2` (2026-08-03), `Selecon-tv` (2026-08-03), `selecon.tv_bot` (2026-07-29). Decide the canonical app and bot before duplicating fixes.
- **Media bots:** `film_bot` (2026-08-29), `anime_bot` (2026-10-04). Check compatibility and hosting before feature work.
- **Business/education bots:** `oazis-fastfood-bot` (2026-08-31), `telegram-course-bot` (2026-08-31), `modern-academy-bot` (2026-10-10).
- **Other prototypes:** `love-story-site` (2026-10-08), `miniish-platform` (2026-11-14), `JJK-Cursed-Game` (2026-11-14; the newer `jjk-cursed-arena` is the active game repository), `bekiuz_build-1098e` (imported BEKIUZ BUILD mirror), `zuxrash_ai` (2026-10-26), `zuxrash-ai` (2026-10-16).
- **Uninitialized repositories:** `zuxrash_bot` and `open.jarvis` currently have no commits.

## Daily work order

1. Check the AI Manager and AI Worker integration first.
2. Fix the highest-impact blocker in the active product queue.
3. Run the repository's existing checks before changing deployment state.
4. Update this file only when a repository state, blocker or verified milestone changes.


## Latest audit results — 2026-11-25

### Documentation refreshed

Feature/status documentation was updated in these repositories without changing their application code:

- `BEKIUZ-Usta`
- `BEKIUZ-Market-AI`
- `KunAI`
- `MiniIsh-2.0`
- `OvozAI`
- `BiznesOS`
- `ClipForge`
- `CodeQuest-UZ`

### GitHub Pages checks after the documentation commits

- **Succeeded:** Market AI, KunAI, OvozAI, BiznesOS, ClipForge and CodeQuest-UZ.
- **Blocked:** BEKIUZ Usta and MiniIsh 2.0. Their workflows stopped at `configure-pages`: GitHub returned `Resource not accessible by integration` while trying to create a Pages site. The upload/deploy steps were skipped, so this was not an application-code failure. Pages must be enabled in each repository's Settings, or the workflow's Pages permission must be corrected by an owner.
- **JJK Cursed Arena:** JavaScript validation and artifact upload succeeded, but `deploy-pages` could not find the uploaded artifact. No deployment retry was made.

### Verification boundary

The documentation commits are complete. A successful Pages workflow is evidence that the workflow completed, not a full browser QA of every feature. The two blocked Pages workflows and the JJK deployment issue remain open; no production secrets, data or deployment settings were changed during this audit.
