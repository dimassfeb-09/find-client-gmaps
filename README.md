# Google Maps Scraper

Scrape business data from Google Maps — name, address, coordinates, city, phone, email, and website — with a React UI to browse and filter results.

## Features

- **Scrape** business listings from Google Maps by keyword + location
- **Sequential mode** — process one listing at a time (default, safer)
- **Concurrent mode** — process multiple listings in parallel (faster)
- **Filter** by city, website status, phone availability, and WhatsApp (08xx) numbers
- **WhatsApp links** — auto-generate `wa.me` links for Indonesian numbers
- **Marking** — places without a website are flagged with a "No Website" badge
- **Delete** individual entries with confirmation dialog
- **Stats cards** — total, with/without website, with/without phone, per city

## Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- Google Chrome (for Puppeteer)

## Installation

```bash
# Clone the repo
git clone https://github.com/dimassfeb-09/find-client-gmaps.git
cd find-client-gmaps

# Install backend dependencies
bun install

# Install frontend dependencies
cd client && bun install && cd ..
```

## Configuration

Edit `config/config.json`:

```json
{
  "mode": "sequential",
  "concurrency": 3,
  "queries": [
    { "keyword": "restaurant", "location": "Jakarta" },
    { "keyword": "cafe", "location": "Jakarta" }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `mode` | `"sequential"` \| `"concurrent"` | Scraping mode |
| `concurrency` | number | Parallel tabs (concurrent mode only) |
| `queries` | array | List of keyword + location pairs |

## Usage

### Start the full stack

```bash
# Terminal 1: Backend API server
bun run server

# Terminal 2: Frontend dev server
cd client && bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run scraper standalone (CLI)

```bash
bun run scraper
```

This reads `config.json` and saves results to the SQLite database.

### Scrape via UI

1. Open the web app
2. Fill in **Keyword** (e.g. `restaurant`) and **Location** (e.g. `Jakarta`)
3. Choose **Sequential** or **Concurrent** mode
4. Click **Scrape**
5. Browse, filter, and delete results in the table below

## Project Structure

```
scrappinggmaps/
├── config/config.json            # Search queries + mode
├── database/
│   ├── schema.sql                # SQLite schema
│   └── db.js                     # Database queries
├── scraper/
│   ├── googleMapsScraper.js      # Puppeteer scraping logic
│   └── index.js                  # CLI entry point
├── server/
│   ├── index.js                  # Express server (port 4000)
│   └── routes/places.js          # REST API routes
├── client/                       # React + Vite + shadcn UI
│   └── src/
│       ├── App.jsx
│       ├── hooks/usePlaces.js
│       └── components/
│           ├── DataTable.jsx      # Table with WhatsApp + delete
│           ├── FilterBar.jsx      # Search + filters
│           ├── ScrapeDialog.jsx   # Scrape form with mode select
│           └── StatsCard.jsx      # Summary stats
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/places` | List places (supports `?city=`, `?search=`, `?hasWebsite=`, `?hasPhone=`, `?hasWhatsApp=`) |
| `GET` | `/api/places/:id` | Get single place |
| `DELETE` | `/api/places/:id` | Delete a place |
| `GET` | `/api/cities` | List distinct cities with counts |
| `GET` | `/api/stats` | Summary statistics |
| `POST` | `/api/scrape` | Trigger scrape (`{ keyword, location, mode }`) |
| `POST` | `/api/clear` | Delete all data |

## Tech Stack

- **Scraping**: Puppeteer (headless Chrome)
- **Backend**: Express.js + better-sqlite3
- **Frontend**: React + Vite + shadcn/ui + Tailwind CSS v4
