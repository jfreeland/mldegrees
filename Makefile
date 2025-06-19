# Docker registry
REGISTRY := docker.io/joeyfreeland
FRONTEND_IMAGE := $(REGISTRY)/mldfe:latest
BACKEND_IMAGE := $(REGISTRY)/mldbe:latest

.PHONY: build-frontend build-backend build-all push-frontend push-backend push-all docker-all

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

# Test commands
test-frontend:
	cd frontend && npm test

test-backend:
	cd backend && go test ./...

# Lint commands
lint-frontend:
	cd frontend && npm run lint

# Build commands
build-frontend-local:
	cd frontend && npm run build

build-backend-local:
	cd backend && go build -o bin/api cmd/api/main.go
