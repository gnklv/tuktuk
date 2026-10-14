# Tuk-Tuk 🐦

A reminder app for tasks that have no fixed time — things you plan to do "sometime today" and keep putting off.

Tuk-Tuk gives every day a deadline (e.g. 23:00) and nags you about unfinished tasks — gently in the morning, relentlessly towards the evening. A woodpecker mascot, XP, levels and streaks (inspired by Duolingo) make finishing early more rewarding than finishing at 23:55.

> **Status:** early development. See the [roadmap](#roadmap). Live: https://gnklv.github.io/tuktuk/

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
│  └─ core/        @tuktuk/core — domain + application layers
├─ apps/
│  ├─ web/         Vue app — infrastructure + presentation
│  └─ worker/      Cloudflare Worker for push reminders (planned)
```

Conventions:

- Use cases are plain factories: `makeCompleteTask({ taskRepo, clock }) → (taskId) => …`. No DI framework.
- Domain is fully unit-tested; use cases are tested with in-memory fakes of the ports.
- Never call `new Date()` inside core — use the injected `Clock`.
- No abstraction until there's a second implementation or a test needs it.
- Layer boundaries are enforced by `no-restricted-imports` in `eslint.config.js`.

## Roadmap

- [ ] **0. Scaffold** — monorepo ✅, Vue app in `apps/web` ✅, lint rule for layer boundaries ✅, deploy to GitHub Pages
- [ ] **1. Today's tasks** — data model, "Today" screen, habits vs one-off tasks, day rollover (localStorage)
- [ ] **2. Day deadline & pressure** — settings, `pressure()` / `nextNudgeInterval()`, pressure indicator + emoji mascot
- [ ] **3. In-tab reminders** — notification permission, in-tab scheduler, message pool per escalation level
- [ ] **4. Gamification v1** — XP with early-finish multiplier, streak, day summary, levels
- [ ] **5. PWA** — manifest, offline, "Add to Home Screen" onboarding
- [ ] **6. Push server** — Cloudflare Worker: snapshot sync, cron, Web Push, "Done" action
- [ ] **7. Telegram bot** — account linking, reminders, inline "Done" / "Later" buttons
- [ ] **8. Mascot** — geometric woodpecker in Figma (7 moods), later Rive animation
- [ ] **9. Polish** — streak freezes, limited snoozes, achievements, "name the first step", mascot personalities, accounts & sync

## Getting started

Requires Node.js 24+ (see `.nvmrc`).

```bash
npm install
```

## Scripts

| Command                | Description                                |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Start the web app at http://localhost:5180 |
| `npm run build`        | Type-check and build the web app           |
| `npm test`             | Run all tests once                         |
| `npm run test:watch`   | Run tests in watch mode                    |
| `npm run lint`         | Lint the whole repo                        |
| `npm run typecheck`    | Type-check every workspace                 |
| `npm run format`       | Format with Prettier                       |
| `npm run format:check` | Check formatting without writing           |
