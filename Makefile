.PHONY: dev build test lint serve deploy

# Development
dev:
	cd frontend && npm run dev

# Build static site
build:
	cd frontend && npm run build

# Run tests
test:
	cd frontend && npm test

# Run linter
lint:
	cd frontend && npm run lint

# Type check
typecheck:
	cd frontend && npm run typecheck

# Serve built static site locally
serve:
	cd frontend && npx serve out

# Deploy to Cloudflare Pages
deploy: build
	cd frontend && wrangler pages deploy out --project-name=mldegrees

# Install dependencies
install:
	cd frontend && npm install

# Clean build artifacts
clean:
	rm -rf frontend/.next frontend/out
