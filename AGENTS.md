# ML Degrees Project

## Project Structure

- `frontend/` - Next.js static site
- `supabase/` - Database configuration
- `Makefile` - Common tasks

## Tools Required

- **Node.js 20+** - Frontend runtime
- **Supabase CLI** - Database management (`supabase`)
- **Wrangler CLI** - Cloudflare Pages deployment (`wrangler`)

Both CLIs should be authenticated:

- `supabase login`
- `wrangler login`

## Commands

### Development

```bash
make dev          # Start dev server at http://localhost:3000
make test         # Run tests
make lint         # Run linter
make typecheck    # TypeScript check
```

### Deployment

```bash
make build        # Build static site to frontend/out/
make deploy       # Build and deploy to Cloudflare Pages
```

### Database

```bash
supabase link --project-ref erwcyrrgynkoukkxaqtr  # Link to project
supabase db push                                   # Push migrations
```

## Frontend Commands (Next.js)

- Dev: `cd frontend && npm run dev`
- Build: `cd frontend && npm run build`
- Lint: `cd frontend && npm run lint`
- Test: `cd frontend && npm test`
- Test (watch): `cd frontend && npm run test:watch`
- Test (single): `cd frontend && npm test -- -t "test name"`
- Typecheck: `cd frontend && npm run typecheck`

## Database Schema

- `universities` - id, name
- `programs` - id, university_id (FK), name, description, degree_type, country, city, state, url, cost, status, visibility

Programs with `status='active'` appear on the site.

## Code Standards

- **Frontend**: TypeScript strict mode, functional React components, Tailwind CSS
- **Naming**: camelCase (JS/TS)
- **Imports**: Group by standard lib, external, internal, relative
- **Error Handling**: Try/catch, graceful fallbacks
- **Testing**: Unit tests with Jest and React Testing Library
- **Git**: Feature branches, descriptive commit messages

## Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://erwcyrrgynkoukkxaqtr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-0235813604527888
```

## Temporary Files

Write temporary files (SQL scripts, scratch data, etc.) to the `tmp/` directory in the project root. It is gitignored. **Do not use `/tmp`** — it requires elevated permissions and files there are not visible to other agents or the user.

## Tracked Sources

`docs/program-sources.txt` tracks all sources already used to find programs. Check it before scraping to avoid duplicate work. Update it after adding new programs.

## Workflow

1. Make changes
2. Run `make test && make lint` to verify
3. Run `make deploy` to deploy to Cloudflare Pages
4. Commit changes to git
