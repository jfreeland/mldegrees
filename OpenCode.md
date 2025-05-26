# ML Degrees Project Guidelines

## Frontend Commands (Next.js)

- Dev: `cd frontend && npm run dev`
- Build: `cd frontend && npm run build`
- Lint: `cd frontend && npm run lint`
- Test: `cd frontend && npm test`
- Test (watch): `cd frontend && npm run test:watch`
- Test (single): `cd frontend && npm test -- -t "test name"`
- Typecheck: `cd frontend && npm run typecheck`

## Backend Commands (Go)

- Run: `cd backend && go run cmd/api/main.go`
- Build: `cd backend && go build -o bin/api cmd/api/main.go`
- Test: `cd backend && go test ./...`
- Test (single): `cd backend && go test ./path/to/package -run TestName`

## Code Style

- **Frontend**: Use TypeScript, functional React components, Tailwind CSS
- **Backend**: Follow Go standard library style, use error wrapping
- **Naming**: camelCase (JS/TS), PascalCase (Go exports), snake_case (Go private)
- **Imports**: Group by standard lib, external, internal, relative
- **Error Handling**: Try/catch in frontend, explicit returns in Go
- **API Design**: RESTful endpoints, JSON responses with consistent structure
- **Git**: Feature branches, descriptive commit messages, PR for changes
