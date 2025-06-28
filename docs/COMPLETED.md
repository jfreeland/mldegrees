# ML Degrees Application Requirements

This is a web application with a voting system for ML degree programs.
It is a Next.js frontend and a Go backend API with a postgres database.
It uses NextAuth for user authentication with Google OAuth.

I will not list out the requirements that have already been completed, and
instead will only maintain the outstanding requirements.

---

# Core Application Infrastructure

**Priority:** High
**Components:** Frontend, Backend, Database, Infrastructure
**User Story:** As a developer, I want a scalable web application infrastructure so that I can build and deploy ML degree comparison features.

## Description

Full-stack web application with Next.js frontend, Go backend API, PostgreSQL database, and Kubernetes deployment configuration.

## Technical Requirements

- Next.js 14+ frontend with TypeScript
- Go backend API with clean architecture
- PostgreSQL database with migrations
- Docker containerization
- Kubernetes deployment manifests
- Authentication via NextAuth with Google OAuth

## Acceptance Criteria

- [x] Frontend runs on localhost:3000
- [x] Backend API runs on localhost:8080
- [x] Database migrations create required tables
- [x] Docker builds work for both services
- [x] K8s manifests deploy successfully
- [x] Google OAuth authentication works

---

# University and Program Data Management

**Priority:** High
**Components:** Backend, Database
**User Story:** As a system administrator, I want to manage university and program data so that users can browse available ML degree programs.

## Description

Database schema and API endpoints for managing universities and their ML programs, including seeded data for major institutions.

## Technical Requirements

- Universities table with basic info
- Programs table linked to universities
- Seed data for 5+ major universities
- API endpoint: `GET /api/programs`
- Program descriptions and metadata

## Acceptance Criteria

- [x] Database stores universities and programs
- [x] Seed data includes Stanford, MIT, CMU, Berkeley, Toronto
- [x] API returns programs with university names
- [x] Programs include detailed descriptions
- [x] Data model supports future expansion

---

# User Authentication System

**Priority:** High
**Components:** Frontend, Backend, Database
**User Story:** As a user, I want to sign in with Google so that I can vote on programs and have my preferences saved.

## Description

Complete authentication system using Google OAuth, with user management and session handling.

## Technical Requirements

- NextAuth.js integration with Google provider
- User table in database
- JWT token handling
- Protected API endpoints
- User session management in frontend

## Acceptance Criteria

- [x] Users can sign in with Google
- [x] User data stored in database
- [x] Sessions persist across page refreshes
- [x] API endpoints validate authentication
- [x] Sign out functionality works

---

# Program Voting System

**Priority:** High
**Components:** Frontend, Backend, Database
**User Story:** As a prospective student, I want to vote on ML programs so that I can help others understand program quality and see community ratings.

## Description

Voting system where authenticated users can upvote/downvote programs, with real-time rating calculations and optimistic UI updates.

## Technical Requirements

- Vote table linking users to programs
- API endpoint: `POST /api/vote`
- Real-time rating calculations
- Optimistic UI updates
- Vote change/removal functionality

## Acceptance Criteria

- [x] Authenticated users can vote (+1/-1)
- [x] Users can change or remove votes
- [x] Ratings update in real-time
- [x] UI shows current user's vote state
- [x] Vote counts aggregate correctly
- [x] Optimistic updates with error rollback

---

# Program Display and Browsing

**Priority:** High
**Components:** Frontend
**User Story:** As a prospective student, I want to browse ML programs in an organized way so that I can compare options and make informed decisions.

## Description

Clean, responsive interface for displaying ML programs with ratings, descriptions, and voting controls.

## Technical Requirements

- UniversityCard component for program display
- Responsive grid layout
- Dark/light mode support
- Loading and error states
- Vote buttons with visual feedback

## Acceptance Criteria

- [x] Programs display in card format
- [x] Shows university name, program name, description
- [x] Displays current rating and user's vote
- [x] Responsive design works on mobile
- [x] Loading states during data fetch
- [x] Error handling for failed requests

---

# Development and Deployment Infrastructure

**Priority:** Medium
**Components:** Infrastructure
**User Story:** As a developer, I want proper development tooling and deployment processes so that I can efficiently build and deploy the application.

## Description

Complete development environment setup with testing, linting, building, and deployment configurations.

## Technical Requirements

- Frontend: npm scripts for dev, build, test, lint
- Backend: Go build and test commands
- Database setup scripts
- Docker multi-stage builds
- Kubernetes HPA and ingress
- Development documentation

## Acceptance Criteria

- [x] Local development environment documented
- [x] Test suites configured (Jest for frontend)
- [x] Linting and type checking setup
- [x] Build processes work reliably
- [x] Database setup automated
- [x] K8s includes autoscaling and ingress

---

# Local Development

**Priority:** Critical
**Components:** Frontend, Backend, Database
**User Story:** As a developer, I need to be able to login as a 'user' and an 'admin' for local development.

## Description

Full-stack web application with Next.js frontend, Go backend API, PostgreSQL database, and Kubernetes deployment configuration.

## Technical Requirements

## Acceptance Criteria

- [x] The "Sign In" button ONLY shows when you are doing 'local' development.
- [x] The "Sign In with Google" button shows up when you are doing local development too, and it's the only button that shows up when in production.
- [x] A "user" can login locally
- [x] A "admin" can login locally

---
