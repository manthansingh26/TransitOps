
-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('fleet_manager','driver','safety_officer','financial_analyst');
CREATE TYPE public.vehicle_status AS ENUM ('available','on_trip','in_shop','retired');
CREATE TYPE public.vehicle_type AS ENUM ('truck','van','bike','car');
CREATE TYPE public.driver_status AS ENUM ('available','on_trip','off_duty','suspended');
CREATE TYPE public.trip_status AS ENUM ('draft','dispatched','completed','cancelled');
CREATE TYPE public.maintenance_status AS ENUM ('active','closed');
CREATE TYPE public.expense_category AS ENUM ('toll','fine','insurance','other');

-- ============= PROFILES =============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- ============= USER ROLES =============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role);
$$;

CREATE OR REPLACE FUNCTION public.current_role_of(_user_id uuid)
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT role FROM public.user_roles WHERE user_id=_user_id LIMIT 1;
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'fleet_manager'));
CREATE POLICY "manager manages roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'fleet_manager'))
  WITH CHECK (public.has_role(auth.uid(),'fleet_manager'));

-- ============= AUTO PROFILE + DEFAULT ROLE =============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles(user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'driver'))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============= VEHICLES =============
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number text NOT NULL UNIQUE,
  model text NOT NULL,
  type public.vehicle_type NOT NULL,
  max_load_capacity_kg numeric NOT NULL CHECK (max_load_capacity_kg > 0),
  odometer numeric NOT NULL DEFAULT 0 CHECK (odometer >= 0),
  acquisition_cost numeric NOT NULL DEFAULT 0 CHECK (acquisition_cost >= 0),
  status public.vehicle_status NOT NULL DEFAULT 'available',
  region text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all authenticated read vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "manager writes vehicles" ON public.vehicles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'fleet_manager'))
  WITH CHECK (public.has_role(auth.uid(),'fleet_manager'));
CREATE INDEX vehicles_status_idx ON public.vehicles(status);
CREATE INDEX vehicles_type_idx ON public.vehicles(type);

-- ============= DRIVERS =============
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  license_number text NOT NULL UNIQUE,
  license_category text NOT NULL DEFAULT '',
  license_expiry_date date NOT NULL,
  contact_number text NOT NULL DEFAULT '',
  safety_score integer NOT NULL DEFAULT 80 CHECK (safety_score BETWEEN 0 AND 100),
  status public.driver_status NOT NULL DEFAULT 'available',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read drivers" ON public.drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "manager or safety writes drivers" ON public.drivers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'fleet_manager') OR public.has_role(auth.uid(),'safety_officer'))
  WITH CHECK (public.has_role(auth.uid(),'fleet_manager') OR public.has_role(auth.uid(),'safety_officer'));
CREATE INDEX drivers_status_idx ON public.drivers(status);

-- ============= TRIPS =============
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  destination text NOT NULL,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  cargo_weight_kg numeric NOT NULL CHECK (cargo_weight_kg >= 0),
  planned_distance_km numeric NOT NULL CHECK (planned_distance_km >= 0),
  actual_distance_km numeric,
  fuel_consumed_liters numeric,
  revenue numeric NOT NULL DEFAULT 0 CHECK (revenue >= 0),
  status public.trip_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  dispatched_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read trips" ON public.trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "driver or manager creates trips" ON public.trips FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'fleet_manager') OR public.has_role(auth.uid(),'driver'));
CREATE POLICY "manager updates trips" ON public.trips FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'fleet_manager'))
  WITH CHECK (public.has_role(auth.uid(),'fleet_manager'));
CREATE INDEX trips_status_idx ON public.trips(status);
CREATE INDEX trips_vehicle_idx ON public.trips(vehicle_id);
CREATE INDEX trips_driver_idx ON public.trips(driver_id);
CREATE INDEX trips_created_idx ON public.trips(created_at);

-- ============= TRIP EVENTS =============
CREATE TABLE public.trip_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  event text NOT NULL,
  note text NOT NULL DEFAULT '',
  actor_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.trip_events TO authenticated;
GRANT ALL ON public.trip_events TO service_role;
ALTER TABLE public.trip_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read trip events" ON public.trip_events FOR SELECT TO authenticated USING (true);
CREATE INDEX trip_events_trip_idx ON public.trip_events(trip_id);

-- ============= MAINTENANCE =============
CREATE TABLE public.maintenance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  description text NOT NULL,
  cost numeric NOT NULL DEFAULT 0 CHECK (cost >= 0),
  status public.maintenance_status NOT NULL DEFAULT 'active',
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_logs TO authenticated;
GRANT ALL ON public.maintenance_logs TO service_role;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read maintenance" ON public.maintenance_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "manager writes maintenance" ON public.maintenance_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'fleet_manager'))
  WITH CHECK (public.has_role(auth.uid(),'fleet_manager'));
CREATE INDEX maintenance_vehicle_idx ON public.maintenance_logs(vehicle_id);
CREATE INDEX maintenance_status_idx ON public.maintenance_logs(status);

