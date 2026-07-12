# TransitOps - Fleet & Logistics Management System

TransitOps is a modern, high-performance fleet and logistics management system designed to track vehicles, drivers, trips, maintenance, and operational expenses in real-time. It features a robust Python/FastAPI backend with a PostgreSQL database managed via SQLAlchemy and Alembic, alongside a frontend layout ready for implementation.

---

## 🚀 Key Features

- **Fleet Tracking**: Soft-deleted vehicles with status enums (`Available`, `On Trip`, `In Shop`, `Retired`) and custom types.
- **Driver Management**: Driver availability status tracking (`Available`, `On Trip`, `Off Duty`, `Suspended`), contact detail records, and license details.
- **Trip Tracking**: Full dispatch workflow including `Draft`, `Dispatched`, `Completed`, and `Cancelled` states, calculating distances, tracking drivers, and maintaining timestamps.
- **Operations & Costs**: Tracking of:
  - **Maintenance logs** (`Active`, `Closed`)
  - **Fuel logs** (gallons/liters consumed, cost per unit, odometer)
  - **Operational Expenses** (Tolls, Fines, Insurance, Parking, and Miscellaneous)
- **Role-Based Access Control (RBAC)**: Fine-grained user access roles, including `fleet_manager`, `driver`, `safety_officer`, and `financial_analyst`.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous, Type-safe API build)
- **ORM & Database**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) & [PostgreSQL](https://www.postgresql.org/)
- **Migrations**: [Alembic](https://alembic.sqlalchemy.org/)
- **Validation**: [Pydantic v2](https://docs.pydantic.dev/) & [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- **Security**: [python-jose](https://github.com/mpdavis/python-jose) (JWT) & [passlib](https://passlib.readthedocs.io/) (bcrypt)

### Frontend
- **Framework**: Ready for modern Web App framework (e.g., React / Next.js / Vite) inside the `/frontend` directory.

---

## 📂 Project Structure

```text
TransitOps/
├── backend/
│   ├── app/
│   │   ├── core/           # Configuration, security, database sessions
│   │   ├── models/         # SQLAlchemy DB schemas and enums
│   │   ├── main.py         # FastAPI application entrypoint
│   │   └── __init__.py
│   └── requirements.txt    # Python dependencies
├── docs/                   # Documentation assets and specs
├── frontend/               # Frontend application workspace
└── screenshots/            # App previews and design visual assets
```

---

## 💾 Database Schema

The database model relationships are designed for high integrity and traceability:

- **User**: System accounts with unique email and RBAC role.
- **Vehicle**: Fleet assets containing license plate, status, VIN, and specs.
- **Driver**: Profiles referencing system Users, containing license details and telemetry.
- **Trip**: Records of dispatches, linking a Vehicle and Driver with mileage and statuses.
- **MaintenanceLog**: Service requests and workshop bookings linked to a Vehicle.
- **FuelLog**: Refueling records linked to a Vehicle to track consumption efficiency.
- **Expense**: Generic operational expenses categorized by type (Tolls, Fines, etc.) linked to a Vehicle.

---

## 🏁 Getting Started

### Prerequisites
- Python 3.10+
- PostgreSQL Server

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment & install dependencies**:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate

   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   PROJECT_NAME=TransitOps
   DEBUG=True
   DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/transitops
   SECRET_KEY=supersecretkeyhere
   ```

4. **Run the API Server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser to view the interactive Swagger API documentation.
