# ML Degrees Application Requirements

## Notes for Future Development

### Current Limitations

- No program categories or tags
- No detailed program information pages
- No user profiles or preferences
- No admin interface for data management
- No analytics or usage tracking

### Technical Debt

- Frontend TypeScript diagnostics need cleanup
- Error handling could be more robust
- API rate limiting not implemented
- Additional database indexes for performance could be optimized
- No caching layer implemented

### Architecture Decisions Made

- Monolithic frontend/backend separation
- PostgreSQL for primary data storage
- Google OAuth as only auth provider
- Simple voting system (no complex algorithms)
- Kubernetes-first deployment strategy

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
