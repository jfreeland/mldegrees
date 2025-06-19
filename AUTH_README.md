# ML Degrees - Authentication Setup

This application now includes Google OAuth authentication for voting on ML degree programs.

## Setup Instructions

### 1. Database Setup

First, ensure PostgreSQL is installed and running. Then:

```bash
# Set your database URL
export DATABASE_URL='postgres://user:password@localhost/mldegrees'

# Run the setup script
cd backend
./setup-db.sh
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy the Client ID and Client Secret

### 3. Frontend Environment Setup

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

### 4. Running the Application

Backend:

```bash
cd backend
export DATABASE_URL='postgres://user:password@localhost/mldegrees'
export PORT=8080
go run cmd/api/main.go
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Features Implemented

1. **Google Authentication**: Users sign in with Google to vote
2. **Vote Tracking**: Each user can vote once per program (+1 or -1)
3. **Privacy-First**: Minimal data collection (only email, name, Google ID)
4. **About Page**: Privacy policy explaining data usage
5. **Database Integration**: Programs and votes stored in PostgreSQL
6. **Real-time Updates**: Vote counts update immediately in UI

## API Endpoints

- `GET /api/programs` - Get all programs with ratings
- `POST /api/auth` - Authenticate user
- `POST /api/vote` - Vote on a program (requires auth)

## Security Notes

- User votes are private (only aggregates shown)
- Authentication required for voting
- CORS configured for frontend access
- No sensitive data stored beyond authentication needs
