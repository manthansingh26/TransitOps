
# TransitOps — Build Plan

A fleet operations platform with strict server-enforced business rules, RBAC across 4 roles, and full lifecycle management of vehicles, drivers, trips, maintenance, fuel, and expenses.

## Stack

- Frontend: React + TanStack Router (existing), TailwindCSS, shadcn/ui, TanStack Query, Recharts, react-hook-form + zod.
- Backend: Lovable Cloud (Supabase Postgres + Auth). All business logic in Postgres (RPC functions + triggers + RLS) so rules cannot be bypassed by the client.
- Auth: Supabase email/password. Roles stored in a separate `user_roles` table (per security rules).

## Data Model (Postgres)

Tables in `public`:
- `profiles` (id → auth.users, full_name, created_at)
- `user_roles` (user_id, role) — enum `app_role`: `fleet_manager | driver | safety_officer | financial_analyst`
- `vehicles` (id, registration_number UNIQUE, model, type, max_load_capacity_kg, odometer, acquisition_cost, status, region, created_at) — enum `vehicle_status`: `available | on_trip | in_shop | retired`; enum `vehicle_type`: `truck | van | bike | car`
- `drivers` (id, name, license_number, license_category, license_expiry_date, contact_number, safety_score, status, user_id nullable) — enum `driver_status`: `available | on_trip | off_duty | suspended`
- `trips` (id, source, destination, vehicle_id FK, driver_id FK, cargo_weight_kg, planned_distance_km, actual_distance_km, fuel_consumed_liters, revenue, status, created_by, timestamps for dispatched/completed/cancelled) — enum `trip_status`: `draft | dispatched | completed | cancelled`
- `trip_events` (id, trip_id, event, note, actor_id, created_at) — timeline log
- `maintenance_logs` (id, vehicle_id, description, cost, status, opened_at, closed_at) — enum `maintenance_status`: `active | closed`
- `fuel_logs` (id, vehicle_id, liters, cost, date, odometer_at_fill)
- `expenses` (id, vehicle_id nullable, category, amount, date, description) — enum `expense_category`: `toll | fine | insurance | other`

Indexes on all FKs, `vehicles.status`, `drivers.status`, `trips.status`, date columns.

## Security (RLS + RBAC)

- `has_role(uuid, app_role)` SECURITY DEFINER function.
- Per-role SELECT/INSERT/UPDATE policies matching Section 2 permissions.
- `user_roles`: user reads own; only fleet_manager can INSERT/UPDATE.
- All GRANTs to `authenticated` + `service_role`; no anon.
- Trigger auto-creates `profiles` row + default `driver` role on `auth.users` insert (fleet_manager can promote).

## Business Rules — Postgres functions (transactional)

RPC functions (called via `createServerFn` wrappers with `requireSupabaseAuth`):

- `create_trip(...)` — validates: vehicle status = available, driver status = available, license not expired, driver not suspended, cargo_weight_kg ≤ vehicle.max_load_capacity_kg. Insert as `draft`.
- `dispatch_trip(trip_id)` — re-validates eligibility, sets trip → dispatched, vehicle → on_trip, driver → on_trip, logs `trip_events`. All in one transaction.
- `complete_trip(trip_id, actual_distance_km, fuel_consumed_liters, actual_odometer)` — sets trip → completed, updates vehicle odometer, resets vehicle/driver → available.
- `cancel_trip(trip_id)` — if dispatched, restore vehicle/driver → available.
- `open_maintenance(vehicle_id, description, cost)` — insert active record, vehicle → in_shop (unless retired; block).
- `close_maintenance(id)` — set closed, vehicle → available unless retired.
- Vehicle UPDATE trigger blocks manual status change to `available` when there is an active maintenance log or an in-flight dispatched trip.

Registration uniqueness enforced by UNIQUE constraint with a friendly error message translated in the UI.

## Server layer (TanStack Start)

`src/lib/*.functions.ts` — thin `createServerFn` wrappers with `.middleware([requireSupabaseAuth])` calling the RPCs / performing role-gated selects. Public route loaders are not used for this app (everything is behind `_authenticated`).

