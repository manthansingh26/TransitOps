<div align="center">

# 🚚 TransitOps

### Smart Transport Operations Platform

Digitize vehicle, driver, dispatch, maintenance, and expense management — with business rules enforced at the API layer and full operational visibility through dashboards and reports.

_Built for Odoo Hackathon 2026._

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TanStack](https://img.shields.io/badge/TanStack-Router-FF4154?logo=react-query&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)

</div>

---

## Overview

Many logistics teams still run on spreadsheets and manual logbooks, leading to scheduling conflicts, underused vehicles, missed maintenance, expired licenses, and poor cost visibility. TransitOps centralizes the entire transport lifecycle in one platform and enforces the rules that keep operations safe and consistent.

## Monorepo Structure

```
TransitOps/
├── backend/     # FastAPI + SQLAlchemy API on local PostgreSQL
├── frontend/    # React 19 + TanStack Router + Vite + Tailwind + shadcn/ui
└── README.md
```

Each part has its own README with setup instructions:

- **[backend/README.md](backend/README.md)** — API, database, and business rules
- **frontend/** — the web client

## Architecture

```
┌──────────────┐        HTTP / JWT        ┌──────────────┐        SQL        ┌───────────────┐
│   Frontend   │  ───────────────────▶    │   FastAPI    │  ──────────────▶  │  PostgreSQL   │
│  React/Vite  │  ◀───────────────────    │   Backend    │  ◀──────────────  │   (pgAdmin4)  │
└──────────────┘         JSON             └──────────────┘                   └───────────────┘
```

- **Frontend** — React 19, TanStack Router, Vite 8, Tailwind CSS 4, shadcn/ui, Recharts.
- **Backend** — FastAPI, SQLAlchemy, JWT auth, role-based access control, transactional business rules.
- **Database** — local PostgreSQL 18, managed with pgAdmin4.

## Roles (RBAC)

| Role              | Responsibilities                                             |
| ----------------- | ------------------------------------------------------------ |
| Fleet Manager     | Full access to vehicles, maintenance, and vehicle lifecycle. |
| Driver            | Creates trips and monitors assigned deliveries.              |
| Safety Officer    | Manages driver compliance, license validity, safety scores.  |
| Financial Analyst | Manages expenses, fuel logs, and reports.                    |

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env          # set your local Postgres password/port
python -m pip install -r requirements.txt
python seed.py                # create tables + demo data
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
bun install
bun run dev                   # http://localhost:8080
```

## Demo Accounts

Password for all: `Demo1234!`

| Role              | Email                     |
| ----------------- | ------------------------- |
| Fleet Manager     | manager@transitops.demo   |
| Driver            | driver@transitops.demo    |
| Safety Officer    | safety@transitops.demo    |
| Financial Analyst | finance@transitops.demo   |

## Business Rules (enforced server-side, transactionally)

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

## Roadmap

- [x] Local PostgreSQL schema + FastAPI backend (auth, RBAC, CRUD, business rules)
- [x] Demo data seeding
- [x] React frontend (dashboard, vehicles, drivers, trips, maintenance, fuel, expenses, reports)
- [ ] Wire the frontend data layer to the FastAPI backend
- [ ] Reports CSV export polish
- [ ] Optional: PDF export, license-expiry email reminders, dark mode

## License

Built for the Odoo Hackathon 2026.
