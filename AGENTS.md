# AGENTS.md — Autonomous Agent Operating Directives (Frontend)
## Repository: `tickets-datak-frontend`

This document defines mandatory operational instructions, coding standards, domain invariants, and Git protocols for any AI agent or autonomous coding assistant operating within `tickets-datak-frontend`.

---

## 1. Technical Stack & Standards

- **Framework:** Nuxt 4, Vue 3 (Composition API with `<script setup lang="ts">`).
- **UI & Styling:** Nuxt UI, Tailwind CSS, `@iconify/vue` / `@nuxt/icon`.
- **State Management:** Pinia (stores under `stores/`).
- **HTTP Client & Proxy:** Nuxt Nitro server reverse proxy (`/api/**` forwarding to Django on port 8000) and `$fetch` composable (`useApiClient`).
- **Testing:** Vitest, `@vue/test-utils`, `happy-dom` or `jsdom`.
- **Language Rules:**
  - **Code, documentation, Git:** Written strictly in **English** (component names, composables, TypeScript interfaces, commit messages, PRs).
  - **User Interface (UI):** All user-facing texts (form labels, placeholders, buttons, error messages, toast notifications, chatbot dialogues, radicado copy modal) must be in clear, professional **Spanish**.

---

## 2. Permitted Code Owners & Roles

Only authorized frontend contributors may have their user handles assigned:
- `@AnorakTeam` (José Manuel Pérez — DevOps & Project Manager): Scaffolding, Nitro proxy, CI, code reviews, develop/main merges.
- `@juandiegosb` (Juan Sarmiento — Coordinator & Frontend): Pinia auth store, route guards, Login view, portal base layout, 'Mis tickets' dashboard table, detail view.
- `@CamiloGarcia11` (Camilo García — Frontend Developer): Contracted modules selector component, incident report form view, radicado modal, floating Chatbot widget and dialogue flows.
- `@tohond` (Omar Palencia — QA Lead & Frontend QA): Vitest unit and component test suite, End-to-End User Acceptance Test (UAT) walkthrough.

---

## 3. Strict Frontend Invariants & UX Guidelines

1. **Nitro Reverse Proxy (Zero Direct CORS Calls):**
   - Never call `http://localhost:8000` directly from Vue client code.
   - All backend communication must use relative paths through the Nitro proxy (`/api/v1/...`).
2. **Session & JWT Storage:**
   - Auth tokens are managed through `useAuthStore` (Pinia).
   - Use `useCookie` for token persistence across browser refreshes and SSR hydration.
   - Protect private routes (`/tickets/**`) using Nuxt route middleware (`middleware/auth.ts`).
3. **Information Hiding in Client Views (RNF2):**
   - In the client ticket detail view (`/tickets/[radicado]`), **never display assigned staff, internal support notes, or technical estimates**.
   - Only display client-relevant fields: radicado, status, date, affected module, problem description, system error, and the official solution response when resolved.
4. **Radicado Confirmation Modal:**
   - After submitting an incident form or completing a chatbot report, always display a clear confirmation dialog with the formatted radicado (`TK-AAAA-NNNNNN`) and a one-click copy button.
5. **Mobile Responsiveness:**
   - Every layout and view must render cleanly across mobile (≥360px), tablet (≥768px), and desktop (≥1024px).

---

## 4. Git & GitHub Project Workflow

1. **Base Branch:** Always branch off `develop` and target `develop` for Pull Requests:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/<task-id>-<short-description>
   ```
2. **Project Card Transition:**
   - Before coding, move your task card from `Todo` to `In Progress` on [GitHub Project #1](https://github.com/users/AnorakTeam/projects/1).
3. **Conventional Commits:**
   ```bash
   git commit -m "feat(auth): implement useAuthStore with token cookie persistence"
   git commit -m "feat(tickets): create ModuleSelect component with loading skeleton"
   ```
4. **Pull Request Protocol:**
   - Title: `[FE-TASK] <TASK-ID>: <Title> (Closes #<issue-number>)`
   - Description must use `.github/pull_request_template.md` and include `Closes #<issue-number>` (this automatically moves the task to `In Review`).
5. **Strict No-Squash Merge Policy:**
   - Merging into `develop` or `main` must use **"Create a merge commit"** (`gh pr merge --merge`). Squash and rebase are strictly prohibited.

---

## 5. Verification Commands

Run these commands before opening any Pull Request:
```bash
# 1. Type check TypeScript
pnpm typecheck

# 2. Run unit & component test suite
pnpm test

# 3. Test production build
pnpm build
```
