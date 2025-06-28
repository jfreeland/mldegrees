# ML Degrees Monorepo Project

## Project Structure

- `frontend`: Next.js frontend
- `backend`: Go backend
- `deploy`: fluxcd manifests deploying frontend and backend using helm to kubernetes
- `REQUIREMENTS.md`: project requirements
- `Makefile`: convenience functions for common tasks

## General Instructions

Work on one project requirement from the `REQUIREMENTS.md` file at a time.
Instruct me when you are ready for your work to be reviewed. You will not
commit code.

You should run unit tests as you are working to ensure the code is correct and
has met the defined requirements.

I will run the frontend and backend so that I can be testing in the browser,
for now.

## Frontend Commands (Next.js)

- Dev: `cd frontend && npm run dev`
- Build: `cd frontend && npm run build`
- Lint: `cd frontend && npm run lint`
- Test: `cd frontend && npm test`
- Test (watch): `cd frontend && npm run test:watch`
- Test (single): `cd frontend && npm test -- -t "test name"`
- Typecheck: `cd frontend && npm run typecheck`

## Backend Commands (Go)

- Run: `cd backend && DATABASE_URL='postgres://postgres:testing@localhost/mldegrees?sslmode=disable' go run cmd/api/main.go`
- Build: `cd backend && go build -o bin/api cmd/api/main.go`
- Test: `cd backend && go test ./...`
- Test (single): `cd backend && go test ./path/to/package -run TestName`
- Database setup, if the database is running: `cd backend && DATABASE_URL='postgres://postgres:testing@localhost/mldegrees?sslmode=disable' ./setup-db.sh`

## Code Standards

- **Frontend**: Use TypeScript with strict mode enabled, functional React components, Tailwind CSS
- **Backend**: Follow Go standard library style, use error wrapping. Use GORM where practical for database access.
- **Naming**: camelCase (JS/TS), PascalCase (Go exports), snake_case (Go private)
- **Imports**: Group by standard lib, external, internal, relative
- **Error Handling**: Try/catch in frontend, explicit returns in Go
- **API Design**: RESTful endpoints, JSON responses with consistent structure
- **Git**: Feature branches, descriptive commit messages, PR for changes
- **Testing**: Unit tests only for now. We'll add integration tests and end-to-end tests later.
- **Logging**: Enable logging in both development and production, based on the configured log level in both frontend and backend.
- **Metrics**: Enable Prometheus metrics in both the frontend and backend.
- **Tracing**: Don't worry about this for now. We'll revisit it later.
