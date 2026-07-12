# TransitOps Backend (FastAPI + local PostgreSQL)

FastAPI backend for TransitOps, connected to a **local PostgreSQL** database
(manageable via pgAdmin4). Provides JWT auth, RBAC, CRUD, and the transactional
business rules from the spec.

## Prerequisites

- Python 3.11+
- A local PostgreSQL server with a database named `transitops`

## Setup

```bash
cd backend

# 1. Configure the database connection
cp .env.example .env      # then edit DATABASE_URL with your Postgres password/port

# 2. Install dependencies
python -m pip install -r requirements.txt

# 3. Seed demo users + sample data (also creates tables)
python seed.py

# 4. Run the API
python -m uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Connection

The database connection is set in `.env`:

```
DATABASE_URL=postgresql+psycopg2://postgres:<password>@localhost:5433/transitops
```

> Note: this PostgreSQL 18 instance listens on port **5433**.

## Demo Accounts

Password for all: `Demo1234!`

| Role              | Email                     |
| ----------------- | ------------------------- |
| Fleet Manager     | manager@transitops.demo   |
| Driver            | driver@transitops.demo    |
| Safety Officer    | safety@transitops.demo    |
| Financial Analyst | finance@transitops.demo   |

## Structure

```
backend/
├── app/
│   ├── main.py            # FastAPI app + router registration
│   ├── core/              # config, database, security (JWT + bcrypt)
│   ├── models/            # SQLAlchemy models + enums
│   ├── schemas/           # Pydantic request/response schemas
│   ├── api/
│   │   ├── deps.py        # get_current_user + require_roles (RBAC)
│   │   └── v1/            # auth, vehicles, drivers, trips, maintenance,
│   │                      # finance, reports, users routers
│   └── services/          # transactional business-rule logic
├── seed.py                # demo data seeder
└── requirements.txt
```

## Business rules (enforced server-side, transactionally)

Located in `app/services/business.py` — trip create/dispatch/complete/cancel and
maintenance open/close, with capacity checks, license validity, double-booking
prevention, and automatic vehicle/driver status transitions.
```
