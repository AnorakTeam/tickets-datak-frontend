## Summary
Brief description of the changes introduced in this pull request. Explain the problem solved or the UI/UX feature implemented.

## Related Issue / Task
<!-- Link the issue or task that this PR resolves -->
Closes #<issue-number>

## Type of Change
- [ ] `feat`: New feature or user story implementation
- [ ] `fix`: Bug fix
- [ ] `chore`: Maintenance, dependencies, tooling, or configuration
- [ ] `docs`: Documentation updates (README, component docs)
- [ ] `refactor`: Code refactoring without behavior changes
- [ ] `test`: Unit or component tests added/updated
- [ ] `ci`: CI/CD pipeline or workflow changes

## Technical Checklist (Definition of Done)
- [ ] Code follows team conventions and all commit messages, branch names, and PR titles are written in **English**.
- [ ] UI texts, labels, toasts, and user messages are written in clear, user-friendly **Spanish** without technical jargon.
- [ ] Architecture rule obeyed: presentation components DO NOT make direct `$fetch` calls (all requests go through typed HTTP services / Pinia stores).
- [ ] Role scoping verified: Client Portal views never display internal notes, assigned developer names, or other companies' data.
- [ ] Nitro server proxy correctly handles authentication headers (`Authorization: Bearer <JWT>`).
- [ ] Unit / component tests added or updated (`vitest` / `pnpm test`).
- [ ] Responsive design verified for both desktop and mobile viewports.
- [ ] **STRICT NO SQUASH MERGE**: Merge method must be set to **"Create a merge commit"** (`--no-ff`).

## Reviewer Assignment (Code Owner)
- Assigned Code Owner: @<reviewer-username> (Reviewer must be one of `@AnorakTeam`, `@juandiegosb`, `@CamiloGarcia11`, `@tohond`)
