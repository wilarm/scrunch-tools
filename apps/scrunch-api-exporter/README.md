# Scrunch API Exporter

A tool for exporting data from the Scrunch API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (optional, for future Supabase integration):
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

## Running the Application

You need to run **two processes** simultaneously:

### Terminal 1: Start the Proxy Server
```bash
npm run server
```
This starts the local Express proxy server on port 3002. It handles API calls to the Scrunch API.

### Terminal 2: Start the Vite Dev Server
```bash
npm run dev
```
This starts the React frontend application.

## Architecture

### Local Proxy Server (Current)
- Location: `server.js`
- Port: 3002
- Purpose: Proxies requests to the Scrunch API to avoid CORS issues
- Endpoints:
  - `POST /api/scrunch-proxy` - Main proxy endpoint for both responses and query endpoints

### Supabase Edge Function (Future)
- Location: `supabase/functions/scrunch-proxy/`
- Status: Not deployed yet
- To deploy: Install Supabase CLI and run `supabase functions deploy scrunch-proxy`

## API Endpoints

### Responses Endpoint
Fetches individual responses from the Scrunch API.
- Supports field filtering (optional)
- Pagination handled automatically
- Max 10,000 rows when fetchAll is enabled

### Query Endpoint
Fetches aggregated query metrics.
- Requires at least one metric field
- Supports competitor metrics with proper dimensions
- Pagination handled automatically
- Max 10,000 rows when fetchAll is enabled

## Development

- `npm run dev` - Start Vite dev server
- `npm run server` - Start local proxy server
- `npm run build` - Build for production
- `npm run typecheck` - Type check the code
- `npm run lint` - Lint the code