-- ============= FUEL LOGS =============
CREATE TABLE public.fuel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  liters numeric NOT NULL CHECK (liters > 0),
  cost numeric NOT NULL DEFAULT 0 CHECK (cost >= 0),
  date date NOT NULL DEFAULT current_date,
  odometer_at_fill numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fuel_logs TO authenticated;
GRANT ALL ON public.fuel_logs TO service_role;
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read fuel" ON public.fuel_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "manager or finance writes fuel" ON public.fuel_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'fleet_manager') OR public.has_role(auth.uid(),'financial_analyst'))
  WITH CHECK (public.has_role(auth.uid(),'fleet_manager') OR public.has_role(auth.uid(),'financial_analyst'));
CREATE INDEX fuel_vehicle_idx ON public.fuel_logs(vehicle_id);
CREATE INDEX fuel_date_idx ON public.fuel_logs(date);

-- ============= EXPENSES =============
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  category public.expense_category NOT NULL DEFAULT 'other',
  amount numeric NOT NULL CHECK (amount >= 0),
  date date NOT NULL DEFAULT current_date,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "manager or finance writes expenses" ON public.expenses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'fleet_manager') OR public.has_role(auth.uid(),'financial_analyst'))
  WITH CHECK (public.has_role(auth.uid(),'fleet_manager') OR public.has_role(auth.uid(),'financial_analyst'));
CREATE INDEX expenses_vehicle_idx ON public.expenses(vehicle_id);
CREATE INDEX expenses_date_idx ON public.expenses(date);

-- ============= BUSINESS RULE RPCs =============

-- Create trip (draft) — validates eligibility server-side
CREATE OR REPLACE FUNCTION public.create_trip(
  _source text, _destination text, _vehicle_id uuid, _driver_id uuid,
  _cargo_weight_kg numeric, _planned_distance_km numeric, _revenue numeric DEFAULT 0
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v public.vehicles; d public.drivers; new_id uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(),'fleet_manager') OR public.has_role(auth.uid(),'driver')) THEN
    RAISE EXCEPTION 'Not authorized to create trips';
  END IF;
  SELECT * INTO v FROM public.vehicles WHERE id=_vehicle_id FOR UPDATE;
  IF v.id IS NULL THEN RAISE EXCEPTION 'Vehicle not found'; END IF;
  IF v.status <> 'available' THEN RAISE EXCEPTION 'Vehicle is not available (status: %)', v.status; END IF;
  IF _cargo_weight_kg > v.max_load_capacity_kg THEN
    RAISE EXCEPTION 'Cargo weight % kg exceeds vehicle capacity % kg', _cargo_weight_kg, v.max_load_capacity_kg;
  END IF;
  SELECT * INTO d FROM public.drivers WHERE id=_driver_id FOR UPDATE;
  IF d.id IS NULL THEN RAISE EXCEPTION 'Driver not found'; END IF;
  IF d.status = 'suspended' THEN RAISE EXCEPTION 'Driver is suspended'; END IF;
  IF d.status <> 'available' THEN RAISE EXCEPTION 'Driver is not available (status: %)', d.status; END IF;
  IF d.license_expiry_date < current_date THEN RAISE EXCEPTION 'Driver license expired on %', d.license_expiry_date; END IF;

  INSERT INTO public.trips(source,destination,vehicle_id,driver_id,cargo_weight_kg,planned_distance_km,revenue,status,created_by)
  VALUES(_source,_destination,_vehicle_id,_driver_id,_cargo_weight_kg,_planned_distance_km,_revenue,'draft',auth.uid())
  RETURNING id INTO new_id;
  INSERT INTO public.trip_events(trip_id,event,actor_id) VALUES (new_id,'created',auth.uid());
  RETURN new_id;
END; $$;

