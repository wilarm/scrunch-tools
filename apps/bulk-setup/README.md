# Bulk Setup

A tool for configuring brands and prompts in bulk via the Scrunch API.

## What it does

Two workflows in one app:

- **Configure brands in bulk** — paste a list of websites, define a description/persona template, preview and edit the generated brand configs, optionally enrich them with AI-detected brand data (name, location, competitors), then submit them all to the Scrunch API.
- **Add prompts in bulk** — write seed prompts with dynamic variables (`{{brand_name}}`, `{{primary_location}}`, custom variables), target one or more brand IDs, select platforms and stages, preview the full matrix of prompt variants, and submit them all to the API.

## Development

```bash
npm install
npm run dev
```

Visit `http://localhost:5173/bulk-setup/`

## Template variables

Prompts support the following built-in variables:

| Variable | Description |
|---|---|
| `{{brand_name}}` | Brand's name |
| `{{primary_location}}` | Brand's primary location (city/region) |

Custom variables can also be defined in the UI and used in prompts with the same `{{variable_name}}` syntax.

## Available commands

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run typecheck  # Type check
npm run lint       # Lint
```
