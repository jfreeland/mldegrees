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

# Extended Program Information and Filtering and Sorting

**Completed:** December 28, 2024
**Priority:** High
**Components:** Frontend, Backend, Database
**User Story:** As a user, I want to collect additional information about programs and filter/sort them.

## Description

Added comprehensive metadata tracking for ML programs including degree type, location information, and program status. Implemented filtering and sorting functionality to help users find programs that match their criteria.

## Implementation Details

### Database Schema (Migration 004)

- Added new fields to the `programs` table:
  - `degree_type` (VARCHAR(50), default 'masters') - bachelors, masters, certificate
  - `country` (VARCHAR(100), default 'United States', required)
  - `city` (VARCHAR(100), required)
  - `state` (VARCHAR(100), optional)
  - `status` (VARCHAR(20), default 'active') - active, inactive
  - `visibility` (VARCHAR(20), default 'pending') - approved, pending, rejected
- Added indexes for efficient filtering on all new fields
- Updated the `program_ratings` view to include new metadata fields

### Backend Changes

- Updated `Program` model in `internal/models/models.go` to include new fields
- Added `ProgramFilters` struct for filtering options with support for:
  - Degree type filtering
  - Country, city, and state filtering
  - Sorting by rating, name, or creation date
  - Ascending/descending sort order
- Enhanced `GetProgramsWithFilters` function with dynamic SQL query building
- Updated API handler to parse query parameters for filtering
- **Default behavior:** Only returns programs with `status='active'` and `visibility='approved'`

### Frontend Changes

- Updated `University` interface in `types/university.ts` to include new metadata fields
- Added comprehensive filtering UI with:
  - Degree type dropdown (Bachelor's, Master's, Certificate)
  - Country, city, and state text inputs
  - Sort by options (Rating, Name, Date Added)
  - Sort order selection (Ascending/Descending)
  - Clear filters button to reset all filters
- Enhanced `UniversityCard` component to display:
  - Degree type badge (blue styling)
  - Location badge showing "City, State, Country" (green styling)
- Updated mock data to include realistic values for new fields
- Implemented real-time filtering with automatic API calls when filters change

### API Endpoints

- `GET /api/programs` - Returns all approved/active programs
- `GET /api/programs?degree_type=masters&country=United%20States&sort_by=rating&sort_order=desc` - Filtered results

### Technical Features

- **Performance:** Added database indexes for efficient filtering
- **Security:** Input validation and SQL injection prevention through parameterized queries
- **UX:** Real-time filtering without page refresh
- **Responsive:** Filter UI adapts to different screen sizes
- **Accessibility:** Proper labels and semantic HTML for form controls

### Files Modified

- `backend/migrations/004_add_program_metadata.sql` (new)
- `backend/internal/models/models.go`
- `backend/internal/db/db.go`
- `backend/internal/handlers/handlers.go`
- `frontend/src/types/university.ts`
- `frontend/src/app/page.tsx`
- `frontend/src/components/UniversityCard.tsx`
- `frontend/src/mocks/universities.ts`

## Acceptance Criteria Met

- [x] The database supports the additional metadata for each program
- [x] The frontend supports the additional metadata for each program
- [x] The user can filter and sort the programs by these additional fields in the frontend
- [x] The backend API only returns approved visibility and status active programs by default

---

# Propose Program

**Completed:** January 4, 2025
**Priority:** High
**Components:** Frontend, Backend, Database
**User Story:** As a user, I want to be able to propose a new program.

## Description

Implemented a complete program proposal system where authenticated users can submit new ML degree programs for review. Added an admin dashboard that allows administrators to approve or reject pending program proposals.

## Implementation Details

### Database Changes

- Leveraged existing `visibility` field in programs table with values: 'approved', 'pending', 'rejected'
- Programs default to `visibility='pending'` when proposed
- Only programs with `visibility='approved'` appear in public listings
- Added database functions for program proposal management

### Backend Changes

- **Models** (`backend/internal/models/models.go`):
  - Added `ProposeRequest` struct for program proposal data
  - Added `AdminProgramAction` struct for admin approval/rejection actions

- **Database Functions** (`backend/internal/db/db.go`):
  - `ProposeProgram()` - Creates new program proposals with pending status
  - `GetPendingPrograms()` - Retrieves all pending programs for admin review
  - `UpdateProgramVisibility()` - Updates program status (approve/reject)

