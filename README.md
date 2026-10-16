# Tuk-Tuk 🐦

A reminder app for tasks that have no fixed time — things you plan to do "sometime today" and keep putting off.

Tuk-Tuk gives every day a deadline (e.g. 23:00) and nags you about unfinished tasks — gently in the morning, relentlessly towards the evening. A woodpecker mascot, XP, levels and streaks (inspired by Duolingo) make finishing early more rewarding than finishing at 23:55.

> **Status:** early development. See the [roadmap](#roadmap). Live: https://gnklv.github.io/tuktuk/ · API: https://tuktuk.tuktuk-worker.workers.dev/health

## Core idea

| Time left until deadline | Reminder frequency  | Tone                  |
| ------------------------ | ------------------- | --------------------- |
| > 8 h                    | once in the morning | calm 😊               |
| 8–4 h                    | every 2–3 h         | nudging 🙂            |
| 4–2 h                    | every hour          | insistent 😐          |
| 2–1 h                    | every 30 min        | passive-aggressive 😠 |
| < 1 h                    | every 10–15 min     | panic 😱              |

## Tech stack

- **Web app:** Vue 3 + Vite + TypeScript, Pinia, PWA
- **Core logic:** framework-agnostic TypeScript package, shared between web and server
- **Tests:** Vitest
- **Planned:** Cloudflare Worker (cron + Web Push), Telegram bot, Rive animations

## Architecture

The project follows Clean Architecture. Dependencies point inwards only:

```
presentation (Vue) ──▶ application (use cases, ports) ──▶ domain (entities, rules)
infrastructure (localStorage, browser APIs) ──implements──▶ application ports
```

Domain and application layers live in `@tuktuk/core` and know nothing about Vue, storage or browser APIs. Time is always injected through a `Clock` port, so all scheduling logic is deterministic and testable.

```
tuktuk/
├─ packages/
│  ├─ core/        @tuktuk/core — domain + application layers, no user-facing text
│  └─ i18n/        @tuktuk/i18n — all ru/en text: UI strings and reminder wording
├─ apps/
│  ├─ web/         Vue app — infrastructure + presentation
│  └─ worker/      Cloudflare Worker + D1 — push reminders (in progress)
```

Conventions:

- Use cases are plain factories: `makeCompleteTask({ taskRepo, clock }) → (taskId) => …`. No DI framework.
- Domain is fully unit-tested; use cases are tested with in-memory fakes of the ports.
- Never call `new Date()` inside core — use the injected `Clock`.
- No abstraction until there's a second implementation or a test needs it.
- Layer boundaries are enforced by `no-restricted-imports` in `eslint.config.js`.
- All text lives in `@tuktuk/i18n`, one dictionary per locale. Core decides _what_ a reminder says
  (mood, which task, no repeats) and gets the wording through the `NudgeCopy` port. Every locale
  must match the English dictionary's shape, down to the number of reminder variants — enforced by
  the compiler.

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
- 🏁 **Personal MVP** — dogfood with a pinned tab: does escalating pressure actually work?
- [ ] **4. Streak** — a day counts when all required tasks are done, day summary
- [x] **5. PWA** — manifest, icons, offline via Service Worker, notifications through the Service Worker, iOS "Add to Home Screen" onboarding, safe areas
- [ ] **6. Push server** — Cloudflare Worker + D1 ✅, device registration and push subscription ✅, snapshot sync, cron, "Done" action
- 🏁 **MVP** — reminders reach the phone while the app is closed, streak keeps you coming back
- [ ] **7. XP & levels** — XP with early-finish multiplier, levels
- [ ] **8. Telegram bot** — second reminder channel: account linking, inline "Done" / "Later" buttons
- [ ] **9. Mascot** — geometric woodpecker in Figma (7 moods), later Rive animation
- [ ] **10. Polish** — streak freezes, limited snoozes, achievements, "name the first step", mascot personalities, accounts & sync, undo instead of confirm

## Install on iPhone

1. Open https://gnklv.github.io/tuktuk/ in **Safari**.
2. Tap **Share** → **Add to Home Screen**.
3. Open Tuk-Tuk from the Home Screen and enable reminders.

iOS shows notifications only for apps added to the Home Screen (iOS 16.4+). Until Web Push
(stage 6), reminders arrive only while the app is open: iOS freezes web apps in the background.

## Push server

`apps/worker` is a Cloudflare Worker with a D1 database. There are no accounts: each installed app
registers as a device and gets a random token (the server stores only its SHA-256). The server never
receives task titles — the Service Worker composes notification texts on the device.

Web Push uses VAPID keys. The public key is in `apps/worker/wrangler.jsonc`, the private one is a
Cloudflare secret (`VAPID_PRIVATE_KEY`) and, for local development, lives in `apps/worker/.dev.vars`
(git-ignored). Rotating the keys invalidates all existing push subscriptions.

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
