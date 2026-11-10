# Support Ticket Management Client Portal & Console
## Academic Project: API-DATAK (2026-2)

Client web portal and support console built with **Nuxt 4**, **Vue 3**, **Nuxt UI**, **Tailwind CSS**, and **Pinia**.

---

## 1. Quick Start

### Prerequisites
- Node.js ≥ 20.0
- pnpm ≥ 9.0

### Local Setup
```bash
# 1. Clone repository & checkout develop
git checkout develop

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env

# 4. Start local development server (http://localhost:3000)
pnpm dev
```

---

## 2. Testing & Quality Checks

```bash
# Run unit & component tests with Vitest
pnpm test

# Build production bundle
pnpm build
```

---

## 3. Core Documentation & Guides

- [`AGENTS.md`](./AGENTS.md): Operational instructions and guidelines for AI agents and developers.
- [`ARCHITECTURE_AND_DATA_MODEL_REFERENCE.md`](./ARCHITECTURE_AND_DATA_MODEL_REFERENCE.md): Full ERD, 20-field ticket model, and REST API v1 contracts.
- [`GIT_GITHUB_WORKFLOW_GUIDE.md`](./GIT_GITHUB_WORKFLOW_GUIDE.md): Git branching model, Conventional Commits, and PR rules.
- [`SPRINT_1_PLANNING_AND_SCHEDULE.md`](./SPRINT_1_PLANNING_AND_SCHEDULE.md): Sprint 1 tasks, dependencies, and target dates.