-- Dispatch a draft trip
CREATE OR REPLACE FUNCTION public.dispatch_trip(_trip_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t public.trips; v public.vehicles; d public.drivers;
BEGIN
  IF NOT public.has_role(auth.uid(),'fleet_manager') THEN
    RAISE EXCEPTION 'Only fleet managers can dispatch';
  END IF;
  SELECT * INTO t FROM public.trips WHERE id=_trip_id FOR UPDATE;
  IF t.id IS NULL THEN RAISE EXCEPTION 'Trip not found'; END IF;
  IF t.status <> 'draft' THEN RAISE EXCEPTION 'Only draft trips can be dispatched'; END IF;
  SELECT * INTO v FROM public.vehicles WHERE id=t.vehicle_id FOR UPDATE;
  SELECT * INTO d FROM public.drivers WHERE id=t.driver_id FOR UPDATE;
  IF v.status <> 'available' THEN RAISE EXCEPTION 'Vehicle no longer available'; END IF;
  IF d.status <> 'available' THEN RAISE EXCEPTION 'Driver no longer available'; END IF;
  IF d.license_expiry_date < current_date THEN RAISE EXCEPTION 'Driver license expired'; END IF;
  UPDATE public.vehicles SET status='on_trip' WHERE id=v.id;
  UPDATE public.drivers SET status='on_trip' WHERE id=d.id;
  UPDATE public.trips SET status='dispatched', dispatched_at=now() WHERE id=_trip_id;
  INSERT INTO public.trip_events(trip_id,event,actor_id) VALUES (_trip_id,'dispatched',auth.uid());
END; $$;

-- Complete a dispatched trip
CREATE OR REPLACE FUNCTION public.complete_trip(
  _trip_id uuid, _actual_distance_km numeric, _fuel_consumed_liters numeric, _final_odometer numeric
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t public.trips;
BEGIN
  IF NOT public.has_role(auth.uid(),'fleet_manager') THEN RAISE EXCEPTION 'Only fleet managers can complete trips'; END IF;
  SELECT * INTO t FROM public.trips WHERE id=_trip_id FOR UPDATE;
  IF t.id IS NULL THEN RAISE EXCEPTION 'Trip not found'; END IF;
  IF t.status <> 'dispatched' THEN RAISE EXCEPTION 'Only dispatched trips can be completed'; END IF;
  UPDATE public.trips SET status='completed', completed_at=now(),
    actual_distance_km=_actual_distance_km, fuel_consumed_liters=_fuel_consumed_liters
    WHERE id=_trip_id;
  UPDATE public.vehicles SET status='available', odometer=GREATEST(odometer,_final_odometer) WHERE id=t.vehicle_id;
  UPDATE public.drivers SET status='available' WHERE id=t.driver_id;
  INSERT INTO public.trip_events(trip_id,event,actor_id,note)
    VALUES (_trip_id,'completed',auth.uid(), format('distance=%s km, fuel=%s L', _actual_distance_km, _fuel_consumed_liters));
END; $$;

-- Cancel a trip
CREATE OR REPLACE FUNCTION public.cancel_trip(_trip_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t public.trips;
BEGIN
  IF NOT public.has_role(auth.uid(),'fleet_manager') THEN RAISE EXCEPTION 'Only fleet managers can cancel trips'; END IF;
  SELECT * INTO t FROM public.trips WHERE id=_trip_id FOR UPDATE;
  IF t.id IS NULL THEN RAISE EXCEPTION 'Trip not found'; END IF;
  IF t.status NOT IN ('draft','dispatched') THEN RAISE EXCEPTION 'Cannot cancel a % trip', t.status; END IF;
  IF t.status='dispatched' THEN
    UPDATE public.vehicles SET status='available' WHERE id=t.vehicle_id AND status='on_trip';
    UPDATE public.drivers SET status='available' WHERE id=t.driver_id AND status='on_trip';
  END IF;
  UPDATE public.trips SET status='cancelled', cancelled_at=now() WHERE id=_trip_id;
  INSERT INTO public.trip_events(trip_id,event,actor_id) VALUES (_trip_id,'cancelled',auth.uid());
END; $$;

-- Open maintenance
CREATE OR REPLACE FUNCTION public.open_maintenance(_vehicle_id uuid, _description text, _cost numeric DEFAULT 0)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v public.vehicles; new_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'fleet_manager') THEN RAISE EXCEPTION 'Only fleet managers can open maintenance'; END IF;
  SELECT * INTO v FROM public.vehicles WHERE id=_vehicle_id FOR UPDATE;
  IF v.id IS NULL THEN RAISE EXCEPTION 'Vehicle not found'; END IF;
  IF v.status = 'retired' THEN RAISE EXCEPTION 'Vehicle is retired'; END IF;
  IF v.status = 'on_trip' THEN RAISE EXCEPTION 'Vehicle is currently on a trip'; END IF;
  INSERT INTO public.maintenance_logs(vehicle_id,description,cost,status)
    VALUES(_vehicle_id,_description,_cost,'active') RETURNING id INTO new_id;
  UPDATE public.vehicles SET status='in_shop' WHERE id=_vehicle_id;
  RETURN new_id;
END; $$;

-- Close maintenance
CREATE OR REPLACE FUNCTION public.close_maintenance(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.maintenance_logs; v public.vehicles; other_count int;
BEGIN
  IF NOT public.has_role(auth.uid(),'fleet_manager') THEN RAISE EXCEPTION 'Only fleet managers can close maintenance'; END IF;
  SELECT * INTO m FROM public.maintenance_logs WHERE id=_id FOR UPDATE;
  IF m.id IS NULL THEN RAISE EXCEPTION 'Record not found'; END IF;
  IF m.status='closed' THEN RETURN; END IF;
  UPDATE public.maintenance_logs SET status='closed', closed_at=now() WHERE id=_id;
  SELECT * INTO v FROM public.vehicles WHERE id=m.vehicle_id FOR UPDATE;
  SELECT count(*) INTO other_count FROM public.maintenance_logs WHERE vehicle_id=v.id AND status='active';
  IF other_count = 0 AND v.status='in_shop' THEN
    UPDATE public.vehicles SET status='available' WHERE id=v.id;
  END IF;
END; $$;

GRANT EXECUTE ON FUNCTION public.create_trip(text,text,uuid,uuid,numeric,numeric,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_trip(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_trip(uuid,numeric,numeric,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_trip(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.open_maintenance(uuid,text,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_maintenance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_role_of(uuid) TO authenticated;
