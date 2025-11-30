# Topside DB

A comprehensive database, search engine, and data ingestion pipeline for [Arc Raiders](https://embark-studios.com/games/arc-raiders). Topside DB aggregates game data from multiple sources, processes it through an AI-enhanced ingestion pipeline, and serves it via a fast, searchable web interface.

## Tech Stack

- **Bun** - JavaScript runtime
- **Turborepo** - Monorepo build system
- **TanStack Start** - Frontend with file-based routing
- **Cloudflare Workers** - Frontend deployments
- **Railway** - Backend deployments
- **Elysia + oRPC** - Type-safe backend API
- **Drizzle ORM + PostgreSQL** - Database layer
- **Meilisearch** - Full-text search engine
- **Redis** - Caching
- **Effect-TS** - Functional programming for the ingestion pipeline
- **shadcn/ui + Tailwind CSS** - UI components

## Project Structure

```
topside-db/
├── apps/
│   ├── web/           # React frontend (TanStack Start, shadcn/ui)
│   ├── server/        # Elysia API server
│   ├── ingest/        # Data ingestion pipeline (Effect-TS, LLM-powered, Community data sources)
│   └── discord-bot/   # Discord bot
├── packages/
│   ├── api/           # oRPC routers and business logic
│   ├── db/            # Drizzle schema and migrations
│   ├── schemas/       # Shared Zod schemas for game data
│   ├── redis/         # Redis client wrapper
│   ├── utils/         # Shared utilities
│   └── logger/        # Logging utilities
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- Docker and Docker Compose

### Installation

```bash
bun install
```

### Development Services

The `docker-compose.yml` is used for **local development only**. Start the services with:

```bash
docker compose up -d
```

#### Service URLs

| Service                | URL                   | Description                    |
| ---------------------- | --------------------- | ------------------------------ |
| Drizzle Studio Gateway | http://localhost:4983 | Database management UI         |
| Redis Insight          | http://localhost:5540 | Redis GUI for cache inspection |
| Meilisearch Dashboard  | http://localhost:7700 | Search engine admin panel      |

> **Note:** Meilisearch master key is `masterKey` in development.

> **Note:** `postgresql://postgres:postgres@postgres:5432/topside` is the default connection string for the database.

### Running the App

```bash
bun run dev
```

- **Web App:** http://localhost:3001
- **API Server:** http://localhost:3000

### Database

Push schema changes:

```bash
bun run db:push
```

Open Drizzle Studio:

```bash
bun run db:studio
```

## Data Ingestion

The `apps/ingest` pipeline handles all data collection and processing:

1. **Source Data** - Pulls structured game data from the [arcraiders-data](https://github.com/RaidTheory/arcraiders-data) repository
2. **Wiki Scraping** - Scrapes the Arc Raiders wiki for additional information (ARCs, maps, traders)
3. **LLM Enhancement** - Uses AI (via OpenRouter) to extract structured data from wiki pages and translate non-English content
4. **Database Sync** - Upserts all data into PostgreSQL
5. **Search Indexing** - Syncs data to Meilisearch for fast full-text search

Run the ingestion pipeline:

```bash
bun run --cwd apps/ingest start
```

## Available Scripts

| Script                | Description                        |
| --------------------- | ---------------------------------- |
| `bun run dev`         | Start all apps in development mode |
| `bun run build`       | Build all apps                     |
| `bun run dev:web`     | Start only the web app             |
| `bun run dev:server`  | Start only the API server          |
| `bun run check-types` | TypeScript type checking           |
| `bun run db:push`     | Push schema to database            |
| `bun run db:studio`   | Open Drizzle Studio                |