- **Authentication** (`backend/internal/auth/auth.go`):
  - Added `RequireAdmin()` middleware for admin-only endpoints

- **API Handlers** (`backend/internal/handlers/handlers.go`):
  - `HandleProposeProgram()` - Accepts program proposals from authenticated users
  - `HandleAdminPrograms()` - Returns pending programs for admin review
  - `HandleAdminProgramAction()` - Handles program approval/rejection

- **API Routes** (`backend/cmd/api/main.go`):
  - `POST /api/programs/propose` - Submit program proposals (requires auth)
  - `GET /api/admin/programs` - Get pending programs (requires admin)
  - `POST /api/admin/programs/action` - Approve/reject programs (requires admin)

### Frontend Changes

- **Types** (`frontend/src/types/university.ts`):
  - Added `ProposeRequest` and `ProposeResponse` interfaces

- **Propose Program Page** (`frontend/src/app/propose/page.tsx`):
  - Complete form for submitting program proposals
  - Validation for required fields (university name, program name, description, city)
  - Default values for degree type (masters) and country (United States)
  - Success/error messaging with proper styling
  - Authentication checks and redirects

- **Admin Dashboard** (`frontend/src/app/admin/page.tsx`):
  - Lists all pending program proposals in card format
  - Approve/reject buttons for each program with loading states
  - Admin role verification and access control
  - Real-time updates after actions (programs removed from list)
  - Responsive design with proper error handling

- **Navigation** (`frontend/src/app/page.tsx`):
  - Added "Propose New Program" button for authenticated users
  - Added "Admin Dashboard" button for admin users
  - Proper role-based visibility using session data

- **Tests** (`frontend/src/app/__tests__/page.test.tsx`):
  - Updated tests to handle new router dependency
  - Added mocks for `useRouter` hook
  - All existing tests continue to pass

### Security Features

- **Authentication Required:** All proposal endpoints require user authentication
- **Admin Protection:** Admin endpoints require admin role verification
- **Input Validation:** Both frontend and backend validate required fields
- **Role-Based Access:** UI elements only show for appropriate user roles
- **CORS Protection:** Proper CORS headers for cross-origin requests

### User Experience

- **Intuitive Forms:** Clear labels, placeholders, and validation messages
- **Real-time Feedback:** Loading states and success/error messages
- **Responsive Design:** Works on desktop and mobile devices
- **Accessibility:** Proper semantic HTML and ARIA labels
- **Navigation:** Easy access from main page with role-based visibility

### Technical Features

- **Database Transactions:** Atomic operations for university/program creation
- **Auto-creation:** Universities are created automatically if they don't exist
- **Error Handling:** Comprehensive error handling with user-friendly messages
- **Type Safety:** Full TypeScript support with proper interfaces
- **Testing:** All existing tests pass with new functionality

### Files Created/Modified

**Backend:**

- `backend/internal/models/models.go` - Added new request/response types
- `backend/internal/db/db.go` - Added program proposal database functions
- `backend/internal/auth/auth.go` - Added admin middleware
- `backend/internal/handlers/handlers.go` - Added new API handlers
- `backend/cmd/api/main.go` - Added new API routes

**Frontend:**

- `frontend/src/types/university.ts` - Added new interfaces
- `frontend/src/app/propose/page.tsx` - New propose program page
- `frontend/src/app/admin/page.tsx` - New admin dashboard page
- `frontend/src/app/page.tsx` - Added navigation buttons
- `frontend/src/app/__tests__/page.test.tsx` - Updated tests

## Acceptance Criteria Met

- [x] There is a propose program page where users can propose a new program
- [x] There is an admin dashboard that is only accessible by admin users where admin users can approve or reject pending programs

## API Endpoints

- `POST /api/programs/propose` - Submit new program proposal (authenticated users)
- `GET /api/admin/programs` - Get pending programs (admin only)
- `POST /api/admin/programs/action` - Approve/reject programs (admin only)

## User Workflow

1. **Proposal Submission:**
   - Authenticated user clicks "Propose New Program" on home page
   - Fills out form with university name, program name, description, and location
   - Submits proposal which is saved with `visibility='pending'`
   - Receives confirmation message

2. **Admin Review:**
   - Admin user clicks "Admin Dashboard" on home page
   - Views list of all pending program proposals
   - Reviews program details and location information
   - Clicks "Approve" or "Reject" for each program
   - Program is updated to `visibility='approved'` or `visibility='rejected'`
   - Approved programs appear in public listings immediately

---
