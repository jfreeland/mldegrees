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
- status (whether the program is active or inactive - default active)
- visibility (approved, pending, rejected - default pending)

The user should be able to filter and sort the programs by these additional
fields in the frontend. For now we should only return approved visibility and
status active programs by default, and we should return all programs in the
database.

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
