# Bimbimappa — Project Context

## Overview

**Bimbimappa** (Family Fun Map) is a lightweight, family-focused web app for discovering and organizing kid-friendly places. Families save places they find on social media (Instagram, TikTok) and browse them on an interactive map to plan weekend outings.

**Core tagline:** Save kid-friendly places you discover on Instagram or TikTok. Browse them on a map to plan weekend outings.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18.3.1 |
| Build Tool | Vite 5.3.0 |
| Language | TypeScript |
| Map | react-leaflet 4.2.1 + Leaflet 1.9.4 (OpenStreetMap tiles — free, no API key) |
| Geocoding | Google Places Geocoding API |
| Database | Supabase (PostgreSQL) |
| Authentication | Shared-secret URL token → localStorage |
| Icons | Lucide React 0.383.0 |
| Styling | Custom CSS (CSS variables, no framework) |
| Deployment | Vercel (primary) / Docker + GCP Cloud Run (alternative) |

---

## Directory Structure

```
bimbimappa/
├── src/
│   ├── App.tsx                   # Root component — state, layout, filter logic
│   ├── main.tsx                  # React DOM entry point
│   ├── index.css                 # Global styles (CSS variables, components)
│   ├── components/
│   │   ├── Map.tsx               # Leaflet map, markers, popups
│   │   ├── AddPlacePanel.tsx     # Slide-in form — add / edit place (two-step)
│   │   ├── PlacesList.tsx        # Scrollable list of saved places
│   │   └── AccessDenied.tsx      # Auth-gate component
│   ├── hooks/
│   │   ├── usePlaces.ts          # Supabase CRUD + realtime subscriptions
│   │   └── useAuth.ts            # Token-based auth (URL → localStorage)
│   └── lib/
│       ├── supabase.ts           # Supabase client singleton
│       └── geocode.ts            # Google Geocoding API wrapper
├── supabase/
│   ├── config.toml               # Local Supabase dev config
│   └── migrations/               # Progressive schema history
│       ├── 20260701135304_remote_schema.sql
│       ├── 20260701135900_add_update_policy.sql
│       └── 20260701140000_add_date_range_columns.sql
├── docs/
│   └── gcp_setup_guide.md        # GCP + GitHub Actions deployment guide
├── plans/                        # Iteration planning notes
├── schema.sql                    # Snapshot schema (copy-paste to Supabase SQL editor)
├── Dockerfile                    # Multi-stage: Node build → Nginx runtime
├── docker-compose.yml            # Local container testing
├── nginx.conf                    # SPA routing, gzip, cache headers
├── vite.config.js
├── .env.example                  # Env var template (committed)
└── .env.local                    # Local secrets (gitignored)
```

---

## Data Model

Single table: `places`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `gen_random_uuid()` |
| `name` | text NOT NULL | Place name |
| `address` | text NOT NULL | Formatted address from Geocoding API |
| `lat` | double precision | Latitude |
| `lng` | double precision | Longitude |
| `notes` | text | Optional user notes |
| `source_url` | text | Legacy single link, migrated into `links` |
| `links` | jsonb | `[{ id, url, label, is_primary }]` — multiple source links |
| `category` | text | Optional place category for marker styling and filtering |
| `date_from` | date | Optional start date |
| `date_to` | date | Optional end date |
| `deleted_at` | timestamptz | Soft delete — set instead of hard DELETE |
| `created_at` | timestamptz | Defaults to `now()` |

### RLS Policies

All policies are permissive (any request with the anon key can read, insert, update, delete). Real access control is the shared household token, not RLS.

---

## Key Features

### 1. Authentication — `useAuth.js`
- Admin generates a UUID token and shares a URL: `https://app/?token=UUID`
- On first visit the token is extracted from the URL, validated against `VITE_HOUSEHOLD_TOKEN`, and persisted to `localStorage`
- Subsequent visits read from `localStorage`; the URL is cleaned via `window.history.replaceState`
- Unauthorized visitors see `<AccessDenied />`

