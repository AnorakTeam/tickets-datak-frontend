---
name: User Story (Frontend)
about: Functional user story template for frontend web interfaces and client experiences
title: '[FE-US] HU-<ID>: <Short English Title>'
labels: ['user-story', 'frontend']
assignees: ''
---

### 1. User Story Statement
**As a** [user role: Client / Support Agent / Assigned Developer]  
**I want to** [view, interact with, or submit through the web interface]  
**So that** [benefit, usability, or business goal]  

---

### 2. Traceability & Scope
- **Project Deliverable:** E1 (Software MVP)
- **Iteration:** Iteration 1 | Iteration 2
- **Area:** Client Portal | Internal Support Console | Chatbot Widget
- **Functional Requirements (RF):** RF<XX> (e.g. RF1, RF2, RF3, RF4, RF5, RF6, RF7, RF8, RF9, RF10, RF11, RF12, RF13, RF14, RF15, RF16)
- **Non-Functional Requirements (RNF):**
  - RNF2 (Role-based view isolation & UI permission guard)
  - RNF3 (Fluid rendering, paginated table, response < 2s)
  - RNF6 (Spanish UI language, clean modern interface aligned with Figma)
  - RNF8 (Vitest suite & component testing)

---

### 3. Acceptance Criteria (Gherkin Scenarios)
#### Scenario 1: Successful UI Flow (Happy Path)
- **Given** an authenticated user with role `[cliente / agente_soporte / responsable_atencion]` on `[Page / View]`
- **When** the user enters valid inputs and clicks `[Button]`
- **Then** the interface updates responsively, displays confirmation feedback (toast / modal), and navigates or reflects the state change

#### Scenario 2: Form Validation & Guard Enforcement
- **Given** a user submitting incomplete or invalid fields
- **When** the submit action is triggered
- **Then** visual validation alerts are highlighted and submission is blocked

#### Scenario 3: Unauthorized Access Prevention
- **Given** a user without the required role attempting to navigate to `[Route]`
- **When** route middleware evaluates the session
- **Then** access is denied and user is redirected to their authorized dashboard

---

### 4. Technical Checklist
- [ ] Nuxt 4 page / component created under `pages/` or `components/`
- [ ] Pinia store / composable implemented for state management and action handling
- [ ] Typed HTTP service created/updated under `services/` (no direct `$fetch` in templates)
- [ ] Nitro proxy routes verified (`server/api/...`)
- [ ] Unit / component tests added with Vitest
- [ ] Responsive design verified (desktop and mobile)
