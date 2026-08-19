# Synplix Teams

Internal business dashboard for Synplix Infotech Services.

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui (base-nova style)
- **Database:** PostgreSQL via Supabase
- **Icons:** Lucide React
- **Theme:** next-themes (light/dark/system)
- **Deployment:** Vercel

## Local Setup

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd synplix-teams

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Service role key (server-side only, never expose to browser) |

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy the Project URL and Anon Key
4. Add them to your `.env.local` file

## Development Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
```

## Project Architecture

```
src/
├── app/
│   ├── (auth)/           # Auth routes (Phase 2)
│   ├── (dashboard)/      # Dashboard routes
│   │   ├── layout.tsx    # Dashboard layout with sidebar
│   │   └── dashboard/
│   │       └── page.tsx  # Dashboard home page
│   ├── api/              # API routes
│   ├── error.tsx         # Global error boundary
│   ├── loading.tsx       # Global loading state
│   ├── not-found.tsx     # 404 page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Root page (redirects to /dashboard)
├── components/
│   ├── layout/           # Layout components (DashboardShell)
│   ├── navigation/       # Navigation components (Sidebar, Topbar)
│   ├── ui/               # shadcn/ui components
│   ├── empty-state.tsx   # Reusable empty state
│   ├── loading-state.tsx # Reusable loading state
│   ├── page-header.tsx   # Reusable page header
│   ├── section-card.tsx  # Reusable section card
│   ├── stat-card.tsx     # Reusable stat card
│   └── theme-provider.tsx # Theme provider wrapper
├── hooks/                # Custom React hooks
├── lib/
│   ├── constants/        # App constants and nav items
│   ├── supabase/         # Supabase client setup
│   │   ├── client.ts     # Browser client
│   │   ├── middleware.ts # Session refresh middleware
│   │   └── server.ts     # Server client
│   └── utils.ts          # Utility functions (cn)
├── services/             # Business logic services
└── types/                # TypeScript types
    └── database.ts       # Supabase database types
```

## Phase 1 Scope

This is **Phase 1 - Foundation Only**. Implemented:

- Next.js app with App Router
- TypeScript configuration
- Tailwind CSS with design tokens
- shadcn/ui component library
- Supabase client foundation
- Dashboard shell (sidebar + topbar)
- Responsive navigation
- Dashboard landing page with placeholder KPIs
- Error/loading/not-found pages
- Light/dark/system theme support
- Accessibility basics
- Security foundations

## Future Phases

- **Phase 2:** Authentication & RBAC
- **Phase 3:** CRM & Sales
- **Phase 4:** Projects & Tasks
- **Phase 5:** Finance & Analytics
- **Phase 6:** Documents & Team
- **Phase 7:** Automation & Integrations

## Vercel Deployment

This project is configured for Vercel deployment:

1. Push to GitHub/GitLab/Bitbucket
2. Import the repository in [Vercel](https://vercel.com/new)
3. Add environment variables in Vercel dashboard
4. Deploy

No special configuration required - the project uses Vercel-compatible patterns:
- No filesystem persistence
- No long-running server processes
- Serverless-compatible architecture
- Edge-compatible middleware

## License

Private - Synplix Infotech Services
