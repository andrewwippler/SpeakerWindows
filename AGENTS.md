# AGENTS.md - SpeakerWindows Development Guide

This file provides guidelines for agentic coding agents working on this repository.

## Project Overview

SpeakerWindows is a microservice with AdonisJS v7 API (backend) and NextJS frontend. Databases are hosted on Postgres with pgvector, Redis is used as a cache and message broker. Local dev using containers and CLI.

## Build/Lint/Test Commands

### Start Containers
```bash
docker-compose up -d        # Docker
podman-compose up -d        # Podman
docker ps                   # Verify containers are running
```

### Backend (api/)
```bash
cd api
npm ci                      # Install dependencies
npm run dev                 # Dev server (hot reload)
npm run build               # Production build (ignores TS errors)
node ace build               # Alternative build command
npm run start               # Start production server
npm run test                # Run all tests
node ace test tests/functional/user.spec.ts  # Single test file
node ace test --groups="Tag - Team Scoped"  # By test group
node ace test -- --filter="Can create an account"  # By test name
npm run test:coverage       # Tests with coverage
npm run coverage            # Check 95% line coverage
npm run lint                # Lint code
npm run format              # Format code (Prettier)
```

**Environment**: Copy `.env.test` to `.env`. Requires PostgreSQL + Redis: `docker-compose up`

### Frontend (frontend/)
```bash
cd frontend
npm ci                     # Install dependencies
npm run dev                # Dev server
npm run build              # Production build
npm run start              # Start production server
npm run lint               # Lint code
npm run test               # Run Jest tests
npm test -- --testPathPattern=tag  # Single test file
npm run test:coverage       # Run tests with coverage (90% threshold)
```

## Key Facts Agents Should Know

### AdonisJS v7 Upgrade (May 2026)
- **Node.js >= 24 required** (verified: v24.13.1)
- **TypeScript JIT**: Uses `@poppinss/ts-exec` (not `ts-node` or `@swc/core`)
- **Config changes**: `config/app.ts` no longer exports `appKey` - now in `config/encryption.ts`
- **VineJS validators**: Import from `@vinejs/vine`, use `validator.validate(data)` not `request.validate()`
- **Hooks**: `adonisrc.ts` uses `hooks.init: [indexEntities()]`
- **Test glob patterns**: Use `*.{ts,js}` not `(.ts|.js)`
- **Build ignores TS errors**: Uses `--ignore-ts-errors` flag

### Path Aliases (api/)
- `#models/*`, `#controllers/*`, `#services/*`, `#validators/*`, `#abilities/*`
- `#start/*`, `#config/*`, `#app/*`, `#database/*`
- `#generated/*` (new in v7)

### Testing Quirks
- **Test timeout**: 60000ms (60s) for functional tests
- **Transaction isolation**: Tests use `db.beginGlobalTransaction()` / `db.rollbackGlobalTransaction()`
- **Auth**: Most tests require login to getBearer token first
- **Team tests**: Require `TeamFactory`, `TeamMemberFactory` imports
- **Running single test file**: `node ace test <file>` (not `npm run test -- <file>`)

### Code Style Guidelines

#### Backend (api/)
- **TypeScript**, AdonisJS v7, 2-space indent, single quotes, semicolons
- **Naming**: PascalCase for files/classes, camelCase for methods/variables, SCREAMING_SNAKE_CASE for constants
- **strictNullChecks**: enabled, explicit return types for public methods
- **HTTP status codes**: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 429 (rate limited), 500 (server error)
- **Error handling**: Use try/catch for async operations, return appropriate status codes

```typescript
// Good imports
import User from '#models/user'
import { HybridSearchService } from '#services/hybrid_search_service'
import { editTag } from '#app/abilities/main'

// Controller pattern
public async show({ auth, params, response }: HttpContext) {
  try {
    const resource = await Resource.findOrFail(params.id)
    return response.ok(resource)
  } catch {
    return response.notFound({ message: 'Resource not found' })
  }
}
```

**Models**: Extend `BaseModel`, use decorators, define relationships
**Testing**: Japa test runner, Lucid factories for test data, transaction isolation

#### Frontend (frontend/)
- **TypeScript**, NextJS (App Router), React 18, 2-space indent
- **Path alias**: `@/*` for imports from `src/`
- **JSX**: Double quotes for attributes
- **Components**: Functional components with hooks, TypeScript interfaces for props
- **Styling**: Tailwind CSS, `@headlessui/react` for accessible UI
- **State**: Redux Toolkit with `createSlice` in `src/features/`

```typescript
// Good imports
import Header from '@/components/Header'
import { useAppSelector, useAppDispatch } from '@/hooks'
import Api from '@/library/api'

// API usage pattern
const data = await Api.get('/users', {}, token)
const result = await Api.post('/illustrations', payload, token)
```

**API Client**: Bearer token auth, `process.env.NEXT_PUBLIC_HOST_URL` for base URL

## Project Architecture

```
api/
├── app/
│   ├── abilities/         # Bouncer abilities for authorization
│   ├── controllers/http/  # HTTP controllers
│   ├── models/           # Database models (Lucid ORM)
│   ├── services/          # Business logic
│   ├── validators/       # Request validators (VineJS)
│   ├── middleware/        # Custom middleware
│   ├── jobs/              # Background jobs
│   └── policies/          # Authorization policies
├── config/                # Configuration files
├── database/
│   ├── migrations/        # Database migrations
│   └── factories/         # Test factories
├── start/routes.ts        # Route definitions
└── tests/functional/      # Integration tests

frontend/
├── src/
│   ├── components/        # React components
│   ├── features/          # Redux slices
│   ├── hooks.ts           # Custom hooks
│   ├── library/           # Utilities (api.ts, types)
│   ├── pages/             # NextJS pages
│   ├── store.ts           # Redux store
│   └── styles/            # CSS styles
└── tailwind.config.js     # Tailwind config
```

## Importers (Go)

Unified Go binary for importing data from various sources. Build with:

```bash
cd importer
go build -o sw-importer .
```

Usage: `API_TOKEN=<token> ./sw-importer --importer=<type> [--print] <file>`

| `--importer` | Source | File Format |
|--------------|--------|-------------|
| `readwise` | Readwise | CSV |
| `koreader` | KOReader | JSON (`one.json` or `all.json`) |
| `playbooks` | Play Books | HTML or DOCX |
| `kindle` | Kindle PDF Notes | PDF |

All importer types support `--print` flag to preview JSON without posting.

## Lint Config

- **Backend**: ESLint with `@adonisjs/eslint-config/app`
- **Frontend**: ESLint extends `next/core-web-vitals`

## Coverage Requirements

- **Backend**: 95% line coverage required (`npm run coverage`)
- **Frontend**: 90% coverage threshold (`npm run test:coverage`)

## CI/CD

- **API Tests**: `.github/workflows/api-tests.yml` - runs on PostgreSQL + Redis services
- **Frontend Tests**: `.github/workflows/frontend-tests.yml`
- **Docker Build**: `.github/workflows/docker-build-and-push.yml`
- **API Deploy**: `.github/workflows/build-and-deploy.yml`

## Common Gotchas

- **VineJS validation errors**: Return 422 status (not 400). Access errors via `error.messages` in controllers.
- **UUIDs**: Project uses `randomUUID()` from `node:crypto` (not `cuid()` which is removed)
- **Team-scoped tests**: Define `tokenA`/`tokenB` inside each test, not at suite level
- **Test variable types**: Add `: User` type annotation for `let goodUser: User` to avoid TS7005 errors
- **Unused variables**: Remove unused imports/variables to avoid TS6133 errors (build ignores these but tests may fail)
