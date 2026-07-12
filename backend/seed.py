"""Seed the local database with demo users and realistic sample data.

Run from the backend/ folder:  python seed.py
"""
from datetime import date, timedelta

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.enums import (
    AppRole,
    DriverStatus,
    ExpenseCategory,
    MaintenanceStatus,
    TripStatus,
    VehicleStatus,
    VehicleType,
)
from app.models.models import (
    Driver,
    Expense,
    FuelLog,
    MaintenanceLog,
    Trip,
    User,
    Vehicle,
)

Base.metadata.create_all(bind=engine)

DEMO_PASSWORD = "Demo1234!"
DEMO_USERS = [
    ("Morgan Manager", "manager@transitops.demo", AppRole.FLEET_MANAGER),
    ("Dylan Driver", "driver@transitops.demo", AppRole.DRIVER),
    ("Sam Safety", "safety@transitops.demo", AppRole.SAFETY_OFFICER),
    ("Fiona Finance", "finance@transitops.demo", AppRole.FINANCIAL_ANALYST),
]

TODAY = date.today()


def run():
    db = SessionLocal()
    try:
        # --- Users ---
        for name, email, role in DEMO_USERS:
            if not db.query(User).filter(User.email == email).first():
                db.add(
                    User(
                        full_name=name,
                        email=email,
                        password_hash=hash_password(DEMO_PASSWORD),
                        role=role,
                    )
                )
        db.commit()

        if db.query(Vehicle).count() == 0:
            regions = ["North", "South", "East", "West"]
            types = [VehicleType.TRUCK, VehicleType.VAN, VehicleType.BIKE, VehicleType.CAR]
            vehicles = []
            for i in range(12):
                status = VehicleStatus.AVAILABLE
                if i == 10:
                    status = VehicleStatus.RETIRED
                elif i == 11:
                    status = VehicleStatus.IN_SHOP
                v = Vehicle(
                    registration_number=f"VAN-{i + 1:02d}",
                    model=f"Model {chr(65 + i)}",
                    type=types[i % len(types)],
                    max_load_capacity_kg=500 + (i % 5) * 250,
                    odometer=10000 + i * 1500,
                    acquisition_cost=20000 + i * 3000,
                    status=status,
                    region=regions[i % len(regions)],
                    revenue=0,
                )
                vehicles.append(v)
                db.add(v)
            db.commit()

            # --- Drivers (one expired, one suspended) ---
            drivers = []
            for i in range(12):
                expiry = TODAY + timedelta(days=365)
                status = DriverStatus.AVAILABLE
                if i == 0:
                    expiry = TODAY - timedelta(days=10)  # expired license
                elif i == 1:
                    status = DriverStatus.SUSPENDED
                elif i == 2:
                    status = DriverStatus.OFF_DUTY
                d = Driver(
                    name=f"Driver {i + 1}",
                    license_number=f"LIC-{1000 + i}",
                    license_category="B",
                    license_expiry_date=expiry,
                    contact_number=f"+1-555-01{i:02d}",
                    safety_score=70 + (i % 30),
                    status=status,
                )
                drivers.append(d)
                db.add(d)
            db.commit()

            # --- Trips across all lifecycle states ---
            avail_v = [v for v in vehicles if v.status == VehicleStatus.AVAILABLE]
            avail_d = [d for d in drivers if d.status == DriverStatus.AVAILABLE]
            for i in range(10):
                v = avail_v[i % len(avail_v)]
                d = avail_d[i % len(avail_d)]
                status = [
                    TripStatus.COMPLETED,
                    TripStatus.COMPLETED,
                    TripStatus.DRAFT,
                    TripStatus.CANCELLED,
                ][i % 4]
                t = Trip(
                    source=f"City {i}",
                    destination=f"City {i + 5}",
                    vehicle_id=v.id,
                    driver_id=d.id,
                    cargo_weight_kg=min(300 + i * 20, v.max_load_capacity_kg),
                    planned_distance_km=100 + i * 25,
                    revenue=800 + i * 120,
                    status=status,
                )
                if status == TripStatus.COMPLETED:
                    t.actual_distance_km = t.planned_distance_km + 5
                    t.fuel_consumed_liters = t.planned_distance_km / 8
                db.add(t)
            db.commit()

            # --- Maintenance, fuel, expenses ---
            for i, v in enumerate(vehicles[:6]):
                db.add(
                    MaintenanceLog(
                        vehicle_id=v.id,
                        description=["Oil Change", "Brake Repair", "Tire Rotation"][i % 3],
                        cost=150 + i * 40,
                        status=MaintenanceStatus.CLOSED,
                        closed_at=None,
                    )
                )
                db.add(
                    FuelLog(
                        vehicle_id=v.id,
                        liters=40 + i * 5,
                        cost=(40 + i * 5) * 1.5,
                        date=TODAY - timedelta(days=i),
                        odometer_at_fill=v.odometer,
                    )
                )
                db.add(
                    Expense(
                        vehicle_id=v.id,
                        category=[ExpenseCategory.TOLL, ExpenseCategory.FINE][i % 2],
                        amount=50 + i * 10,
                        date=TODAY - timedelta(days=i),
                        description="Sample expense",
                    )
                )
            db.commit()

        print("Seed complete.")
        print(f"Demo login password: {DEMO_PASSWORD}")
        for name, email, role in DEMO_USERS:
            print(f"  {role.value:20s} {email}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
