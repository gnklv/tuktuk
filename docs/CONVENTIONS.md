# Conventions

Rules this codebase follows. Each one came from a concrete decision or fix during development —
the "why" is there so the rule can be applied with judgement, not just obeyed.

## 1. Architecture

**1.1 Layers and the dependency rule.** Dependencies point inwards only. ESLint
(`no-restricted-imports` in `eslint.config.js`) enforces it — never disable the rule, fix the design.

| Package / folder                                    | Layer                           | May import                          |
| --------------------------------------------------- | ------------------------------- | ----------------------------------- |
| `packages/core/src/domain`                          | domain                          | nothing outside the domain          |
| `packages/core/src/application`                     | core use cases, ports, protocol | domain                              |
| `packages/i18n`                                     | all user-facing text            | core (types only)                   |
| `apps/*/src/application`                            | app use cases and ports         | core, i18n types — no Vue, no infra |
| `apps/*/src/infrastructure`                         | adapters                        | application ports, core             |
| `apps/web/src/presentation`, `apps/worker/src/http` | UI / HTTP                       | application, core                   |

Core, i18n and app application layers are framework-free: no Vue, Pinia or browser/Node APIs.

**1.2 Composition roots are the only places that know concrete implementations:**
`apps/web/src/main.ts`, `apps/web/src/service-worker/sw.ts`, `apps/worker/src/index.ts`.
Presentation gets dependencies through `provide/inject` (`presentation/di.ts`), never by importing
infrastructure.

**1.3 Ports belong to the layer that needs them** (`core/src/application/ports`,
`apps/web/src/application/ports.ts`, `apps/worker/src/application/ports.ts`). Adapters declare
`implements Port`. A type is declared once — if infrastructure and presentation both need it, it
lives in the application layer. _Why: duplicated `PushStatus` types drifted apart before._

**1.4 Business rules live in the domain or application layer, not in stores, components or
routers.** Pinia stores are view-models: UI state and UI timing (debounce, flush on hide). HTTP
routers parse requests and map results to statuses. _Why: reminder sync policy and request
validation used to hide in a store and a router, untestable without Vue/HTTP._

**1.5 Use cases are plain factories:** `makeDoThing(deps) => (input) => result`. Dependencies are
explicit; no DI framework, no class hierarchies for their own sake. Shared reads go through shared
helpers (`loadHistory`) instead of copies.

**1.6 Explicit modes over overloaded flags.** If a boolean starts to mean two things, replace it with
a named union (`NudgeDelivery = 'notify' | 'silent'`). _Why: `userIsLooking` also meant "push is
on"._

**1.7 Public APIs are narrow.** A package's `index.ts` exports only what its consumers use; helpers
stay private. Dead code is deleted, not kept "for later".

## 2. Domain

**2.1 Time is injected.** Never `new Date()` in core — use the `Clock` port or a `now` argument.
**Instants** are `Date`; **calendar days** are `LocalDate` in the user's timezone (`toLocalDate`);
**times of day** are `TimeOfDay` minutes. Branded types keep them from being mixed up.

**2.2 Compute, don't store, what can be derived.** The day's list, streak and pressure are computed
from tasks and completions. Store facts only. _Why: no midnight jobs, no sync bugs._

**2.3 History must stay truthful.** Tasks have `activeFrom` / `archivedOn` dates; archiving instead
of deleting keeps past days and streaks correct.

**2.4 Everything from outside is validated with domain rules.** Data from storage or the network
goes through `restore*` / `parse*` functions that apply the same rules as creation
(`restoreTask` ≡ `createTask`, `restoreSettings` ≡ `changeSettings`). Repositories only decode the
format and migrate old records. Never trust a cast. `switch` over a union always has a
`default` that throws.

**2.5 Errors have codes.** Domain: `DomainError` with a `DomainErrorCode` union — every code must
have a translation (the compiler checks `errors.${code}`). Worker: `DeviceError` with a code, mapped
to an HTTP status in one table. No ad-hoc error classes for business rules.

