# Tuk-Tuk 🐦

A reminder app for tasks that have no fixed time — things you plan to do "sometime today" and keep putting off.

Tuk-Tuk gives every day a deadline (e.g. 23:00) and nags you about unfinished tasks — gently in the morning, relentlessly towards the evening. Streaks (inspired by Duolingo) make finishing early more rewarding than finishing at 23:55; a woodpecker mascot, XP and levels are planned.

> **Status:** MVP, used daily on an iPhone. See the [roadmap](#roadmap). Live: https://gnklv.github.io/tuktuk/ · API: https://tuktuk.tuktuk-worker.workers.dev/health

## Core idea

Every moment of the day has a **pressure** from 0 to 1: the share of the active day already gone
(from the end of quiet hours to the deadline), squared — calm in the morning, steep towards the
evening — and scaled by how much is still undone. Pressure picks the UI color, the mascot's mood,
the tone of reminders and how often they come:

| Pressure | Level        | Reminder every | Tone               |
| -------- | ------------ | -------------- | ------------------ |
| 0–0.2    | calm 😊      | ~3–2 h         | gentle             |
| 0.2–0.4  | nudging 🙂   | ~2 h–70 min    | nudging            |
| 0.4–0.6  | insistent 😐 | ~70–40 min     | insistent          |
| 0.6–0.8  | annoyed 😠   | ~40–15 min     | passive-aggressive |
| 0.8–1    | panic 😱     | 15–10 min      | panic              |

No reminders during quiet hours; once everything is done, the day goes quiet.

## Tech stack

- **Web app:** Vue 3 + Vite + TypeScript, Pinia, vue-router, vue-i18n (ru/en), PWA (vite-plugin-pwa, own Service Worker)
- **Push server:** Cloudflare Worker + D1, cron triggers, Web Push with VAPID
- **Core logic:** framework-agnostic TypeScript package, shared between web and server
- **Tests:** Vitest (the D1 repositories run against a real local D1)
- **CI/CD:** GitHub Actions → Cloudflare (worker) and GitHub Pages (web)
- **Planned:** Telegram bot, Rive animations

## Architecture

The project follows Clean Architecture. Dependencies point inwards only:

```
presentation (Vue / HTTP) ──▶ application (use cases, ports) ──▶ domain (entities, rules)
infrastructure (storage, browser APIs, D1, Web Push) ──implements──▶ application ports
```

Domain and application layers live in `@tuktuk/core` and know nothing about Vue, storage or browser APIs;
each app adds its own application layer and adapters, wired in a composition root. ESLint enforces the boundaries. Time is always injected through a `Clock` port, so all scheduling logic is deterministic and testable.

```
tuktuk/
├─ packages/
│  ├─ core/        @tuktuk/core — domain + application layers, no user-facing text
│  └─ i18n/        @tuktuk/i18n — all ru/en text: UI strings and reminder wording
├─ apps/
│  ├─ web/         Vue PWA — app-specific use cases, browser adapters, UI, Service Worker
│  └─ worker/      Cloudflare Worker + D1 — device registry, snapshots, cron reminders
```

The full set of rules — layers, validation, privacy, platform constraints, UI, testing — is in
[docs/CONVENTIONS.md](docs/CONVENTIONS.md).

## Design system

Lives in `apps/web/src/presentation/ui/` — generic `Ui*` components that know nothing about tasks. Showcase: `/kit`.

- **Pressure-driven color.** A single CSS variable `--pressure` (0…1) shifts the accent hue from calm green to alarm red; the whole UI "heats up" towards the deadline without any component logic.
- **Tokens in two layers:** primitives (spacing on a 4px grid, radii, type scale, motion) and semantic colors (`--color-bg`, `--color-accent`, …) in `oklch`.
- **Light and dark themes** via `light-dark()`, following the system; `data-theme` on `<html>` forces one.
- **Playful, chunky look:** Nunito (self-hosted, Cyrillic + Latin), bold uppercase buttons with a "3D" bottom edge, 48px minimum tap targets, mobile-first.
- **Motion** respects `prefers-reduced-motion`.
- Styling: CSS custom properties + `<style scoped>`, no CSS framework.

## Roadmap

- [x] **0. Scaffold** — monorepo, Vue app in `apps/web`, lint rule for layer boundaries, deploy to GitHub Pages
- [x] **1. Today's tasks** — data model (tasks with schedules + completions; a day's list is computed, not stored), "Today" screen with localStorage, habits by weekday, task removal, day rollover
- [x] **2. Day deadline & pressure** — settings screen, pressure model (`computePressure`, `nextNudgeAt`), pressure-driven UI, deadline card, emoji mascot
- [x] **3. In-tab reminders** — notification permission, in-tab scheduler, message pool per escalation level
- 🏁 **Personal MVP** ✅ — dogfood with a pinned tab: does escalating pressure actually work?
- [x] **4. Streak** — a day counts when all required tasks are done, rest days are neutral, best streak, yesterday summary
- [x] **5. PWA** — manifest, icons, offline via Service Worker, notifications through the Service Worker, iOS "Add to Home Screen" onboarding, safe areas
- [x] **6. Push server** — Cloudflare Worker + D1, device registration and push subscription, snapshot sync, cron reminders, rate limit and cleanup of abandoned devices
- 🏁 **MVP** ✅ — reminders reach the phone while the app is closed, streak keeps you coming back
- [ ] **7. XP & levels** — XP with early-finish multiplier, levels
- [ ] **8. Telegram bot** — second reminder channel: account linking, inline "Done" / "Later" buttons
- [ ] **9. Mascot** — geometric woodpecker in Figma (7 moods), later Rive animation
- [ ] **10. Polish** — "Done" right from a notification, streak freezes, limited snoozes, achievements, "name the first step", mascot personalities, accounts & sync, undo instead of confirm

