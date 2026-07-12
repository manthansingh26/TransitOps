"""Transactional business-rule logic — the mandatory rules from the spec.

These mirror the Postgres RPC functions from the original Supabase schema.
Each function performs all related status changes atomically within one
DB session/transaction so state stays consistent.
"""
from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import DriverStatus, MaintenanceStatus, TripStatus, VehicleStatus
from app.models.models import Driver, MaintenanceLog, Trip, TripEvent, Vehicle


def _bad(msg: str):
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)


def create_trip(db: Session, data, user_id: int) -> Trip:
    vehicle = db.get(Vehicle, data.vehicle_id)
    if vehicle is None:
        _bad("Vehicle not found")
    if vehicle.status != VehicleStatus.AVAILABLE:
        _bad(f"Vehicle is not available (status: {vehicle.status.value})")
    if data.cargo_weight_kg > vehicle.max_load_capacity_kg:
        _bad(
            f"Cargo weight {data.cargo_weight_kg} kg exceeds vehicle capacity "
            f"{vehicle.max_load_capacity_kg} kg"
        )

    driver = db.get(Driver, data.driver_id)
    if driver is None:
        _bad("Driver not found")
    if driver.status == DriverStatus.SUSPENDED:
        _bad("Driver is suspended")
    if driver.status != DriverStatus.AVAILABLE:
        _bad(f"Driver is not available (status: {driver.status.value})")
    if driver.license_expiry_date < date.today():
        _bad(f"Driver license expired on {driver.license_expiry_date}")

    trip = Trip(
        source=data.source,
        destination=data.destination,
        vehicle_id=data.vehicle_id,
        driver_id=data.driver_id,
        cargo_weight_kg=data.cargo_weight_kg,
        planned_distance_km=data.planned_distance_km,
        revenue=data.revenue,
        status=TripStatus.DRAFT,
        created_by=user_id,
    )
    db.add(trip)
    db.flush()
    db.add(TripEvent(trip_id=trip.id, event="created", actor_id=user_id))
    db.commit()
    db.refresh(trip)
    return trip


def dispatch_trip(db: Session, trip_id: int, user_id: int) -> Trip:
    trip = db.get(Trip, trip_id)
    if trip is None:
        _bad("Trip not found")
    if trip.status != TripStatus.DRAFT:
        _bad("Only draft trips can be dispatched")

    vehicle = db.get(Vehicle, trip.vehicle_id)
    driver = db.get(Driver, trip.driver_id)
    if vehicle.status != VehicleStatus.AVAILABLE:
        _bad("Vehicle no longer available")
    if driver.status != DriverStatus.AVAILABLE:
        _bad("Driver no longer available")
    if driver.license_expiry_date < date.today():
        _bad("Driver license expired")

    vehicle.status = VehicleStatus.ON_TRIP
    driver.status = DriverStatus.ON_TRIP
    trip.status = TripStatus.DISPATCHED
    trip.dispatched_at = datetime.now(timezone.utc)
    db.add(TripEvent(trip_id=trip.id, event="dispatched", actor_id=user_id))
    db.commit()
    db.refresh(trip)
    return trip


def complete_trip(db: Session, trip_id: int, data, user_id: int) -> Trip:
    trip = db.get(Trip, trip_id)
    if trip is None:
        _bad("Trip not found")
    if trip.status != TripStatus.DISPATCHED:
        _bad("Only dispatched trips can be completed")

    trip.status = TripStatus.COMPLETED
    trip.completed_at = datetime.now(timezone.utc)
    trip.actual_distance_km = data.actual_distance_km
    trip.fuel_consumed_liters = data.fuel_consumed_liters

    vehicle = db.get(Vehicle, trip.vehicle_id)
    driver = db.get(Driver, trip.driver_id)
    vehicle.status = VehicleStatus.AVAILABLE
    vehicle.odometer = max(vehicle.odometer, data.final_odometer)
    driver.status = DriverStatus.AVAILABLE

    db.add(
        TripEvent(
            trip_id=trip.id,
            event="completed",
            actor_id=user_id,
            note=f"distance={data.actual_distance_km} km, fuel={data.fuel_consumed_liters} L",
        )
    )
    db.commit()
    db.refresh(trip)
    return trip


def cancel_trip(db: Session, trip_id: int, user_id: int) -> Trip:
    trip = db.get(Trip, trip_id)
    if trip is None:
        _bad("Trip not found")
    if trip.status not in (TripStatus.DRAFT, TripStatus.DISPATCHED):
        _bad(f"Cannot cancel a {trip.status.value} trip")

    if trip.status == TripStatus.DISPATCHED:
        vehicle = db.get(Vehicle, trip.vehicle_id)
        driver = db.get(Driver, trip.driver_id)
        if vehicle.status == VehicleStatus.ON_TRIP:
            vehicle.status = VehicleStatus.AVAILABLE
        if driver.status == DriverStatus.ON_TRIP:
            driver.status = DriverStatus.AVAILABLE

    trip.status = TripStatus.CANCELLED
    trip.cancelled_at = datetime.now(timezone.utc)
    db.add(TripEvent(trip_id=trip.id, event="cancelled", actor_id=user_id))
    db.commit()
    db.refresh(trip)
    return trip


def open_maintenance(db: Session, data) -> MaintenanceLog:
    vehicle = db.get(Vehicle, data.vehicle_id)
    if vehicle is None:
        _bad("Vehicle not found")
    if vehicle.status == VehicleStatus.RETIRED:
        _bad("Vehicle is retired")
    if vehicle.status == VehicleStatus.ON_TRIP:
        _bad("Vehicle is currently on a trip")

    log = MaintenanceLog(
        vehicle_id=data.vehicle_id,
        description=data.description,
        cost=data.cost,
        status=MaintenanceStatus.ACTIVE,
    )
    db.add(log)
    vehicle.status = VehicleStatus.IN_SHOP
    db.commit()
    db.refresh(log)
    return log


def close_maintenance(db: Session, log_id: int) -> MaintenanceLog:
    log = db.get(MaintenanceLog, log_id)
    if log is None:
        _bad("Maintenance record not found")
    if log.status == MaintenanceStatus.CLOSED:
        return log

    log.status = MaintenanceStatus.CLOSED
    log.closed_at = datetime.now(timezone.utc)
    db.flush()  # ensure the closed status is visible to the count query below

    vehicle = db.get(Vehicle, log.vehicle_id)
    active_count = (
        db.query(MaintenanceLog)
        .filter(
            MaintenanceLog.vehicle_id == vehicle.id,
            MaintenanceLog.status == MaintenanceStatus.ACTIVE,
        )
        .count()
    )
    if active_count == 0 and vehicle.status == VehicleStatus.IN_SHOP:
        vehicle.status = VehicleStatus.AVAILABLE
    db.commit()
    db.refresh(log)
    return log
