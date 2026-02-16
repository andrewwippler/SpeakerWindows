# Speaker Windows

[![API Tests](https://github.com/andrewwippler/SpeakerWindows/actions/workflows/api-tests.yml/badge.svg)](https://github.com/andrewwippler/SpeakerWindows/actions/workflows/api-tests.yml) [![Latest Version Deployed](https://github.com/andrewwippler/SpeakerWindows/actions/workflows/build-and-deploy.yml/badge.svg)](https://github.com/andrewwippler/SpeakerWindows/actions/workflows/build-and-deploy.yml)

Speaker Windows is your personal, searchable repository for digital illustrations, notes, and highlights. Think of it as a smarter replacement for keeping everything in paper folders, Word documents, or apps like Evernote and OneNote.

## Try It First

You can try Speaker Windows right now - no installation needed:

**Public Server:** [http://sw.wplr.rocks/](http://sw.wplr.rocks/)

The demo gives you a free account to explore the features. Import your highlights from reading apps and see how easy it is to find exactly what you need later.

## Why Speaker Windows?

- **Smart Search** - Find exactly what you need using keywords, similar meanings, or even fuzzy matches for typos
- **Organize Your Way** - Group illustrations by tags and authors.
- **Import from Your Apps** - Bring in highlights from Readwise, KOReader, and Google Play Books
- **Image Support** - Upload and organize images alongside your text notes
- **Your Data, Your Control** - Host it yourself or use the available public server.

## Features

- **Hybrid Search** - Combines multiple search methods for better results:
  - Full-text search on titles and content
  - Vector search for semantic similarity
  - Fuzzy matching for typo tolerance
- **Author Organization** - Browse and manage by author
- **Image Uploads** - Attach images or documents to any illustration
- **Import Tools** - Bring data from Readwise, KOReader, and Google Play Books

## Technology

Speaker Windows is built with modern, reliable technologies:

**Backend:**
- AdonisJS v6 (Node.js framework)
- TypeScript
- PostgreSQL with pgvector for vector search
- Redis for caching and sessions

**Frontend:**
- NextJS 16 with App Router
- React 18
- Redux Toolkit for state management
- Tailwind CSS for styling

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        SpeakerWindows                         │
├─────────────────────┬───────────────────────────────────────┤
│      Frontend       │                 API                    │
│    (NextJS 16)      │           (AdonisJS v6)              │
│                     │                                        │
│  ┌───────────────┐  │   ┌────────────┐  ┌──────────────┐  │
│  │    Pages      │  │   │ Controllers│  │  Validators   │  │
│  └───────────────┘  │   └────────────┘  └──────────────┘  │
│  ┌───────────────┐  │   ┌────────────┐  ┌──────────────┐  │
│  │  Components   │  │   │   Models   │  │   Services    │  │
│  └───────────────┘  │   └────────────┘  └──────────────┘  │
│  ┌───────────────┐  │   ┌──────────────────────────────┐   │
│  │ Redux Store   │  │   │   Hybrid Search Service     │   │
│  └───────────────┘  │   │ (FTS + Vector + Fuzzy Match) │   │
└──────────┬──────────┘   └──────────────┬───────────────┘  │
           │                              │                    │
           └──────────────┬───────────────┘                    │
                          │                                    │
              ┌───────────▼───────────┐                        │
              │      PostgreSQL        │                        │
              │  (pgvector, tsvector)  │                        │
              └───────────────────────┘                        │
              ┌───────────────────────┐                        │
              │        Redis           │                        │
              │  (Sessions, Cache)     │                        │
              └───────────────────────┘                        │
                                                               │
   ┌─────────────────────────────────────────────────────────┐
   │     Importers (Standalone Go Binaries)                  │
   │  readwise_importer  |  koreader_importer  | playbooks  │
   └─────────────────────────────────────────────────────────┘
```

## Quick Start (Local Development)

Need 3 terminals open:

```bash
# Terminal 1: Start database and Redis
docker-compose up

# Terminal 2: Start the API
cd api
npm ci
cp .env.test .env
npm run dev

# Terminal 3: Start the frontend
cd frontend
npm ci
npm run dev
```

Then open http://localhost:3000 in your browser.

### Environment Setup

The API needs a `.env` file. Copy the example:

```bash
cp api/.env.test api/.env
```

The default settings work for local development with Docker Compose.

## API Overview

The API provides RESTful endpoints for managing illustrations, users, tags, and more.

### Authentication

All protected endpoints require a Bearer token. Get your token from the login endpoint.

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/register` | POST | Create a new account |
| `/login` | POST | Get authentication token |
| `/illustrations` | GET | List all illustrations |
| `/illustration` | POST | Create new illustration |
| `/illustration/:id` | GET | Get illustration details |
| `/illustration/:id` | PUT | Update illustration |
| `/illustration/:id` | DELETE | Delete illustration |
| `/tags` | GET | List all tags |
| `/author/:name` | GET | Get illustrations by author |
| `/settings` | GET/PPOST | Manage user settings |
| `/search` | POST | Hybrid search endpoint |

### Example: Create an Illustration

```bash
curl -X POST https://sw-api.wplr.rocks/illustration \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Note Title",
    "author": "John Author",
    "source": "Book Name p. 42",
    "content": "The actual note content...",
    "tags": ["important", "quotes"]
  }'
```

## Importers

Bring in your highlights from other apps. All importers are standalone Go binaries.

### Get Your API Token

1. Log in to Speaker Windows
2. Go to Settings
3. Look for "API Token"

### Readwise Importer

Import highlights from Readwise CSV exports:

```bash
# Build (if needed)
cd readwise_importer
go build -o readwise-import-script main.go

# Run
API_TOKEN=your_token ./readwise-import-script data.csv
```

### KOReader Importer

Import highlights from KOReader JSON exports:

```bash
# Import to API
API_TOKEN=your_token ./koreader_importer highlights.json

# Preview only (don't post to API)
./koreader_importer highlights.json --print
```

### Google Play Books Importer

Import highlights from Google Play Books exports (HTML or DOCX):

```bash
# Import to API
API_TOKEN=your_token ./playbooks_importer export.html

# Preview only
./playbooks_importer export.html --print
```

### Common Options

- **Duplicate Handling** - Importers automatically skip duplicates (based on content + source)
- **Preview Mode** - Use `--print` to see what would be imported without posting to the API

## Development

### Running Tests

```bash
cd api
npm run test              # Run all tests
npm run test -- tests/functional/user.spec.ts  # Single file
npm run test -- --filter="Can create an account"  # By test name
```

### Code Quality

```bash
# Lint
cd api && npm run lint
cd frontend && npm run lint

# Format
cd api && npm run format
```

### Coverage Requirements

The backend requires 95% test coverage. Check coverage with:

```bash
cd api
npm run coverage
```

## Deployment

### Docker

Both the API and frontend include Dockerfiles:

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### CI/CD

The project includes GitHub Actions workflows for:
- Running tests on push and pull requests
- Building and deploying to production

## Migrating from Speaker-Illustrations

If you have an older installation, here's how to migrate:

1. Clone this repository
2. Place your `Speaker-Illustrations-backup.sql` file in `./tmp/seeds`
3. Start Docker Compose: `docker-compose up`
4. Run migrations:
   ```bash
   cd api
   node ace migration:run
   ```

## License

Apache 2.0 - See the LICENSE file for details.

---

Built by [Andrew Wippler](https://github.com/andrewwippler). Inspired by the need to notes and highlights for public speaking.
