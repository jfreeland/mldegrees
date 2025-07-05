# Database Migration Structure

This document describes the organized migration structure for the ML Degrees database.

## Migration Flow Overview

The migrations are designed to be run in sequence and provide a clean, logical setup flow:

### 1. `001_create_migrations_table.sql`

**Purpose**: Migration tracking system

- Creates the `migrations` table to track applied migrations
- Includes checksum support for integrity verification
- Must be the first migration to enable tracking
- Self-registers in the migrations table

### 2. `002_create_core_tables.sql`

**Purpose**: Core application tables

- **users**: User accounts with OAuth support (Google & GitHub)
- **universities**: University information
- **programs**: ML/AI degree programs with full metadata
- **votes**: User voting system for programs
- Includes all necessary constraints and foreign keys

### 3. `003_create_indexes.sql`

**Purpose**: Performance optimization

- Indexes for user lookups (OAuth IDs, email, role)
- Program filtering indexes (degree type, location, status)
- Vote aggregation indexes
- Composite indexes for common query patterns

### 4. `004_create_views.sql`

**Purpose**: Database views for complex queries

- **program_ratings**: Programs with calculated ratings and vote statistics
- **user_stats**: User voting statistics
- Simplifies application code and ensures consistent data access

### 5. `005_seed_universities.sql`

**Purpose**: Initial university data

- Seeds 10 top universities known for ML/AI programs
- Includes Stanford, MIT, CMU, Berkeley, Toronto, etc.
- Uses `ON CONFLICT DO NOTHING` for safe re-running

### 6. `006_seed_programs.sql`

**Purpose**: Initial program data

- High-quality ML/AI programs from seeded universities
- Includes real URLs, detailed descriptions, and proper metadata
- Programs are pre-approved for immediate visibility

### 7. `007_create_admin_user.sql`

**Purpose**: Development admin user

- Creates admin user for testing admin functionality
- Email: `admin@mldegrees.dev`
- Uses local OAuth ID for development

## Key Features

### Migration Tracking

- Automatic detection of pending migrations
- Checksum verification for integrity
- Transaction safety for each migration
- Prevents duplicate execution

### Database Schema

- **OAuth Support**: Google and GitHub authentication
- **Role-based Access**: User and admin roles
- **Program Management**: Full metadata with approval workflow
- **Voting System**: Upvote/downvote with aggregated ratings
- **Performance**: Comprehensive indexing strategy

### Data Quality

- Proper constraints and foreign keys
- Check constraints for data validation
- Unique constraints where appropriate
- Default values for required fields

## Usage

### Fresh Database Setup

```bash
# Drop all tables and start fresh
./setup-db.sh
```

### Running Migrations

Migrations run automatically when the backend starts:

```bash
go run cmd/api/main.go
```

### Adding New Migrations

1. Create new `.sql` file with next sequential number
2. Follow naming convention: `XXX_descriptive_name.sql`
3. Include descriptive comments
4. Test thoroughly before deployment

## Migration Safety

- Each migration runs in a transaction
- Failed migrations roll back automatically
- Migrations are idempotent where possible
- Checksum verification prevents corruption
- Clear error messages for debugging

## Development Workflow

1. **Local Development**: Use `setup-db.sh` for fresh setup
2. **Adding Features**: Create new migration files
3. **Testing**: Migrations run automatically on backend start
4. **Production**: Same migration system ensures consistency

This structure provides a clean, maintainable, and safe way to manage database schema changes throughout the application lifecycle.
