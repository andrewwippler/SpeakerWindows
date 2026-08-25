# Migration Plan: React Frontend → AdonisJS Edge + Oat UI

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Phase 1: AdonisJS View Engine Setup](#3-phase-1-adonisjs-view-engine-setup)
4. [Phase 2: Authentication Migration](#4-phase-2-authentication-migration)
5. [Phase 3: Layout & Partials](#5-phase-3-layout--partials)
6. [Phase 4: Page-by-Page Migration](#6-phase-4-page-by-page-migration)
7. [Phase 5: Interactive Behaviors (HTMX/Alpine)](#7-phase-5-interactive-behaviors)
8. [Phase 6: UI Testing with Playwright](#8-phase-6-ui-testing-with-playwright)
9. [Phase 7: Docker Monolith](#9-phase-7-docker-monolith)
10. [Phase 8: CI/CD Updates](#10-phase-8-cicd-updates)
11. [Phase 9: Cleanup & Cutover](#11-phase-9-cleanup--cutover)
12. [Environment Variables (12-Factor)](#12-environment-variables-12-factor)
13. [Risk Assessment & Mitigations](#13-risk-assessment--mitigations)

---

## 1. Executive Summary

**Current state:** Two independent services — a Next.js/React SPA frontend (`sw.wplr.rocks`, port 3000) and an AdonisJS v7 JSON API backend (`sw-api.wplr.rocks`, port 3333). Communication via CORS-protected cross-origin fetch with Bearer token auth through NextAuth.js.

**Target state:** A single AdonisJS v7 monolith that serves both HTML views (Edge templates + Oat CSS) and the JSON API on one domain (`sw.wplr.rocks`), deployable as one Docker container. Auth transitions from NextAuth.js JWT to AdonisJS session-based (`web` guard) for browser requests while preserving the `api` (OAT) guard for programmatic access.

**UI Library:** [Oat](https://oat.ink/) — ~10KB CSS/JS, zero dependencies, semantic HTML, Web Components for interactive widgets (`<ot-dropdown>`, `<ot-taginput>`, `<ot-upload>`, `<ot-tabs>`). Automatic dark mode via `light-dark()`. CDN or npm-included.

**Key constraint:** The existing JSON API must remain functional during and after migration (other clients may depend on it). All routes stay, new view routes are added alongside them.

---

## 2. Architecture Overview

### 2.1 Current Architecture
```
Browser ──HTTPS──▶ sw.wplr.rocks (Next.js :3000)
                         │
                    CORS + Bearer Token
                         │
                         ▼
                   sw-api.wplr.rocks (AdonisJS :3333)
                         │
                    PostgreSQL + Redis
```

### 2.2 Target Architecture
```
Browser ──HTTPS──▶ sw.wplr.rocks (AdonisJS :3333)
                    ├── GET /            → Edge template (HTML)
                    ├── GET /illustration/:id → Edge template (HTML)
                    ├── POST /login      → Session cookie (HTML redirect)
                    ├── POST /api/login  → Bearer token (JSON)
                    ├── GET /api/tags    → JSON (existing)
                    └── POST /api/search → JSON (existing)
                         │
                    PostgreSQL + Redis
```

### 2.3 Route Prefix Convention
| Prefix | Auth | Response | Purpose |
|--------|------|----------|---------|
| `/*` (no prefix) | Session (`web` guard) | HTML (Edge) | Browser-facing pages |
| `/api/*` | Token (`api` guard) | JSON | Programmatic API (existing clients) |

All existing routes get an `/api/` prefix. New view routes occupy the unprefixed space. The original unprefixed routes are **redirected** to `/api/` equivalents for backward compatibility during transition.

---

## 3. Phase 1: AdonisJS View Engine Setup

### 3.1 Install Edge
```bash
cd api
npm install @adonisjs/core @edgejs/compiler
```

### 3.2 Register Edge Provider in `adonisrc.ts`

Add to `providers` array:
```typescript
() => import('@adonisjs/core/providers/view_provider'),
```

### 3.3 Create View Directory Structure
```
api/
├── resources/
│   └── views/
│       ├── layouts/
│       │   └── main.edge          # Main HTML shell
│       ├── components/
│       │   ├── header.edge        # Navigation bar
│       │   ├── flash.edge         # Toast notifications
│       │   ├── footer.edge        # Page footer
│       │   └── pagination.edge    # Reusable pagination
│       ├── auth/
│       │   ├── login.edge
│       │   └── register.edge
│       ├── illustrations/
│       │   ├── index.edge         # Tag index (home)
│       │   ├── show.edge          # Single illustration detail
│       │   ├── new.edge           # Create illustration form
│       │   └── edit.edge          # Edit illustration form (or use show with toggle)
│       ├── tags/
│       │   ├── show.edge          # Tag detail (list illustrations under tag)
│       │   └── index.edge         # All tags (if needed)
│       ├── authors/
│       │   ├── index.edge         # Author listing
│       │   └── show.edge          # Author detail
│       ├── search/
│       │   └── index.edge         # Search form + results
│       ├── articles/
│       │   └── index.edge         # Recently viewed
│       ├── settings/
│       │   └── index.edge         # Settings (tabs: API key, Team, Import, etc.)
│       ├── invitations/
│       │   └── index.edge         # Pending invitations
│       ├── contact/
│       │   └── index.edge         # Contact form
│       ├── help/
│       │   ├── index.edge
│       │   ├── search.edge
│       │   ├── create.edge
│       │   └── import.edge
│       ├── legal/
│       │   ├── tos.edge
│       │   └── privacy.edge
│       └── errors/
│           ├── 404.edge
│           └── 500.edge
```

### 3.4 Install Oat
```bash
cd api
npm install @knadh/oat
```

Serve Oat's static files via AdonisJS static file serving or copy them into `public/`:
```bash
cp node_modules/@knadh/oat/oat.min.css public/oat.min.css
cp node_modules/@knadh/oat/oat.min.js public/oat.min.js
```

Alternatively, configure `static` in `config/app.ts` to serve `node_modules/@knadh/oat/` — but `public/` is simpler.

### 3.5 Enable Method Spoofing
In `config/app.ts`, change:
```typescript
allowMethodSpoofing: true,
```
This is required for `<form method="POST">` with `_method=PUT` or `_method=DELETE` in Edge forms.

### 3.6 Enable Sessions
In `start/kernel.ts`, add session middleware to the router middleware stack:
```typescript
router.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/session/session_middleware'),
  () => import('@adonisjs/flash/flash_middleware'),
  () => import('#middleware/initialize_bouncer_middleware'),
  () => import('@adonisjs/auth/initialize_auth_middleware'),
])
```

Install session and flash packages:
```bash
npm install @adonisjs/session @adonisjs/flash
```

Register providers in `adonisrc.ts`:
```typescript
() => import('@adonisjs/session/session_provider'),
() => import('@adonisjs/flash/flash_provider'),
```

Create `config/session.ts`:
```typescript
import { defineConfig } from '@adonisjs/session'
import env from '#start/env'

export default defineConfig({
  enabled: true,
  cookieName: 'sw_session',
  clearWithBrowser: true,
  age: '2h',
  cookie: {
    domain: env.get('SESSION_COOKIE_DOMAIN', ''),
    httpOnly: true,
    secure: env.get('NODE_ENV') === 'production',
    sameSite: env.get('NODE_ENV') === 'production' ? 'lax' : 'none',
  },
  store: env.get('SESSION_DRIVER', 'cookie'),
  redis: {
    host: env.get('REDIS_HOST'),
    port: env.get('REDIS_PORT'),
    password: env.get('REDIS_PASSWORD'),
  },
})
```

Add env vars to `start/env.ts`:
```typescript
SESSION_DRIVER: Env.schema.enum(['cookie', 'redis'] as const),
SESSION_COOKIE_DOMAIN: Env.schema.string.optional(),
```

### 3.7 Remove Force Content Negotiation
In `config/app.ts`, **remove** or comment out:
```typescript
// forceContentNegotiationTo: 'application/json',
```
This was set because the app was API-only. Now it must negotiate between HTML and JSON based on `Accept` headers and route group.

### 3.8 CSP Updates for Oat
In `config/shield.ts`, update CSP to allow Oat's inline styles (used by CSS variables):
```typescript
csp: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https://avatars.githubusercontent.com'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    formAction: ["'self'"],
  },
},
```

---

## 4. Phase 2: Authentication Migration

### 4.1 Add Web Guard

In `config/auth.ts`, add a `web` guard alongside the existing `api` guard:
```typescript
import { defineConfig } from '@adonisjs/auth'
import { tokensGuard, tokensUserProvider } from '@adonisjs/auth/access_tokens'
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'

const authConfig = defineConfig({
  default: 'web',
  guards: {
    web: sessionGuard({
      provider: sessionUserProvider({
        model: () => import('#models/user'),
      }),
    }),
    api: tokensGuard({
      provider: tokensUserProvider({
        tokens: 'accessTokens',
        model: () => import('#models/user'),
      }),
    }),
  },
})

export default authConfig
```

Install the session auth package:
```bash
npm install @adonisjs/auth
```
(It's already installed, but verify `sessionGuard` is available in the version.)

### 4.2 Dual-Mode Login Controller

Create a new `LoginController` (or modify `UsersController.login`) to handle both modes:

```typescript
// In a new view controller or modified UsersController
public async loginView({ request, response, auth, session }: HttpContext) {
  const { email, password } = request.only(['email', 'password'])

  try {
    const user = await User.verifyCredentials(email, password)
    // Use web guard for session-based auth
    await auth.use('web').login(user)
    session.flash('success', 'Welcome back!')
    return response.redirect('/')
  } catch {
    session.flash('error', 'Invalid email or password')
    return response.redirect('/login')
  }
}
```

The existing `/api/login` route (JSON) remains unchanged — it continues to return a Bearer token.

### 4.3 Dual-Mode Auth Middleware

Create `app/middleware/auth_web_middleware.ts`:
```typescript
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthWebMiddleware {
  redirectTo = '/login'

  async handle(ctx: HttpContext, next: NextFn) {
    if (!ctx.auth.use('web').isAuthenticated) {
      return ctx.response.redirect(this.redirectTo)
    }
    return next()
  }
}
```

Register in `start/kernel.ts`:
```typescript
export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware'),
  authWeb: () => import('#middleware/auth_web_middleware'),
})
```

### 4.4 Registration Flow

New view route `POST /register` → `RegistrationController.storeView`:
- Validates with `CreateUserValidator`
- Creates `User`, `Team`, `TeamMember` (same logic as existing `UsersController.store`)
- Auto-logs in with `auth.use('web').login(user)`
- Redirects to `/` with flash success message

### 4.5 Logout

New view route `GET /logout` → destroys session:
```typescript
public async destroy({ auth, response }: HttpContext) {
  await auth.use('web').logout()
  return response.redirect('/login')
}
```

### 4.6 Remember Me (Optional Enhancement)

If desired, the `sessionGuard` supports `rememberMe` tokens. Add a checkbox to the login form and pass `{ rememberMe: true }` to `auth.use('web').login(user, { rememberMe })`.

---

## 5. Phase 3: Layout & Partials

### 5.1 Main Layout (`resources/views/layouts/main.edge`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title || 'SpeakerWindows' }}</title>
  <link rel="stylesheet" href="/oat.min.css">
  <link rel="stylesheet" href="/custom.css">
  <script src="/oat.min.js" defer></script>
  @if(searchEnabled)
    <script src="https://unpkg.com/htmx.org@2/dist/htmx.min.js" defer></script>
    <script src="https://unpkg.com/htmx.org@2/dist/ext/response-targets.js" defer></script>
  @endif
</head>
<body>
  @!component('components/header')

  <main class="container" style="max-width: 960px; margin: 0 auto; padding: 1rem;">
    @!component('components/flash')

    @if(flashMessages.has('success'))
      <div role="alert" data-variant="success">
        {{ flashMessages.get('success') }}
      </div>
    @endif

    {{{ await $slots.main() }}}
  </main>

  @!component('components/footer')
</body>
</html>
```

### 5.2 Custom CSS (`public/custom.css`)

Override Oat CSS variables to match the current sky/blue theme:
```css
:root {
  --primary: #0369a1;        /* sky-700 */
  --primary-foreground: #fff;
  --secondary: #e0f2fe;      /* sky-100 */
  --secondary-foreground: #0c4a6e;
  --accent: #bae6fd;         /* sky-200 */
  --danger: #dc2626;
  --success: #16a34a;
  --warning: #d97706;
  --background: #f8fafc;     /* slate-50 */
  --foreground: #0f172a;     /* slate-900 */
  --muted: #f1f5f9;          /* slate-100 */
  --muted-foreground: #64748b;
  --border: #e2e8f0;         /* slate-200 */
  --ring: #0369a1;
}
```

### 5.3 Header Component (`components/header.edge`)

```html
<header>
  <nav data-topnav>
    <a href="/" class="unstyled"><strong>SpeakerWindows</strong></a>
    <menu class="buttons">
      <li><a href="/" class="ghost">Tags</a></li>
      <li><a href="/new-illustration" class="ghost">New</a></li>
      <li><a href="/articles" class="ghost">Articles</a></li>
      <li><a href="/authors" class="ghost">Authors</a></li>
      <li><a href="/search" class="ghost">Search</a></li>
      <li><a href="/settings" class="ghost">Settings</a></li>
      <li><a href="/help" class="ghost">Help</a></li>
    </menu>
    <span>
      @if(auth.isAuthenticated)
        <a href="/logout" class="button outline small">Sign Out</a>
      @else
        <a href="/login" class="button small">Sign In</a>
      @endif
    </span>
  </nav>
</header>
```

### 5.4 Flash Component (`components/flash.edge`)

Uses Oat's `<div role="alert">` with `data-variant`:
```html
@if(flashMessages.has('error'))
  <div role="alert" data-variant="error">
    {{ flashMessages.get('error') }}
  </div>
@endif

@if(flashMessages.has('info'))
  <div role="alert">
    {{ flashMessages.get('info') }}
  </div>
@endif
```

### 5.5 Footer (`components/footer.edge`)

```html
<footer style="text-align: center; padding: 2rem; border-top: 1px solid var(--border); margin-top: 2rem;">
  <small>
    &copy; {{ new Date().getFullYear() }} SpeakerWindows &middot;
    <a href="/tos">Terms</a> &middot;
    <a href="/privacy-policy">Privacy</a> &middot;
    <a href="/contact">Contact</a>
  </small>
</footer>
```

---

## 6. Phase 4: Page-by-Page Migration

Each page is migrated by:
1. Creating an Edge template in `resources/views/`
2. Adding a new controller method in a `*ViewController` class
3. Adding a view route in `start/routes.ts`
4. Converting React component markup to semantic HTML + Oat classes

### 6.1 Route Mapping Table

| React Page | Edge Route | Controller | Notes |
|------------|-----------|------------|-------|
| `/` (home/tag index) | `GET /` | `TagsViewController.index` | Fetches tags, renders 3-col grid |
| `/login` | `GET /login` | `AuthViewController.loginForm` | Oat form elements |
| `/login` (POST) | `POST /login` | `AuthViewController.login` | Session-based, redirects |
| `/register` | `GET /register` | `AuthViewController.registerForm` | |
| `/register` (POST) | `POST /register` | `AuthViewController.register` | |
| `/logout` | `GET /logout` | `AuthViewController.logout` | Destroys session |
| `/new-illustration` | `GET /new-illustration` | `IllustrationsViewController.new` | Form with `<ot-taginput>` |
| `/illustration/:id` | `GET /illustration/:id` | `IllustrationsViewController.show` | Detail + inline edit |
| `/illustration/:id` (edit) | `PUT /illustration/:id` | `IllustrationsViewController.update` | `_method=PUT` |
| `/illustration/:id` (delete) | `DELETE /illustration/:id` | `IllustrationsViewController.destroy` | Confirmation dialog |
| `/articles` | `GET /articles` | `ArticlesViewController.index` | Recently viewed (server-side session) |
| `/authors` | `GET /authors` | `AuthorsViewController.index` | |
| `/author/:name` | `GET /author/:name` | `AuthorsViewController.show` | |
| `/tag/:name` | `GET /tag/:name` | `TagsViewController.show` | Illustrations under tag |
| `/search` | `GET /search` | `SearchViewController.index` | Search form |
| `/search` (POST) | `POST /search` | `SearchViewController.search` | Hybrid search results |
| `/settings` | `GET /settings` | `SettingsViewController.index` | Tabbed: API key, Team, Import |
| `/invitations` | `GET /invitations` | `InvitationsViewController.index` | |
| `/join/:code` | `GET /join/:code` | `TeamsViewController.join` | Auto-join flow |
| `/contact` | `GET /contact` | `ContactViewController.index` | |
| `/contact` (POST) | `POST /contact` | `ContactViewController.store` | |
| `/help` | `GET /help` | `HelpViewController.index` | |
| `/help/:topic` | `GET /help/:topic` | `HelpViewController.show` | search/create/import |
| `/tos` | `GET /tos` | `LegalViewController.tos` | Static |
| `/privacy-policy` | `GET /privacy-policy` | `LegalViewController.privacy` | Static |

### 6.2 View Controllers

Create new controllers in `app/controllers/http/`:

```
api/app/controllers/http/
├── views/
│   ├── auth_view_controller.ts
│   ├── illustrations_view_controller.ts
│   ├── tags_view_controller.ts
│   ├── authors_view_controller.ts
│   ├── search_view_controller.ts
│   ├── articles_view_controller.ts
│   ├── settings_view_controller.ts
│   ├── invitations_view_controller.ts
│   ├── teams_view_controller.ts
│   ├── contact_view_controller.ts
│   ├── help_view_controller.ts
│   └── legal_view_controller.ts
```

Each controller renders Edge templates using `view.render()`:

```typescript
import type { HttpContext } from '@adonisjs/core/http'

export default class TagsViewController {
  public async index({ view, auth }: HttpContext) {
    const tags = await Tag.query()
      .where('user_id', auth.user!.id)
      .orderBy('name')

    return view.render('illustrations/index', { tags })
  }
}
```

### 6.3 Illustration Detail Page (Most Complex)

The illustration detail page (`/illustration/:id`) currently handles:
- Display with tags, author, source, content
- Inline editing via `IllustrationForm` component
- File upload (images)
- Places management (add/edit/delete)
- Role-based UI (owner/editor/readonly)
- Delete with confirmation dialog

**Edge approach:**
- Use Oat's `<dialog>` for delete confirmation (native `<dialog>` with `commandfor`)
- Use Oat's `<ot-upload>` for file uploads (Web Component, client-side JS)
- Use Oat's `<ot-taginput>` for tag editing
- Use `<ot-tabs>` for switching between view/edit modes
- Use `<form method="POST">` with `_method=PUT` for edits
- Use `<form method="POST">` with `_method=DELETE` for deletes

### 6.4 Tag Select / Autocomplete

The React `TagSelect` component fetches all tags and filters them as the user types. In the Edge version:

**Option A (server-side):** Use a form with `<datalist>` for autocomplete — the Edge template renders all tag names into `<datalist>` options:
```html
<label data-field>
  Tags
  <ot-taginput>
    <input list="tag-list" name="tags" placeholder="Add tags...">
  </ot-taginput>
  <datalist id="tag-list">
    @each(tag in tags)
      <option value="{{ tag.name }}">
    @endeach
  </datalist>
</label>
```

**Option B (HTMX):** Use `hx-get="/api/tags/search?name=..."` on the input to fetch filtered tags as the user types, rendered as an `<option>` list. This provides the same dynamic filtering as the React version.

### 6.5 File Upload

Use Oat's `<ot-upload>` Web Component:
```html
<form method="POST" action="/upload" enctype="multipart/form-data">
  <input type="hidden" name="illustration_id" value="{{ illustration.id }}">
  <ot-upload>
    <div data-field class="vstack">
      <input type="file" name="illustration_image" accept=".png,.jpg,.jpeg,.gif,.pdf" hidden>
      <button type="button" class="ghost">Choose file</button>
      <div data-files>
        <small data-hint>Drop file here or click to choose (max 20MB)</small>
      </div>
    </div>
  </ot-upload>
  <button type="submit">Upload</button>
</form>
```

The upload route (`POST /upload`) already handles multipart via AdonisJS bodyparser — no change needed on the server side. The controller can redirect back to the illustration page after upload.

### 6.6 Search Page

The search page uses a form POST to `/search`:
```html
<form method="POST" action="/search">
  <fieldset class="group">
    <input type="text" name="query" placeholder="Search illustrations, tags, places..." required>
    <button type="submit">Search</button>
  </fieldset>
</form>

@if(results)
  <section>
    <h3>Places</h3>
    @each(place in results.places)
      <a href="/illustration/{{ place.illustration_id }}">{{ place.place }}</a>
    @endeach
  </section>

  <section>
    <h3>Tags</h3>
    @each(tag in results.tags)
      <a href="/tag/{{ tag.name }}">{{ tag.name }}</a>
    @endeach
  </section>

  <section>
    <h3>Illustrations</h3>
    @each(ill in results.illustrations)
      <article class="card">
        <header>
          <h4><a href="/illustration/{{ ill.id }}">{{ ill.title }}</a></h4>
        </header>
        <p>{{ ill.contentPreview }}</p>
      </article>
    @endeach
  </section>
@endif
```

### 6.7 Settings Page (Tabbed)

Use Oat's `<ot-tabs>` Web Component:
```html
<ot-tabs data-anchor="settings">
  <div role="tablist">
    <button role="tab" id="api-key">API Key</button>
    <button role="tab" id="team">Team</button>
    <button role="tab" id="import">Import</button>
    <button role="tab" id="preferences">Preferences</button>
  </div>

  <div role="tabpanel">
    <!-- API Key section -->
    <label data-field>
      Your API Token
      <input type="text" value="{{ token }}" readonly>
      <button onclick="navigator.clipboard.writeText(this.previousElementSibling.value)">Copy</button>
    </label>
  </div>

  <div role="tabpanel">
    <!-- Team management -->
    ...
  </div>

  <div role="tabpanel">
    <!-- Import highlights -->
    <form method="POST" action="/import" enctype="multipart/form-data">
      <ot-upload>...</ot-upload>
      <label data-field>
        Importer Type
        <select name="importer">
          <option value="readwise">Readwise</option>
          <option value="koreader">KOReader</option>
          <option value="playbooks">Play Books</option>
          <option value="kindle">Kindle</option>
        </select>
      </label>
      <button type="submit">Import</button>
    </form>
  </div>

  <div role="tabpanel">
    <!-- Preferences (default place/location) -->
    ...
  </div>
</ot-tabs>
```

---

## 7. Phase 5: Interactive Behaviors (HTMX/Alpine.js)

Several React features require client-side interactivity. Since Oat is CSS-only (except 4 Web Components), we need a lightweight JS solution for:

### 7.1 HTMX for Dynamic Updates

**When to use HTMX:**
- Inline tag autocomplete (fetched from server as user types)
- Search results without full page reload
- Adding/removing places on illustration detail page
- Team member management (add/remove/change role)
- Invitation accept/decline without page reload
- Tag rename/delete without full page reload

**Install:** CDN via `<script src="https://unpkg.com/htmx.org@2" defer></script>`

**Example — Tag autocomplete:**
```html
<input
  type="text"
  name="tag_search"
  hx-get="/api/tags/search"
  hx-trigger="input changed delay:300ms"
  hx-target="#tag-results"
  placeholder="Type to search tags..."
>
<div id="tag-results"></div>
```

The server returns HTML fragments for HTMX to swap in. The existing `/api/tags/:name` search endpoint can be reused with a small wrapper that returns HTML instead of JSON.

### 7.2 Alpine.js for Client State

**When to use Alpine.js:**
- Mobile hamburger menu toggle
- Confirmation dialogs (show/hide)
- Form validation feedback
- "Recently viewed" client-side list (optional — can be server-side via session)

**Install:** CDN via `<script src="https://unpkg.com/alpinejs@3" defer></script>`

**Example — Mobile menu:**
```html
<div x-data="{ open: false }">
  <button @click="open = !open" class="mobile-menu-toggle">Menu</button>
  <nav x-show="open" x-transition>
    <!-- nav links -->
  </nav>
</div>
```

### 7.3 Recently Viewed (Articles Page)

The React version stores recently viewed in Redux (client-side only). Options for the Edge version:

**Option A (Recommended): Server-side session store**
- On each illustration view, push `{id, title, accessedAt}` to a session-stored array (capped at 50)
- The `ArticlesViewController.index` reads from the session and renders the page
- Pro: Works without JS, persists across tabs
- Con: Session cookie size grows (mitigate by storing only IDs and querying the DB)

**Option B: LocalStorage + HTMX**
- Store in `localStorage` (same as React)
- Use a small Alpine.js script to read and render
- Pro: No server storage needed
- Con: Client-side only, requires JS

**Recommended: Option A** with a twist — store only illustration IDs in the session (keeping cookie small), then batch-load the illustration data server-side in the controller.

---

## 8. Phase 6: UI Testing with Playwright

### 8.1 Why Playwright (not Jest/Testing Library)

The React frontend used Jest + Testing Library for component tests. For a server-rendered Edge app, **Playwright** is the right choice:
- Tests the actual rendered HTML from the server
- Tests full user flows across pages (login → create → search → verify)
- Tests JavaScript-enhanced behavior (HTMX, Web Components)
- Supports multiple browsers
- Built-in test isolation, fixtures, and parallelism
- Better for regression testing the full stack

### 8.2 Setup

```bash
cd api
npm install -D @playwright/test
npx playwright install chromium
```

Create `api/tests/ui/playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './',
  timeout: 60000,
  retries: 1,
  use: {
    baseURL: process.env.APP_URL || 'http://localhost:3333',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3333,
    reuseExistingServer: true,
  },
})
```

### 8.3 Test Files

Create `api/tests/ui/` directory:
```
tests/ui/
├── auth.spec.ts           # Login, registration, logout
├── illustration.spec.ts   # CRUD operations
├── upload.spec.ts         # File uploads
├── search.spec.ts         # Search functionality
├── tags.spec.ts           # Tag management
├── settings.spec.ts       # Settings page
├── navigation.spec.ts     # Header, footer, responsive
└── fixtures/
    ├── auth.fixture.ts    # Shared login helper
    └── test-data.ts       # Test user, illustration data
```

### 8.4 Test: Authentication (Login)

```typescript
// tests/ui/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText('Sign In')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('login with valid credentials redirects to home', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
    await expect(page.locator('[role="alert"][data-variant="success"]')).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/login')
    await expect(page.locator('[role="alert"][data-variant="error"]')).toBeVisible()
  })

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL('/login')
  })
})
```

### 8.5 Test: User Registration

```typescript
test('registration creates account and logs in', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`
  await page.goto('/register')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', 'SecurePass123!')
  await page.fill('input[name="password_confirmation"]', 'SecurePass123!')
  await page.check('input[name="tos"]')
  await page.check('input[name="age_verification"]')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/')
})

test('registration rejects mismatched passwords', async ({ page }) => {
  await page.goto('/register')
  await page.fill('input[name="email"]', 'new@example.com')
  await page.fill('input[name="password"]', 'pass1')
  await page.fill('input[name="password_confirmation"]', 'pass2')
  await page.click('button[type="submit"]')
  // Should stay on register page with error
  await expect(page).toHaveURL('/register')
})
```

### 8.6 Test: Create Illustration

```typescript
test('create new illustration with tags', async ({ page }) => {
  // Login first
  await loginAs(page, 'test@example.com', 'password123')

  await page.goto('/new-illustration')
  await expect(page.locator('h1')).toContainText('New Illustration')

  await page.fill('input[name="title"]', 'Test Illustration')
  await page.fill('input[name="author"]', 'Test Author')
  await page.fill('input[name="source"]', 'Test Source')
  await page.fill('textarea[name="content"]', 'This is test content for the illustration.')

  // Add tags using ot-taginput
  const tagInput = page.locator('ot-taginput input')
  await tagInput.fill('philosophy')
  await tagInput.press('Enter')
  await tagInput.fill('wisdom')
  await tagInput.press('Enter')

  await page.click('button[type="submit"]')

  // Should redirect to the new illustration's detail page
  await expect(page.locator('[role="alert"][data-variant="success"]')).toBeVisible()
  await expect(page.locator('h1')).toContainText('Test Illustration')
})
```

### 8.7 Test: File Upload

```typescript
test('upload image to illustration', async ({ page }) => {
  await loginAs(page, 'test@example.com', 'password123')

  // Create an illustration first
  const illId = await createTestIllustration(page)

  await page.goto(`/illustration/${illId}`)

  // Upload file
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles({
    name: 'test-image.png',
    mimeType: 'image/png',
    buffer: Buffer.from('fake-png-data'),
  })

  await page.click('button:has-text("Upload")')

  // Verify upload appears in the illustration's file list
  await expect(page.locator('text=test-image.png')).toBeVisible()
})
```

### 8.8 Test: Search

```typescript
test('search finds illustrations by title', async ({ page }) => {
  await loginAs(page, 'test@example.com', 'password123')

  // Seed data
  await createTestIllustration(page, { title: 'The Art of War' })

  await page.goto('/search')
  await page.fill('input[name="query"]', 'Art of War')
  await page.click('button[type="submit"]')

  // Results should appear
  await expect(page.locator('text=The Art of War')).toBeVisible()
  await expect(page.locator('text=Test Author')).toBeVisible()
})

test('search with no results shows empty state', async ({ page }) => {
  await loginAs(page, 'test@example.com', 'password123')
  await page.goto('/search')
  await page.fill('input[name="query"]', 'xyznonexistent')
  await page.click('button[type="submit"]')

  await expect(page.locator('text=No results found')).toBeVisible()
})
```

### 8.9 Test Helpers (Fixtures)

```typescript
// tests/ui/fixtures/auth.fixture.ts
import { type Page, type BrowserContext } from '@playwright/test'

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/')
}

export async function createTestIllustration(
  page: Page,
  overrides?: { title?: string; author?: string; content?: string }
) {
  await page.goto('/new-illustration')
  await page.fill('input[name="title"]', overrides?.title || 'Test Illustration')
  await page.fill('input[name="author"]', overrides?.author || 'Test Author')
  await page.fill('textarea[name="content"]', overrides?.content || 'Test content')
  await page.click('button[type="submit"]')

  // Extract the illustration ID from the URL after redirect
  const url = page.url()
  const match = url.match(/\/illustration\/(\d+)/)
  return match ? parseInt(match[1]) : null
}
```

### 8.10 npm Script

In `api/package.json`, add:
```json
{
  "scripts": {
    "test:ui": "playwright test --config=tests/ui/playwright.config.ts",
    "test:ui:headed": "playwright test --config=tests/ui/playwright.config.ts --headed"
  }
}
```

### 8.11 Coverage Strategy

Playwright doesn't provide code coverage out of the box. To measure UI test coverage:

1. **Istanbul/instrumentation:** Use `nyc` to instrument the Edge controller code during tests
2. **Manual mapping:** Maintain a coverage matrix (feature → test) in a spreadsheet or markdown file
3. **Critical path coverage:** Ensure these flows have tests:
   - [ ] Login → view tags → view illustration → logout
   - [ ] Register → create illustration → add tags → upload file
   - [ ] Search → view results → navigate to illustration
   - [ ] Settings → team management → invite member
   - [ ] Settings → import highlights → verify illustrations created
   - [ ] Tag detail → rename tag → verify illustrations updated
   - [ ] Contact form → submit → verify success message

---

## 9. Phase 7: Docker Monolith

### 9.1 New Unified Dockerfile

Create `Dockerfile` at the repo root (replacing the two separate ones):

```dockerfile
# ---- Base ----
FROM node:24-slim AS base
RUN apt-get update && apt-get install -y dumb-init --no-install-recommends && rm -rf /var/lib/apt/lists/*
WORKDIR /home/node/app
RUN chown node:node /home/node/app
USER node

# ---- Dependencies ----
FROM base AS dependencies
COPY api/package*.json ./
RUN npm ci

# ---- Model Cache ----
FROM base AS model-cache
COPY api/model-cache/ ./model-cache/

# ---- Build ----
FROM dependencies AS build
COPY api/ ./
RUN npm run build

# ---- Production ----
FROM base AS production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333
ENV APP_NAME=SpeakerWindows
COPY --from=dependencies --chown=node:node /home/node/app/node_modules ./node_modules
COPY --from=build --chown=node:node /home/node/app/build ./build
COPY --from=model-cache --chown=node:node /home/node/app/model-cache ./model-cache
# Copy Oat static files
COPY --from=build --chown=node:node /home/node/app/public ./build/public
EXPOSE 3333
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "bin/server.js"]
```

### 9.2 Updated `docker-compose.yml`

For local development (monolith mode):
```yaml
version: '2'
services:
  redis:
    image: redis:alpine
    ports:
      - "127.0.0.1:6379:6379"

  db:
    image: pgvector/pgvector:pg17
    volumes:
      - ./tmp/db:/var/lib/postgresql/data
      - ./api/database/docker-seed.sql:/docker-entrypoint-initdb.d/docker-seed.sql
    environment:
      POSTGRES_PASSWORD: adonis
      POSTGRES_DB: speaker_illus
    ports:
      - "127.0.0.1:5432:5432"

  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "127.0.0.1:3333:3333"
    env_file:
      - api/.env
    depends_on:
      - db
      - redis
    volumes:
      - ./api/uploads:/home/node/app/build/uploads
```

### 9.3 Production `docker-compose.prod.yml`

```yaml
version: '2'
services:
  app:
    image: d.wplr.rocks/speakerwindows:latest
    ports:
      - "127.0.0.1:3333:3333"
    env_file:
      - .env.production
    environment:
      - NODE_ENV=production
      - HOST=0.0.0.0
      - PORT=3333
      - SESSION_DRIVER=redis
    depends_on:
      - db
      - redis

  db:
    image: pgvector/pgvector:pg17
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: speaker_illus

  redis:
    image: redis:alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

### 9.4 Kubernetes Migration

Current K8s deployments to consolidate:

| Current | Target |
|---------|--------|
| `speakerwindows-api` (Deployment + Service) | `speakerwindows` (Deployment + Service) |
| `speakerwindows-frontend` (Deployment + Service) | **Deleted** |
| Ingress: `sw.wplr.rocks` → frontend | Ingress: `sw.wplr.rocks` → app |
| Ingress: `sw-api.wplr.rocks` → api | Ingress: `sw-api.wplr.rocks` → app (alias) |

The Ingress should route both domains to the single app service. The app serves both HTML and JSON on the same port.

**Ingress annotation example:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: speakerwindows
  namespace: web
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
    - hosts:
        - sw.wplr.rocks
        - sw-api.wplr.rocks
      secretName: sw-tls
  rules:
    - host: sw.wplr.rocks
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: speakerwindows
                port:
                  number: 3333
    - host: sw-api.wplr.rocks
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: speakerwindows
                port:
                  number: 3333
```

---

## 10. Phase 8: CI/CD Updates

### 10.1 Consolidated GitHub Actions

**Delete:**
- `.github/workflows/frontend-tests.yml`
- `.github/workflows/frontend-build.yml`

**Modify `.github/workflows/api-tests.yml` → rename to `tests.yml`:**
```yaml
name: Tests
on:
  push:
    branches: [master]
  pull_request:

jobs:
  api-tests:
    # ... existing API test job ...

  ui-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24.x
          cache: 'npm'
          cache-dependency-path: api/package-lock.json
      - run: npm ci
        working-directory: ./api
      - run: npx playwright install --with-deps chromium
        working-directory: ./api
      - run: npm run test:ui
        working-directory: ./api
        env:
          APP_URL: http://localhost:3333
```

**Modify `.github/workflows/docker-build-and-push.yml`:**

Remove the `build_frontend_container` job. The single container is built from the root Dockerfile:
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: |
            d.wplr.rocks/speakerwindows:${{ github.sha }}
            d.wplr.rocks/speakerwindows:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            kubectl --namespace web set image deployment/speakerwindows \
              app=d.wplr.rocks/speakerwindows:${{ github.sha }}
```

### 10.2 Delete Frontend-Specific Files

After migration is complete and verified:
- `frontend/` directory entirely
- `frontend/Dockerfile`
- `.github/workflows/frontend-tests.yml`
- `.github/workflows/frontend-build.yml`

---

## 11. Phase 9: Cleanup & Cutover

### 11.1 Backward-Compatible Route Redirects

During transition, redirect old API paths from `/` to `/api/`:
```typescript
// In start/routes.ts, add at the top (before view routes)
router.redirect('/login', '/api/login', 301)  // Only if no view route conflicts
router.redirect('/register', '/api/register', 301)
// ... etc.
```

**Important:** The view routes for `/login`, `/register`, etc. occupy the same paths as the old API routes. The strategy is:

1. Move all existing API routes under `/api/` prefix
2. Add view routes at the unprefixed paths
3. Add a catch-all API redirect for any external clients hitting old paths

**Revised approach for routes.ts:**
```typescript
// API routes (all under /api prefix)
router.group(() => {
  router.post('login', [UsersController, 'login'])
  router.post('register', [UsersController, 'store'])
  router.get('/illustrations', [IllustrationsController, 'index'])
  // ... all existing routes ...
}).prefix('/api').use(middleware.auth({ guards: ['api'] }))

// Public API routes
router.group(() => {
  router.post('contact', [ContactsController, 'store'])
  router.post('login', [UsersController, 'login'])
  router.post('register', [UsersController, 'store'])
}).prefix('/api')

// View routes (session-based auth)
router.group(() => {
  router.get('/', [TagsViewController, 'index'])
  router.get('/login', [AuthViewController, 'loginForm'])
  router.post('/login', [AuthViewController, 'login'])
  // ... all view routes ...
}).use(middleware.authWeb({ guards: ['web'] }))
```

### 11.2 Feature Flag for Gradual Rollout

Use an env var to control which frontend is served:
```typescript
VITE_ENABLED: Env.schema.string.optional(),
```

During transition, run both frontends in parallel:
- `sw.wplr.rocks` → Next.js (old)
- `sw-staging.wplr.rocks` → AdonisJS Edge (new)

After verification, cut over `sw.wplr.rocks` to AdonisJS Edge.

### 11.3 Monitoring

- Monitor error rates during cutover
- Check session cookie size (Redis-backed sessions recommended for production)
- Verify all Oat Web Components work in target browsers
- Test dark mode on actual devices

---

## 12. Environment Variables (12-Factor)

### 12.1 Domain Configuration

Add to `start/env.ts`:
```typescript
APP_DOMAIN: Env.schema.string({ format: 'url' }),
```

Add to `.env`:
```
APP_DOMAIN=https://sw.wplr.rocks
```

Usage in controllers/templates:
```typescript
// In controllers
const domain = env.get('APP_DOMAIN', 'http://localhost:3333')

// In Edge templates
<a href="{{ domain }}/settings">Settings</a>
```

For the `<title>` tag and Open Graph meta:
```html
<title>{{ title || 'SpeakerWindows' }} — {{ appDomain }}</title>
<meta property="og:url" content="{{ appDomain }}{{ request.url() }}">
```

### 12.2 Complete New Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `APP_DOMAIN` | Yes | `https://sw.wplr.rocks` | Canonical domain for the app |
| `SESSION_DRIVER` | Yes | `cookie` | Session store (`cookie` or `redis`) |
| `SESSION_COOKIE_DOMAIN` | No | `""` | Cookie domain (set to `.wplr.rocks` for shared domain) |
| `SESSION_SECRET` | Yes | — | Cookie signing secret (separate from `APP_KEY`) |

### 12.3 Production `.env.example`

```
HOST=0.0.0.0
PORT=3333
NODE_ENV=production
APP_KEY=<generated-key>
APP_NAME=SpeakerWindows
APP_DOMAIN=https://sw.wplr.rocks
DRIVE_DISK=local
SESSION_DRIVER=redis
SESSION_COOKIE_DOMAIN=.wplr.rocks
SESSION_SECRET=<generated-secret>

DB_CONNECTION=pg
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<db-password>
DB_DATABASE=speaker_illus

REDIS_CONNECTION=main
REDIS_HOST=redis
REDIS_PORT=6379

LIMITER_STORE=redis
ALLOWED_ORIGINS=https://sw.wplr.rocks,https://sw-api.wplr.rocks
```

---

## 13. Risk Assessment & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Oat Web Components have browser compatibility issues | Medium | Low | Oat uses native `<dialog>`, `<details>`, Popover API — all modern. Test in target browsers. |
| Session cookie size exceeds limits | Medium | Low | Use Redis-backed sessions, store only IDs in session |
| Existing API clients break from route prefix change | High | Medium | Keep old routes with redirects. Add `/api/` prefix gradually with feature flag. |
| HTMX adds unacceptable complexity | Low | Medium | HTMX is optional progressive enhancement. Core functionality works without JS via form submissions. |
| Playwright tests are slow in CI | Low | Low | Use `--project=chromium` only, reuse web server, parallelize test files |
| CSP blocks Oat/HTMX scripts | High | Low | Update CSP directives before deployment. Test with `Content-Security-Policy-Report-Only` first. |
| Dark mode doesn't match current theme | Low | High | Oat auto-detects via `prefers-color-scheme`. Override CSS variables for custom dark palette. |
| Edge template XSS vulnerabilities | High | Low | Edge auto-escapes by default. Use `{{{ }}}` only for trusted content. Always validate with `@html.safe()`. |

---

## Migration Order (Recommended)

| Step | Phase | Effort | Dependency |
|------|-------|--------|------------|
| 1 | Phase 1: View engine + sessions | 1-2 days | None |
| 2 | Phase 2: Auth migration | 2-3 days | Phase 1 |
| 3 | Phase 3: Layout + components | 2-3 days | Phase 1 |
| 4 | Phase 4: Page migration (home, login, register) | 2-3 days | Phases 2-3 |
| 5 | Phase 4: Page migration (illustrations, tags, authors) | 3-5 days | Phase 4.4 |
| 6 | Phase 4: Page migration (search, settings, teams) | 3-5 days | Phase 4.5 |
| 7 | Phase 4: Page migration (help, legal, contact) | 1-2 days | Phase 4.6 |
| 8 | Phase 5: HTMX/Alpine interactivity | 2-3 days | Phase 4 |
| 9 | Phase 6: Playwright tests | 3-5 days | Phase 4 |
| 10 | Phase 7: Docker monolith | 1-2 days | Phase 4 |
| 11 | Phase 8: CI/CD updates | 1 day | Phases 6-7 |
| 12 | Phase 9: Cleanup + cutover | 1-2 days | All above |

**Total estimated effort: 22-35 days** (1 developer, full-time)
