---
name: Engineering Task (Frontend)
about: Granular engineering task for UI components, pages, stores, or client services
title: '[FE-TASK] <Short Description in English>'
labels: ['task', 'frontend']
assignees: ''
---

### 1. Task Metadata & Traceability
- **Parent User Story:** Closes part of #<issue-number>
- **Project Schedule Task ID:** Task <ID> (from `API-DATAK.mpp`, e.g. Task 35, 38, 48, 58, 61, 64, 72)
- **Assigned Developer:** @<username> (`@AnorakTeam`, `@juandiegosb`, `@CamiloGarcia11`, `@tohond`)
- **Iteration:** Iteration 1 | Iteration 2
- **Area:** Client Portal | Internal Support Console | Chatbot Widget

---

### 2. Objective & Description
<!-- Provide a clear, actionable summary of what needs to be implemented in the frontend and why -->

---

### 3. Technical Specifications & Constraints
- **Target Files:**
  - `pages/...`
  - `components/...`
  - `stores/...`
  - `services/...`
  - `composables/...`
- **Consumed API Endpoints:**
  - Method: `GET | POST | PATCH | DELETE`
  - Route: `/api/v1/...` (accessed via Nitro server proxy)
- **UI/UX Requirements:**
  - UI Language: All customer-facing and agent-facing labels/messages in Spanish
  - State indicators, badges, and modal behavior
  - Input validation rules (required fields, error messages)

---

### 4. Acceptance Criteria & Deliverables
- [ ] Component / Page implemented with Nuxt UI and Tailwind CSS.
- [ ] Pinia store / composable integrated cleanly without direct `$fetch` in template code.
- [ ] Role-based visibility and route middleware guards verified.
- [ ] Unit / component tests added with Vitest.
- [ ] Build succeeds cleanly without lint errors (`pnpm build`).

---

### 5. Verification Command
<!-- Command to verify the task locally -->
```bash
pnpm test
```
