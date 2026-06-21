# Family Fun Map 📍

Save kid-friendly places you discover on Instagram or TikTok. Browse them on a map to plan weekend outings.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vite + React | Fast dev, familiar |
| Map | react-leaflet | Free, OSS, no API key needed |
| Geocoding | Google Places API | Accurate, generous free tier |
| DB | Supabase | Free, realtime, no infra |
| Auth | Shared secret URL | Zero friction for family |
| Hosting | Vercel | Free, one-click deploy |

---

## Setup (15 min)

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New query**, paste `schema.sql`, and run it
3. Copy your **Project URL** and **anon key** from Settings → API

### 2. Google Places API

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the **Geocoding API**
3. Create an API key (restrict it to your Vercel domain in production)

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GOOGLE_PLACES_API_KEY=AIza...
VITE_HOUSEHOLD_TOKEN=<generate at uuidgenerator.net>
```

### 4. Run locally

```bash
npm install
npm run dev
```

### 5. Share with family

Generate the access link:
```
https://your-app.vercel.app/?token=YOUR-HOUSEHOLD-TOKEN
```

Send this once per device. After the first visit, the token is saved — they won't need the link again.

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add the same env vars in the Vercel dashboard under **Settings → Environment Variables**.

---

## File structure

```
src/
  components/
    Map.jsx           # Leaflet map + markers + popups
    AddPlacePanel.jsx # Slide-in form to add a new pin
    PlacesList.jsx    # Scrollable list of saved places
    AccessDenied.jsx  # Shown when token is missing/wrong
  hooks/
    usePlaces.js      # All Supabase CRUD + realtime subscription
    useAuth.js        # Shared-token auth (URL → localStorage)
  lib/
    supabase.js       # Supabase client singleton
    geocode.js        # Google Geocoding API wrapper
  App.jsx
  index.css
schema.sql            # Paste into Supabase SQL editor
```

---

## What's next (when you're ready)

- **Categories / emoji tags** — beach, playground, museum, etc.
- **Visited toggle** — mark places you've already been to
- **Photo upload** — Supabase Storage, one extra column
- **Filter by tag** — client-side, no DB changes needed
- **PWA** — add to home screen, works offline (pins cached)
