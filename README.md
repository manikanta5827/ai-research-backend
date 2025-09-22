# AI Research Backend

Turns a user topic into a quick research brief:
- Finds relevant articles
- Extracts content (FastAPI microservice)
- Summarizes with Gemini
- Returns a final summary and keywords

## Run

Prereqs: Docker, Docker Compose, GEMINI_API_KEY.

1) Create `.env` in project root:
```
GEMINI_API_KEY=your_key_here
```
2) Start services:
```
docker compose up -d --build
```
3) API: `http://localhost:4000`

### Local (no Docker)

```
npm install
npm start               # starts APP on port 4000
npm run start:workers   # starts background workers
```

## Endpoints

- POST `/research` (headers: `user`, body: `{ "topic": "..." }`)
- GET `/research` (headers: `user`)
- GET `/research/:id` (headers: `user`)

## Features

- Web search + scraping (FastAPI)
- Per-article LLM summaries (Gemini)
- Final synthesis (summary + keywords)
- Background queue (BullMQ + Redis)
- Postgres via Prisma
- Logging to `/app/logs/app.log`

## DB Schema

### Task Table
- `id` (UUID): Unique task identifier
- `user` (String): User who created the task
- `topic` (String): Research topic/query
- `status` (Enum): pending → running → succeeded/failed
- `progress` (Int): 0-100% completion percentage
- `createdAt` (DateTime): Task creation timestamp
- `completedAt` (DateTime): Task completion timestamp
- `error` (String): Error message if failed

### Log Table
- `id` (Int): Auto-increment log entry ID
- `taskId` (String): References Task.id
- `step` (String): Workflow step name (e.g., "web_search", "ai_summarization")
- `message` (String): Human-readable log message
- `meta` (JSON): Additional metadata (API responses, counts, etc.)
- `createdAt` (DateTime): Log entry timestamp

### TaskResult Table
- `id` (UUID): Unique result identifier
- `taskId` (String): References Task.id (one-to-one)
- `result` (JSON): Structured research output:
  - `topic`: Original research topic
  - `articles`: Array of summarized articles with URLs, titles, summaries, keywords
  - `final_synthesis`: Combined overview and merged keywords
- `createdAt` (DateTime): Result creation timestamp

### Relationships
- Task → Log (one-to-many): Each task has multiple log entries
- Task → TaskResult (one-to-one): Each task has one final result

## Checklist

- [x] API + background jobs + DB
- [x] Dockerized (compose)
- [x] CI/CD to EC2
- [x] Frontend deployed (separate)