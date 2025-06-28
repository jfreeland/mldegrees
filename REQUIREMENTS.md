# ML Degrees Application Requirements

## Notes for Future Development

### Current Limitations

- No search or filtering functionality
- No program categories or tags
- No detailed program information pages
- No user profiles or preferences
- No admin interface for data management
- No analytics or usage tracking

### Technical Debt

- Frontend TypeScript diagnostics need cleanup
- Error handling could be more robust
- API rate limiting not implemented
- Database indexes for performance not optimized
- No caching layer implemented

### Architecture Decisions Made

- Monolithic frontend/backend separation
- PostgreSQL for primary data storage
- Google OAuth as only auth provider
- Simple voting system (no complex algorithms)
- Kubernetes-first deployment strategy

---

# Local Development

**Priority:** Critical
**Components:** Frontend, Backend, Database
**User Story:** As a developer, I need to be able to login as a 'user' and an 'admin' for local development.

## Description

Full-stack web application with Next.js frontend, Go backend API, PostgreSQL database, and Kubernetes deployment configuration.

## Technical Requirements

## Acceptance Criteria

- [] The "Sign In" button ONLY shows when you are doing 'local' development.
- [] The "Sign In with Google" button shows up when you are doing local development too, and it's the only button that shows up when in production.
- [] A "user" can login locally
- [] A "admin" can login locally

---

# Extended Program Information and Filtering and Sorting

**Priority:** High
**Components:** Frontend, Backend, Database
**User Story:** As a user, I want to collect additional information about programs.

## Description

There is additional information that needs to be tracked on a per-program basis. This includes but is not limited to:

- degree type (bachelors, masters, certificate)
- country (required)
- city (required)
- state (optional)
- status (active or inactive - default active)
- visibility (approved, pending, rejected - default pending)

The user should be able to filter and sort the programs by these additional fields.

## Technical Requirements

## Acceptance Criteria

- [] The database supports the additional metadata for each program.
- [] The frontend supports the additional metadata for each program.
- [] The user can filter and sort the programs by these additional fields in the frontend.
- [] The backend api only returns approved visibility and status active programs by default.

---

# Propose Program

**Priority:** High
**Components:** Frontend, Backend, Database
**User Story:** As a user, I want to be able to propose a new program.

## Description

There needs to be an admin dashboard that is only available to admin users. Admin users should be able to approve or reject pending programs.

Users should be able to propose a new program. The program should be saved to the database in a pending state until the administrator has approved it.

## Technical Requirements

## Acceptance Criteria

- [] There is a propose program page where users can propose a new program.
- [] There is an admin dashboard that is only accessible by admin users where admin users can approve or reject pending programs.
