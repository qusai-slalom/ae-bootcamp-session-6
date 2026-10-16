<!--
Sync Impact Report
==================
Version change: (template, unversioned) → 1.0.0
Bump rationale: Initial ratification. All template placeholders replaced with
project-specific principles derived from the docs/ folder.

Modified principles (template slot → new title):
- Principle 1 → I. Code Quality & Consistency
- Principle 2 → II. Test-First Quality (NON-NEGOTIABLE)
- Principle 3 → III. Consistent, Accessible UI
- Principle 4 → IV. Simplicity & Scope Discipline
- Principle 5 → V. Robust Error Handling & Validated Boundaries

Added sections:
- Technology & Architecture Constraints (template section 2)
- Development Workflow & Quality Gates (template section 3)
- Governance (filled in)

Removed sections: none

Source documents:
- docs/coding-guidelines.md → Principles I, V; Development Workflow
- docs/testing-guidelines.md → Principle II; Quality Gates
- docs/ui-guidelines.md → Principle III
- docs/functional-requirements.md → Principle IV; Technology Constraints
- docs/project-overview.md → Technology & Architecture Constraints

Templates reviewed (read the constitution at runtime; no edits required):
- ✅ .specify/templates/plan-template.md (Constitution Check gate)
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md

Follow-up TODOs:
- TODO(LINT_SCRIPT): docs/coding-guidelines.md references `npm run lint` and
  `npm run lint:fix`, but no lint scripts are configured in any package.json
  (frontend relies on the react-scripts ESLint config only). Add lint scripts
  so the lint quality gate can be enforced from the command line.
-->

# Todo App Constitution

## Core Principles

### I. Code Quality & Consistency

All code MUST follow [docs/coding-guidelines.md](../../docs/coding-guidelines.md).

- Formatting: 2-space indentation, LF line endings, no trailing whitespace, lines ideally
  under 100 characters.
- Naming: `camelCase` for variables and functions, `UPPER_SNAKE_CASE` for constants,
  `PascalCase` for React components and classes. Component file names MUST match the
  component name (e.g., `TodoCard.js`).
- Imports MUST be ordered external libraries → internal modules → styles, with groups
  separated by a blank line, using relative paths and no circular dependencies.
- Each module, component, and function MUST have a single responsibility (SOLID). Duplicated
  logic MUST be extracted into a shared utility or component (DRY).
- Comments explain *why*, not *what*. Public functions and components SHOULD carry JSDoc.
- No `console.log` statements may remain in production code.

**Rationale**: A uniform codebase lowers review cost and lets AI-generated and human-written
code be read, tested, and maintained the same way.

### II. Test-First Quality (NON-NEGOTIABLE)

All testing MUST follow [docs/testing-guidelines.md](../../docs/testing-guidelines.md).

- New behavior MUST be covered by tests written before or alongside the implementation
  (Red → Green → Refactor). Bug fixes MUST add a failing regression test before the fix.
- Code coverage MUST be at least 80% per package; critical user workflows (create, view,
  toggle, edit, delete todo) MUST have 100% coverage.
- Unit tests (Jest) cover components, route handlers, services, and utilities in isolation.
  Integration tests (Jest + React Testing Library for frontend, Jest + Supertest for
  backend) cover component interactions and frontend ↔ API communication.
- Tests MUST verify behavior rather than implementation details, follow Arrange-Act-Assert,
  be independent (no shared state, any execution order), and mock external dependencies.
- Tests live in `__tests__/` directories colocated with source and are named
  `{filename}.test.js`. Shared fixtures live in `__mocks__/` or `fixtures/`.
- End-to-end tests are out of scope unless a future amendment adds them.

**Rationale**: Tests are the executable specification; enforcing them first keeps generated
code honest and makes refactoring safe.

### III. Consistent, Accessible UI

All user-facing work MUST follow [docs/ui-guidelines.md](../../docs/ui-guidelines.md).

- Use the defined design tokens only: the light/dark color palettes, the system font stack
  and typography scale, and the 8px spacing grid (8/16/24/32/48px). Hard-coded colors or
  spacing outside these tokens are not permitted.
- Layout is a single centered column with a 600px max width; components (todo card, inputs,
  buttons, confirmation dialog) MUST match the specified structure, states, and variants.
- Both light and dark modes MUST be supported. The preference persists in `localStorage`
  and defaults to the system preference on first visit.
