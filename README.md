# Machine Learning Degrees Website

A website for [machinelearningdegrees.com](https://machinelearningdegrees.com)
and [mldegrees.com](https://mldegrees.com) that helps people learn about
machine learning degrees and find top programs.

## Project Structure

- `frontend/`: Next.js frontend application
- `backend/`: Go backend API

## Getting Started

### Frontend

```bash
cd frontend
npm install
next dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000).

### Backend

```bash
cd backend
go run cmd/api/main.go
```

### Database

```bash
docker run -d --name postgres -e POSTGRES_PASSWORD=testing -p 5432:5432 postgres
docker exec -it postgres  psql -U postgres
CREATE DATABASE mldegrees;
```

The API will be available at [http://localhost:8080](http://localhost:8080).

## Development

See [OpenCode.md](./OpenCode.md) for development guidelines and commands.
