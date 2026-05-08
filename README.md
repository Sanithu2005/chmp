# CHMP — Child Health Management Platform

A digital platform for managing child health records, vaccinations, growth charts, and appointments — digitising Sri Lanka's Child Health Development Record (CHDR).

## Features

- **Parent Portal** — Register children, track vaccinations, view growth charts, manage appointments
- **Medical Professional Portal** — Manage patients, appointments, prescriptions, growth records, and vaccination records
- **AI Patient Search** — Natural language search powered by Gemini AI
- **Growth Charts** — Visualise height, weight, and BMI with WHO standard references
- **Vaccination Tracking** — Schedule, track, and administer vaccines with due-date alerts
- **Appointment Management** — Book, confirm, and complete appointments with medical professionals
- **Dark Mode** — Full light/dark/system theme support

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) 16 (App Router) + [React](https://react.dev/) 19
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4 + CSS custom properties
- **UI Components:** [Radix UI](https://www.radix-ui.com/) primitives (shadcn/ui-style)
- **Database:** [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL
- **Auth:** [better-auth](https://www.better-auth.com/)
- **Charts:** [Recharts](https://recharts.org/)
- **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **AI:** [Google Gemini](https://ai.google.dev/)
- **File Storage:** AWS S3-compatible (MinIO)

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) (recommended) or npm
- PostgreSQL database
- (Optional) MinIO or S3-compatible object storage
- (Optional) Google Gemini API key

## Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd code
pnpm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Random secret for auth sessions |
| `BETTER_AUTH_URL` | Your app's base URL |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL |
| `S3_ENDPOINT` | S3/MinIO endpoint |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | S3 credentials |
| `S3_BUCKET` | Storage bucket name |
| `NEXT_PUBLIC_S3_URL` | Public S3 URL |
| `GEMINI_API_KEY` | Google Gemini API key |

### 3. Set Up the Database

```bash
# Push the schema to your database
pnpm db:push

# (Optional) Seed with sample data
pnpm db:seed
```

### 4. Run the Dev Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with Turbopack |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:push` | Push Drizzle schema to database |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:seed` | Seed database with sample data |
| `pnpm db:clear` | Clear seeded data |

## Project Structure

```
code/
├── src/
│   ├── app/                 # Next.js App Router pages & layouts
│   ├── components/          # React components
│   │   ├── layout/          # Header, footer, theme provider
│   │   ├── modals/          # Form modals (add/edit)
│   │   ├── parent/          # Parent dashboard
│   │   ├── medical-professional/  # Medical professional dashboard
│   │   ├── patient/         # Patient detail views
│   │   └── ui/              # Reusable UI components (shadcn/ui)
│   ├── db/                  # Drizzle schema & migrations
│   ├── lib/                 # Utilities, auth client, actions
│   └── hooks/               # Custom React hooks
├── public/                  # Static assets
├── drizzle.config.ts        # Drizzle ORM configuration
└── package.json
```

## License

[MIT](LICENSE)
