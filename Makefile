# Docker registry
REGISTRY := docker.io/joeyfreeland
FRONTEND_IMAGE := $(REGISTRY)/mldfe:latest
BACKEND_IMAGE := $(REGISTRY)/mldbe:latest

.PHONY: build-frontend build-backend build-all push-frontend push-backend push-all docker-all dev-db-up dev-db-down test test-docker-builds test-docker-frontend test-docker-backend

# Build frontend image
build-frontend:
	docker buildx build --platform linux/amd64 -t $(FRONTEND_IMAGE) ./frontend

# Build backend image
build-backend:
	docker buildx build --platform linux/amd64 -t $(BACKEND_IMAGE) ./backend

# Build all images
build-all: build-frontend build-backend

# Push frontend image
push-frontend:
	docker push $(FRONTEND_IMAGE)

# Push backend image
push-backend:
	docker push $(BACKEND_IMAGE)

# Push all images
push-all: push-frontend push-backend

# Build and push frontend
docker-frontend: build-frontend push-frontend

# Build and push backend
docker-backend: build-backend push-backend

# Build and push all
docker-all: build-all push-all

# Development commands
dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && DATABASE_URL='postgres://postgres:testing@localhost/mldegrees?sslmode=disable' go run cmd/api/main.go

dev-db-up:
	@docker run -d --name mlddb -e POSTGRES_PASSWORD=testing -e POSTGRES_DB=mldegrees -p 5432:5432 postgres
	@echo "Waiting for database to start..."
	@sleep 5
	@echo "Database started. Setting up..."
	@(cd backend && DATABASE_URL='postgres://postgres:testing@localhost/mldegrees?sslmode=disable' ./setup-db.sh)

dev-db-down:
	@docker stop mlddb || true
	@docker rm mlddb || true

# Test commands
test-frontend:
	cd frontend && npm test

test-backend:
	cd backend && go test ./...

test: test-frontend test-backend

# Lint commands
lint-frontend:
	cd frontend && npm run lint

# Build commands
build-frontend-local:
	cd frontend && npm run build

build-backend-local:
	cd backend && go build -o bin/api cmd/api/main.go

# Docker build tests (for CI/pre-commit)
test-docker-frontend:
	@echo "Testing frontend Docker build..."
	@docker buildx build --platform linux/amd64 -t mldegrees-frontend-test ./frontend
	@echo "✓ Frontend Docker build successful"

test-docker-backend:
	@echo "Testing backend Docker build..."
	@docker buildx build --platform linux/amd64 -t mldegrees-backend-test ./backend
	@echo "✓ Backend Docker build successful"

test-docker-builds: test-docker-frontend test-docker-backend
	@echo "✓ All Docker builds successful"