## Install on iPhone

1. Open https://gnklv.github.io/tuktuk/ in **Safari**.
2. Tap **Share** → **Add to Home Screen**.
3. Open Tuk-Tuk from the Home Screen and enable reminders.

iOS shows notifications only for apps added to the Home Screen (iOS 16.4+). Reminders come through
Web Push, so they arrive even when the app is closed.

## Push server

`apps/worker` is a Cloudflare Worker with a D1 database. There are no accounts: each installed app
registers as a device and gets a random token (the server stores only its SHA-256). The server never
receives task titles — the Service Worker composes notification texts on the device.

The app sends a **snapshot**: settings plus, for the next 7 days, how many tasks there are and how
many are still pending. A cron trigger runs every minute, computes the pressure for every device and
sends a push with only `{ date, pressure, locale }` when a reminder is due. A second, daily cron
deletes devices that have had no push subscription for 7 days. Device registration is open, so it
is rate-limited per IP. When the server forgets a device, the app simply registers again.

Web Push uses VAPID keys. The public key is in `apps/worker/wrangler.jsonc`, the private one is a
Cloudflare secret (`VAPID_PRIVATE_KEY`) and, for local development, lives in `apps/worker/.dev.vars`
(git-ignored). Rotating the keys invalidates all existing push subscriptions.

## Deployment

GitHub Actions (`.github/workflows/ci.yml`):

- **Pull requests** — lint, typecheck, tests, formatting.
- **Push to `master`** — the same checks, then the push server (D1 migrations → deploy → health
  check), then the web app to GitHub Pages. The worker goes first because a new web app may rely on
  its new API; if a migration or the deploy fails, the run fails and the web app isn't deployed.

The worker job needs a repository secret **`CLOUDFLARE_API_TOKEN`**: a Cloudflare API token
(_My Profile → API Tokens → Create Custom Token_) with account permissions **Workers Scripts: Edit**
and **D1: Edit**, limited to this account.

## Getting started

Requires Node.js 24+ (see `.nvmrc`).

```bash
npm install
```

### Dev clock

In development the app uses a shiftable clock, handy for testing day rollover and reminders.
In the browser console:

```js
tuktukDev.setNow('2026-10-14T23:59:50') // jump to a local time (reloads the page)
tuktukDev.shift(60 * 60_000) // move forward by an hour
tuktukDev.reset() // back to real time
```

## Scripts

| Command                                       | Description                                          |
| --------------------------------------------- | ---------------------------------------------------- |
| `npm run dev`                                 | Start the web app at http://localhost:5180           |
| `npm run build`                               | Type-check and build the web app                     |
| `npm test`                                    | Run all tests once                                   |
| `npm run test:watch`                          | Run tests in watch mode                              |
| `npm run lint`                                | Lint the whole repo                                  |
| `npm run typecheck`                           | Type-check every workspace                           |
| `npm run format`                              | Format with Prettier                                 |
| `npm run format:check`                        | Check formatting without writing                     |
| `npm run icons -w @tuktuk/web`                | Regenerate PWA icons from `apps/web/public/logo.svg` |
| `npm run dev -w @tuktuk/worker`               | Run the worker locally (http://localhost:8787)       |
| `npm run deploy -w @tuktuk/worker`            | Deploy the worker to Cloudflare                      |
| `npm run db:migrate:remote -w @tuktuk/worker` | Apply D1 migrations to the production database       |