### 2. Data Layer — `usePlaces.js`
- `fetchPlaces()` — SELECT all, ordered by `created_at` DESC
- `addPlace()` — INSERT with optimistic state update
- `updatePlace(id, updates)` — UPDATE selected fields
- `deletePlace(id)` — soft delete (sets `deleted_at`); hidden from fetches, recoverable
- `restorePlace(id)` — clears `deleted_at` (undo)
- Supabase realtime channel subscribes to `postgres_changes` on the `places` table; any mutation triggers a full refetch so all family members see updates instantly

### 3. Geocoding — `geocode.js`
- Wraps the Google Geocoding API
- Input: place name or address string
- Output: `{ lat, lng, formattedAddress }`
- Throws on no-results; error displayed inline in the form

### 4. Map — `Map.jsx`
- OpenStreetMap tiles via react-leaflet
- Custom coral teardrop markers, plus state-based variants for new/hovered/center
- Default center: Buenos Aires (-34.6037, -58.3816), zoom 5 (no places) / 10 (places loaded)
- Popup actions: edit, delete, open primary source link + secondary links via the "More" menu
- Leaflet icon CDN URL fix required for Vite

### 5. Add / Edit Panel — `AddPlacePanel.jsx`
- **Step 1:** Enter place name → geocode → confirm coordinates
- **Step 2:** Fill optional fields — multiple links (one primary), notes, date range
- State machine: `idle | searching | saving | error`
- Edit mode pre-populates all fields

### 6. App Shell — `App.jsx`
- Map fills viewport; topbar overlays top; side panel slides in from right
- UI state: `panel` (`null | 'add' | 'list'`), `editingPlace`, `filter` (`'all' | 'week' | 'month'`)
- Client-side date filtering supports overlapping multi-day ranges via `getFilterRange()`
- Only one panel open at a time; edit takes precedence

---

## Environment Variables

All prefixed with `VITE_` (Vite client-side convention):

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `VITE_GOOGLE_PLACES_API_KEY` | ✅ | Google Geocoding API key |
| `VITE_HOUSEHOLD_TOKEN` | ✅ | Shared secret UUID for family auth |
| `VITE_APP_VERSION` | ❌ | Displayed in topbar (optional) |

---

## Coding Conventions

- **Components:** Default exports, functional only, PascalCase filenames
- **Hooks:** `use` prefix, custom hooks in `src/hooks/`
- **CSS:** kebab-case class names, CSS custom properties for theming, no CSS framework
- **Async:** `async/await` + `try/catch`; loading states modelled as string state machines
- **Forms:** Controlled inputs (`onChange` → `useState`), client-side validation only
- **No global store:** state lives in `App.jsx` and custom hooks; Supabase realtime eliminates polling
- **Naming:** camelCase functions, UPPER_CASE module-level constants, kebab-case CSS classes

---

## Deployment

### Vercel (recommended)
1. Connect the GitHub repo in the Vercel dashboard
2. Set the four required env vars under **Settings › Environment Variables**
3. Every push to `main` auto-deploys

### Docker + GCP Cloud Run
```bash
docker build -t bimbimappa .
# tag, push to Artifact Registry, deploy to Cloud Run
```
See `docs/gcp_setup_guide.md` for the full walkthrough and GitHub Actions CI setup.

### Local dev
```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev                   # http://localhost:5173
```

---

## Key Design Decisions

1. **URL-token auth instead of email/password** — zero friction for family members sharing a single link.
2. **RLS is open** — real access control is the shared token; RLS policies exist but are permissive.
3. **Static SPA** — no backend API server; Vite builds to `/dist`, served by Nginx or Vercel.
4. **Realtime over polling** — Supabase `postgres_changes` channel keeps all open sessions in sync.
5. **Google Geocoding** — more reliable than free alternatives; free tier allows ~40k requests/day.
6. **Minimal dependencies** — no CSS framework, no state library, no test runner.

---

## Roadmap (noted in README)

- Category / emoji tags (home, museum, shopping, food, park, etc.)
- Visited toggle
- Photo upload via Supabase Storage
- Filter by tag (client-side)
- PWA (add-to-home-screen, offline cache)

---

## Current UI notes

- Map-first layout with a fixed topbar, floating filter controls, floating location controls, and a right-side panel on desktop.
- Mobile uses a bottom sheet for selected place details and actions.
- Marker styling is currently state-based; category-aware markers are a planned extension.
- The UI would benefit from reducing duplicated filter controls and consolidating contextual actions into fewer surfaces.
