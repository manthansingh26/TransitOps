<div align="center">

# 🚚 TransitOps

### Smart Transport Operations Platform

Digitize vehicle, driver, dispatch, maintenance, and expense management, with business rules enforced at the database layer and full operational visibility through dashboards and reports.

_Built for Odoo Hackathon 2026._

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TanStack](https://img.shields.io/badge/TanStack_Start-1.x-FF4154?logo=react-query&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)

</div>

---

## Overview

Many logistics teams still run on spreadsheets and manual logbooks, leading to scheduling conflicts, underused vehicles, missed maintenance, expired licenses, and poor cost visibility. TransitOps centralizes the entire transport lifecycle in one platform and enforces the rules that keep operations safe and consistent.

## Features

- **Role-based access control** across four roles: Fleet Manager, Driver, Safety Officer, Financial Analyst.
- **Vehicle registry** with unique registration numbers, capacity, odometer, and lifecycle status.
- **Driver management** with license-validity tracking and safety scores.
- **Trip dispatch** with live eligibility validation and a full status timeline.
- **Maintenance workflow** that auto-syncs vehicle availability.
- **Fuel & expense tracking** with per-vehicle operational cost.
- **Dashboard & reports**: fleet utilization, fuel efficiency, operational cost, and vehicle ROI, with CSV export.

## Tech Stack

| Layer        | Technology                                                        |
| ------------ | ----------------------------------------------------------------- |
| Frontend     | React 19, TanStack Start / Router, Vite 8, TypeScript             |
| UI           | Tailwind CSS 4, shadcn/ui (Radix), Recharts, lucide-react         |
| Data & Forms | TanStack Query, react-hook-form, zod                              |
| Backend      | Supabase (Postgres, Auth, RLS, RPC functions)                     |
| Tooling      | Bun, ESLint, Prettier                                             |

Business logic lives in Postgres (RPC functions, triggers, row-level security) so the mandatory rules cannot be bypassed by the client.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) `>= 1.3`
- A [Supabase](https://supabase.com) project (or use the provided demo project)

### Installation

```bash
# Install dependencies
bun install

# Copy environment variables and fill in your Supabase values
cp .env.example .env

# Start the dev server
bun run dev
```

The app runs at **http://localhost:8080**.

### Available Scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `bun run dev`       | Start the development server         |
| `bun run build`     | Build for production                 |
| `bun run preview`   | Preview the production build         |
| `bun run lint`      | Run ESLint                           |
| `bun run format`    | Format the codebase with Prettier    |

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL="https://<your-project>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<your-anon-key>"
VITE_SUPABASE_PROJECT_ID="<your-project-id>"
```

> Only the public **anon / publishable** key belongs in `.env`. Never commit service-role keys.

## Demo Accounts

All demo users share the password `Demo1234!`:

| Role              | Email                       |
| ----------------- | --------------------------- |
| Fleet Manager     | `manager@transitops.demo`   |
| Driver            | `driver@transitops.demo`    |
| Safety Officer    | `safety@transitops.demo`    |
| Financial Analyst | `finance@transitops.demo`   |

## Project Structure

```
.
├── src/
│   ├── components/       # App shell, shared UI, shadcn/ui components
│   ├── hooks/            # Reusable React hooks
│   ├── integrations/     # Supabase client & auth
│   ├── lib/              # Server functions & domain helpers
│   ├── routes/           # TanStack Router routes (auth + _authenticated)
│   └── styles.css        # Tailwind entry
├── supabase/
│   ├── migrations/       # Database schema, RLS, RPC functions, seed data
│   └── config.toml
├── public/               # Static assets
└── vite.config.ts
```

## Business Rules  


The following are enforced transactionally in the database:

1. Vehicle registration numbers are unique.
2. Retired or in-shop vehicles never appear in dispatch selection.
3. Drivers with expired licenses or suspended status cannot be assigned to trips.
4. A vehicle or driver already on a trip cannot be double-booked.
5. Cargo weight cannot exceed the vehicle's maximum load capacity.
6. Dispatching a trip sets vehicle and driver to **On Trip**.
7. Completing a trip restores both to **Available** and records odometer + fuel used.
8. Cancelling a dispatched trip restores vehicle and driver to **Available**.
9. Opening an active maintenance record sets the vehicle to **In Shop**.
10. Closing maintenance restores the vehicle to **Available** (unless retired).

## License

Built for the Odoo Hackathon 2026. Distributed under the MIT License.
