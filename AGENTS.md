# AGENTS.md - SpeakerWindows Development Guide

This file provides guidelines for agentic coding agents working on this repository.

## Project Overview

SpeakerWindows is a microservice with AdonisJS v6 API (backend) and NextJS frontend. Databases are hosted on Postgres, Redis is used as a cache and message broker. Local dev using containers and CLI.

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
npm run build               # Production build
npm run start               # Start production server
npm run test                # Run all tests
npm run test tests/functional/user.spec.ts  # Single test file
npm run test -- --filter="Can create an account"  # By test name
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
npm run test -- --testPathPattern=tag  # Single test file
npm run test:coverage       # Run tests with coverage (90% threshold)
```

## Code Style Guidelines

### Backend (api/)

- **TypeScript**, AdonisJS v6, 2-space indent, single quotes, semicolons
- **Path aliases**: `#models/*`, `#controllers/*`, `#services/*`, `#validators/*`, `#abilities/*`
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

### Frontend (frontend/)

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

Standalone Go binaries for importing data. Build with `go build -o <output> main.go`.

| Directory | Source | Command |
|-----------|--------|---------|
| readwise_importer/ | Readwise CSV | `API_TOKEN=<token> ./readwise-import-script data.csv` |
| koreader_importer/ | KOReader JSON | `API_TOKEN=<token> ./koreader_importer file.json` |
| playbooks_importer/ | Play Books (HTML/DOCX) | `API_TOKEN=<token> ./playbooks_importer file.html` |

All importers support `--print` flag to preview JSON without posting.

## Lint Config

- **Backend**: ESLint with `@adonisjs/eslint-config/app`
- **Frontend**: ESLint extends `next/core-web-vitals`

## Coverage Requirements

- **Backend**: 95% line coverage required (`npm run coverage`)
- **Frontend**: 90% coverage threshold (`npm run test:coverage`)
