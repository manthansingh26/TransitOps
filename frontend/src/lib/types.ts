/**
 * Shared domain types mirroring the FastAPI backend models/enums.
 * Keep these in sync with backend/app/models/enums.py.
 */

export type RoleName =
  | "fleet_manager"
  | "driver"
  | "safety_officer"
  | "financial_analyst";

export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export type DriverStatus = "Available" | "On Trip" | "Off Duty" | "Suspended";
export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";
export type MaintenanceStatus = "Active" | "Closed";
export type VehicleType = "Truck" | "Van" | "Bike" | "Car" | "Bus";

export interface User {
  id: number;
  name: string;
  email: string;
  role: RoleName;
  is_active: boolean;
  created_at: string;
}

export interface Vehicle {
  id: number;
  registration_number: string;
  name: string;
  type: VehicleType;
  max_load_capacity_kg: number;
  odometer: number;
  acquisition_cost: number;
  region?: string | null;
  revenue: number;
  status: VehicleStatus;
  created_at: string;
}

export interface Driver {
  id: number;
  name: string;
  license_number: string;
  license_category?: string | null;
  license_expiry_date: string;
  contact_number?: string | null;
  safety_score: number;
  status: DriverStatus;
  license_is_valid: boolean;
  created_at: string;
}

export interface Trip {
  id: number;
  source: string;
  destination: string;
  vehicle_id: number;
  driver_id: number;
  cargo_weight_kg: number;
  planned_distance_km: number;
  actual_distance_km?: number | null;
  fuel_consumed_liters?: number | null;
  revenue: number;
  status: TripStatus;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