**2.6 Defaults live in the domain** (`DEFAULT_QUIET_HOURS`, `createDefaultSettings`), never as
literals in components.

## 3. Privacy and the push protocol

**3.1 Task titles never leave the device.** The server gets settings and counts (`ReminderSnapshot`)
and sends `PushPayload` with mood, date and pressure — no text. The Service Worker composes the text
from titles kept in IndexedDB.

**3.2 Protocol types live in `core/src/application`** and are parsed strictly on both sides. Every
payload has a `type`, so older apps can ignore newer kinds.

**3.3 Every push shows a notification**, even for data the app doesn't understand — iOS revokes push
access otherwise.

## 4. Platform realities

- **iOS freezes a backgrounded PWA**: send pending state on `visibilitychange: hidden` / `pagehide`
  with `fetch(..., { keepalive: true })`; don't rely on timers firing later.
- **Timers are hints, comparisons decide**: a timer says when to check; the date comparison decides
  whether the day changed. Background timers are throttled or frozen.
- **Reminders while the app is closed need the server** (cron + Web Push); on iOS only for apps added
  to the Home Screen.
- **The Service Worker can't read localStorage** — data it needs goes to IndexedDB.
- **iOS form controls**: `<input type="time">` needs `appearance: none`, `width: 100%`,
  `min-width: 0` and a fixed height to fit and center.

## 5. UI

- **i18n**: all user-facing text is in `@tuktuk/i18n`, one dictionary per locale. Every locale must
  match the English shape, down to the number of reminder variants (compiler-checked). Keys are
  typed: use `useAppI18n()` (`t`, `tn` for plurals, `d`). Core gets wording through ports
  (`NudgeCopy`), never strings. The dev-only `/kit` page is the only exception.
- **UI kit** (`presentation/ui`): generic `Ui*` components with no domain knowledge; colors and sizes
  from `tokens.css`; icons via `UiIcon`; secondary text via `ui-hint` / `ui-error`.
- **Pages compose feature components**; repeated section markup becomes a wrapper component and
  repeated behavior a composable (`useSettingsSection`). `App.vue` only calls lifecycle composables.
- **Mobile first**: tap targets ≥ 48px; grids use `minmax(0, 1fr)` and inputs `min-width: 0` so long
  content never widens the page; safe areas via `env(safe-area-inset-*)`.
- **Accessibility**: icon-only buttons have a label; decorative icons are `aria-hidden`; contrast
  meets WCAG AA (measure it — white on the accent failed at every pressure).
- **Motion respects `prefers-reduced-motion`.**

## 6. Naming

Names say what something is, not where it came from: `currentDate()` (now) vs `shownDate` (on
screen); files are named after what they contain (`nudge.ts`, not `nudge-messages.ts` once texts
moved out).

## 7. Testing

- Domain rules are unit-tested; use cases with in-memory fakes from `@tuktuk/core/testing`; time with
  `fakeClock`; adapters with fake `Storage` / `fetch` / registration.
- Tests describe behavior ("does not repeat the previous reminder"), not implementation.
- **A refactoring keeps existing tests unchanged** — that's the proof it changed no behavior.
- **A bug fix starts with a failing test** reproducing the user's scenario.
- Test fakes are never imported by production code.
- UI changes are checked in the browser (and at phone width); time-dependent behavior with the dev
  clock (`tuktukDev.setNow`).

## 8. Operations

- D1 migrations are numbered, forward-only and never edited once applied. CI applies them before
  deploying the worker; a failed migration fails the run.
- Push server first, web app second (the app may rely on the new API).
- Secrets: Cloudflare secrets in production, `apps/worker/.dev.vars` locally (git-ignored). Never in
  the repo or in chat.

## 9. Workflow

- Small steps, one commit each. Every step ends green: lint, typecheck, tests, formatting, build.
- Install dependencies into a workspace by path (`npm i -w apps/web ...`) and check its
  `package.json` — `-w @tuktuk/name` silently did nothing for new workspaces.
- Verify results explicitly (migration status, deployed health check) — don't infer success from
  filtered output.