## Routes

Under `src/routes/_authenticated/` (managed layout):
- `index.tsx` → `/` Dashboard (redirect to role-appropriate landing)
- `vehicles.tsx` + `.index / .$id / .new / .$id.edit`
- `drivers.tsx` + same pattern
- `trips.tsx` + `.index / .new / .$id` (with Dispatch/Complete/Cancel actions)
- `maintenance.index.tsx`, `maintenance.new.tsx`
- `fuel.index.tsx`, `fuel.new.tsx`
- `expenses.index.tsx`, `expenses.new.tsx`
- `reports.tsx` — Fuel Efficiency, Utilization, Op Cost, ROI, CSV export
- `settings.users.tsx` — fleet_manager only

Public:
- `/auth` — sign in / sign up (with demo credential hints)

Shared: `AppShell` with left nav, top bar showing role; nav items filtered by role.

## Frontend features

- TanStack Query for all reads; mutations invalidate related keys.
- react-hook-form + zod for every form; inline validation mirrors server rules for UX (server is source of truth).
- shadcn Table + column filters, search, sort, badge (color-coded statuses).
- License expiry chip: red if expired, amber if ≤ 30 days.
- Recharts: dashboard fleet-status donut + trips/week bar; reports line + bar charts.
- CSV export helper (client-side blob) on all report tables.
- Responsive shell (collapsible sidebar for mobile).

## Dashboard KPIs

Server function returns aggregated counts + fleet_utilization % (on_trip / non-retired). Filters (type/status/region) passed as params to the same function.

## Reports

- Fuel Efficiency = sum(actual_distance_km) / sum(fuel_consumed_liters) per vehicle + fleet.
- Fleet Utilization = on_trip / (total - retired).
- Operational Cost = fuel + maintenance + expenses (all three; documented in UI tooltip).
- Vehicle ROI = (sum(trip.revenue) − (fuel + maintenance)) / acquisition_cost. Revenue is a manually entered per-trip field labeled "Revenue (manually entered)".
- Date-range filter; CSV export.

## Assumptions (documented in UI)

- Revenue: per-trip manual field.
- Operational Cost includes Fuel + Maintenance + Expenses.
- Drivers can create Draft trips; only fleet_manager can Dispatch/Complete/Cancel.

## Seed data (migration)

- 4 demo users (one per role) with password `Demo1234!`, shown on the login screen:
  - `manager@transitops.demo`, `driver@transitops.demo`, `safety@transitops.demo`, `finance@transitops.demo`
- 12 vehicles across all statuses/types/regions.
- 12 drivers (1 expired license, 1 suspended, rest valid).
- ~18 trips across draft/dispatched/completed/cancelled with revenue.
- Matching maintenance, fuel, and expense records so reports render immediately.

Seeded via SQL migration using Supabase Auth Admin API is not available in migrations; instead: seed via a one-time bootstrap server function invoked on first run, OR create the auth users through the Auth admin path in a `.server.ts` seeding function guarded by a `seed_done` flag row. (I'll use the latter to keep it reproducible.)

## Build order

1. Enable Lovable Cloud.
2. Migration: enums, tables, GRANTs, RLS, `has_role`, RPC functions, triggers, indexes.
3. Auth pages + role bootstrap trigger + demo seed.
4. AppShell + protected layout + role-based nav.
5. Vehicles module (list/create/edit/detail).
6. Drivers module.
7. Trips module + all validations + lifecycle actions + timeline.
8. Maintenance + auto vehicle-status sync.
9. Fuel + Expenses.
10. Dashboard KPIs + charts.
11. Reports + CSV export.
12. Polish: responsive, empty states, toasts for every mutation.

## Out of scope for v1

Document uploads, email reminders, dark mode, PDF export (spec labels these as bonus).

## Technical notes

- All privileged writes go through RPCs; server functions just call `context.supabase.rpc(...)`. This keeps business logic atomic and auditable, and RLS still applies.
- No Edge Functions used — everything is `createServerFn`.
- Vehicle/driver dropdowns for trip creation are populated by a server function that filters eligible rows server-side (available status, non-expired license, non-suspended).
