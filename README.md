# Machine Learning Degrees Website

A static website for [mldegrees.com](https://mldegrees.com) and
[machinelearningdegrees.com](https://machinelearningdegrees.com) that helps
people discover machine learning degree programs worldwide.

## Architecture

- **Frontend**: Next.js static site deployed to Cloudflare Pages
- **Database**: Supabase (PostgreSQL) for program data
- **Ads**: Google AdSense integration

The site is statically generated at build time, fetching program data from
Supabase and generating HTML files served via Cloudflare's global CDN.

## Project Structure

```text
├── frontend/           # Next.js static site
│   ├── src/
│   │   ├── app/        # App router pages
│   │   ├── components/ # React components
│   │   ├── lib/        # Supabase client
│   │   └── types/      # TypeScript types
│   └── public/         # Static assets (ads.txt, sitemap.xml, etc.)
├── supabase/           # Database configuration
└── .github/workflows/  # CI (tests only)
```

## Prerequisites

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli) - for database management
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) - for
  deployment

## Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX  # Optional
```

### 3. Development

```bash
make dev
# or: cd frontend && npm run dev
```

The site will be available at <http://localhost:3000>.

## Deployment

Deploy to Cloudflare Pages using Wrangler:

```bash
make deploy
# or: cd frontend && npm run build && wrangler pages deploy out --project-name=mldegrees
```

### First-Time Setup

1. Authenticate Wrangler: `wrangler login`
2. Create the project:
   `wrangler pages project create mldegrees --production-branch main`
3. Deploy: `make deploy`
4. Add custom domains in Cloudflare Dashboard → Pages → mldegrees → Custom
   domains

## Database Management

Use Supabase CLI to manage the database:

```bash
# Link to your project
supabase link --project-ref your-project-ref

# View database schema
supabase db dump --schema public

# Run migrations
supabase db push
```

### Database Schema

- `universities` - University names (id, name)
- `programs` - Degree programs (id, university_id, name, description,
  degree_type, country, city, state, url, cost, status, visibility)

## Available Commands

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `make dev`       | Start development server             |
| `make build`     | Build static site to `frontend/out/` |
| `make test`      | Run tests                            |
| `make lint`      | Run linter                           |
| `make typecheck` | Run TypeScript type checking         |
| `make deploy`    | Build and deploy to Cloudflare Pages |
| `make serve`     | Serve built site locally             |
| `make clean`     | Remove build artifacts               |

## AdSense Setup

1. Sign up for [Google AdSense](https://www.google.com/adsense/)
2. Add your publisher ID to `NEXT_PUBLIC_ADSENSE_CLIENT_ID` env var
3. Verify `frontend/public/ads.txt` contains your publisher ID
4. Configure ad slots in the AdSense dashboard

## Adding Programs

Programs are stored in Supabase. To add new programs:

1. Go to [Supabase Dashboard](https://app.supabase.com/) → your project → Table
   Editor
2. Add university to `universities` table (if new)
3. Add program to `programs` table with `status: 'active'`
4. Rebuild and deploy: `make deploy`