- Accessibility is mandatory: every interactive element is keyboard accessible, color
  contrast meets WCAG AA, form inputs have associated labels, icon buttons have
  `aria-label`s, and focus indicators are visible.
- Motion is minimal to none; the Halloween theme stays playful, not scary.

**Rationale**: A single design system keeps the UI coherent across features and ensures the
app is usable by everyone.

### IV. Simplicity & Scope Discipline

Features MUST stay within [docs/functional-requirements.md](../../docs/functional-requirements.md).

- The product is a single-user todo app: create, view (newest first), toggle completion,
  edit title/due date, and delete (with confirmation). Titles are required, max 255
  characters; due dates are optional.
- Items listed as out of scope (authentication, multi-user, priorities, categories/tags,
  recurring todos, reminders, undo/redo, bulk operations, filtering/search, mobile-specific
  optimization) MUST NOT be built without first amending the functional requirements.
- Prefer the simplest solution that satisfies the requirement (KISS, YAGNI). Avoid premature
  optimization; any added complexity MUST be justified in the plan's Complexity Tracking.

**Rationale**: A small, well-defined scope keeps the app maintainable and prevents
speculative features from diluting quality.

### V. Robust Error Handling & Validated Boundaries

- Every operation that can fail (API calls, persistence, parsing) MUST handle errors
  explicitly and surface a clear, actionable message to the user.
- Input MUST be validated at system boundaries: the backend API validates all request data
  (e.g., title presence and length, date format) and returns appropriate HTTP status codes;
  the frontend validates before submitting.
- All changes MUST be persisted to the backend immediately; the UI MUST NOT report success
  for an operation the backend rejected.
- Use guard clauses and defaults to prevent `undefined` errors; JSDoc type annotations are
  encouraged on critical functions.

**Rationale**: Users must be able to trust that what they see is what was saved, and
validated boundaries prevent bad data from spreading through the system.

## Technology & Architecture Constraints

- **Monorepo**: npm workspaces with `packages/frontend` and `packages/backend`, as described
  in [docs/project-overview.md](../../docs/project-overview.md).
- **Frontend**: React (Create React App / `react-scripts`), plain CSS with theme variables,
  Jest + React Testing Library.
- **Backend**: Node.js + Express.js REST API, Jest for tests, existing persistence mechanism
  (no schema changes beyond basic todo storage).
- **Runtime**: Node.js v16+ and npm v7+.
- **Structure**: Frontend code is organized into `components/`, `services/`, and `utils/`;
  backend code into `routes/`, `controllers/`, `services/`, and `middleware/` as the code
  grows, per the File Organization section of the coding guidelines.
- New runtime dependencies MUST be justified in the implementation plan.

## Development Workflow & Quality Gates

- **Branching**: Work happens on feature branches (e.g., `feature/<name>` or SpecKit's
  `###-feature-name`); changes merge to `main` only via pull request.
- **Commits**: Atomic, with descriptive messages that explain the *why* (conventional
  prefixes such as `feat:`, `fix:`, `docs:` are preferred).
- **Spec-driven flow**: Non-trivial features follow specify → plan → tasks → implement. Each
  plan MUST pass the Constitution Check before design and again after it.
- **Gates before opening a PR**:
  1. `npm test` passes for all packages.
  2. Coverage meets Principle II thresholds.
  3. No lint errors or warnings (see TODO(LINT_SCRIPT) in the Sync Impact Report).
  4. The Code Review Checklist in the coding guidelines and the Test Review Checklist in the
     testing guidelines are satisfied.
- **Review**: Reviewers MUST verify compliance with this constitution and reject changes
  that violate a principle without a documented, approved justification.

## Governance

- This constitution supersedes other practices. The documents in `docs/` provide the
  detailed, runtime guidance; where a doc and this constitution conflict, the constitution
  wins until the doc is amended to match. Where docs conflict with each other, functional
  requirements govern *what* is built and UI guidelines govern *how* it looks.
- **Amendments**: Proposed via pull request that edits this file, updates the Sync Impact
  Report, and updates any affected `docs/` files or SpecKit templates in the same change.
- **Versioning** (semantic):
  - MAJOR: principles removed or redefined in a backward-incompatible way.
  - MINOR: a principle or section is added or materially expanded.
  - PATCH: clarifications, wording, and typo fixes.
- **Compliance**: Every plan includes a Constitution Check, and every PR review confirms
  adherence. Unjustified complexity or principle violations block merge.

**Version**: 1.0.0 | **Ratified**: 2026-10-16 | **Last Amended**: 2026-10-16
