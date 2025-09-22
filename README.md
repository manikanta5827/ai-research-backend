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

## Checklist

- [x] API + background jobs + DB
- [x] Dockerized (compose)
- [x] CI/CD to EC2
- [x] Frontend deployed (separate)