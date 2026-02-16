# AGENTS.md - SpeakerWindows Development Guide

This file provides guidelines for agentic coding agents working on this repository.

## Project Overview

SpeakerWindows is a microservice with AdonisJS v6 API (backend) and NextJS frontend. Databases are hosted on Postgres, Redis is used as a cache and message broker. Local dev using containers and CLI.

## Build/Lint/Test Commands

### Start Containers
Run these commands to start the dev environment:
```bash
# Docker Compose
docker-compose up -d

# Podman Compose (Alternative)
podman-compose up -d
```

### Verify Status
Check container status with:
```bash
docker ps
podman ps
```

### Pre-Test Requirement
Ensure containers are running before executing tests. The PostgreSQL and Redis services are required for test execution.

### Backend (api/)

```bash
cd api
npm ci                      # Install dependencies
npm run dev                 # Dev server (hot reload)
npm run build               # Production build
npm run start               # Start production server
npm run test                # Run all tests
npm run test -- tests/functional/user.spec.ts  # Single test file
npm run test -- --filter="Can create an account"  # By name
npm run test:coverage       # Tests with coverage
npm run coverage            # Check 95% line coverage
npm run lint                # Lint code
npm run format              # Format code (Prettier)
```

**Environment**: Copy `.env.test` to `.env`. Requires PostgreSQL + Redis: `docker-compose up`

### Frontend (frontend/)

```bash
cd frontend
npm ci          # Install dependencies
npm run dev     # Dev server
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Lint code
```

## Code Style Guidelines

### Backend (api/)

- TypeScript, AdonisJS v6, 2-space indent, single quotes, semicolons
- Use path aliases: `#models/*`, `#controllers/*`, `#services/*`, etc.
- PascalCase for files/classes, camelCase for methods/variables
- strictNullChecks enabled, explicit return types for public methods
- Try/catch for async, appropriate HTTP status codes (200, 400, 401, 404, 429, 500)
- Lucid ORM: extend BaseModel, use decorators, factories for tests
- Use VineJS validators for request validation

```typescript
// Good imports
import User from '#models/user'
import { HybridSearchService } from '#services/hybrid_search_service'
```

**Testing**: Japa test runner, transaction isolation, factories for test data

### Frontend (frontend/)

- TypeScript, NextJS 16 (App Router), React 18, 2-space indent, double quotes in JSX
- Use path alias `@/*` for imports from `src/`
- Functional components with hooks, TypeScript interfaces for props
- Tailwind CSS for styling, `@headlessui/react` for accessible UI
- Redux Toolkit with createSlice in `src/features/`

```typescript
// Good imports
import Header from '@/components/Header'
import { useAppSelector } from '@/hooks'
import Api from '@/library/api'

// API usage
const data = await Api.get('/users', {}, token)
const result = await Api.post('/illustrations', payload, token)
```

**API Client**: Use Bearer token auth, `process.env.NEXT_PUBLIC_HOST_URL` for base URL

## Project Architecture

```
api/
├── app/controllers/http/   # HTTP controllers
├── app/models/            # Database models (Lucid ORM)
├── app/services/          # Business logic
├── app/validators/       # Request validators (VineJS)
├── app/middleware/       # Custom middleware
├── app/jobs/             # Background jobs
├── app/policies/         # Authorization policies
├── config/               # Configuration files
├── database/migrations/  # Database migrations
├── database/factories/  # Test factories
├── start/routes.ts       # Route definitions
└── tests/functional/    # Integration tests

frontend/
├── src/
│   ├── components/       # React components
│   ├── features/          # Redux slices
│   ├── hooks.ts           # Custom hooks
│   ├── library/           # Utilities (api.ts, types)
│   ├── pages/            # NextJS pages
│   ├── store.ts           # Redux store
│   └── styles/            # CSS styles
├── next.config.js         # NextJS config
└── tailwind.config.js     # Tailwind config
```

## Importers

Standalone Go binaries for importing data from external sources. Build with `go build -o <output> main.go`.

### readwise_importer/
Parses Readwise CSV export:
```bash
API_TOKEN=<token> ./readwise-import-script data.csv
```

### koreader_importer/
Parses KOReader JSON exports (one.json, all.json):
```bash
API_TOKEN=<token> ./koreader_importer <file.json>   # Import to API
./koreader_importer <file.json> --print            # Preview only
```

### playbooks_importer/
Parses Google Play Books exports (HTML, DOCX):
```bash
API_TOKEN=<token> ./playbooks_importer <file.html|docx>   # Import to API
./playbooks_importer <file.html|docx> --print            # Preview only
```

All importers:
- Require `API_TOKEN` environment variable (get from SpeakerWindows password page)
- Handle duplicate detection (skip on 409 response)
- Support `--print` flag to preview JSON without posting
- POST to `https://sw-api.wplr.rocks/illustration`

## Lint Config

- Backend: ESLint with `@adonisjs/eslint-config/app`
- Frontend: ESLint extends `next/core-web-vitals`

## Coverage Requirements

- 95% line coverage required (backend)
- Run `npm run coverage` to check
