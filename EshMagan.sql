-- 1. DATABASE HEADERS & SESSION FIXES
SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;

-- Ensures PostgreSQL can find the PostGIS geography type
SELECT pg_catalog.set_config('search_path', 'public, pg_catalog', false);

-- 2. ENABLE EXTENSION
-- Must be done before creating any tables with geometry/geography types
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

-- 3. CORE TABLES
CREATE TABLE public.users (
    user_id character varying PRIMARY KEY,
    user_email character varying UNIQUE,
    user_password character varying,
    user_phone character varying,
    user_role character varying CHECK (user_role IN ('Resident', 'Responder', 'Municipality', 'Admin')),
    isactive boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
    updated_at timestamp without time zone
);

CREATE TABLE public.fireevents (
    fire_id character varying PRIMARY KEY,
    fire_source character varying CHECK (fire_source IN ('Infrared', 'Responder', 'Prediction', 'Weather')),
    fire_location public.geography(Point, 4326),
    fire_severitylevel integer,
    is_extinguished boolean DEFAULT false,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- 4. DEPENDENT TABLES

-- Admin (FK to Users)
CREATE TABLE public.admins (
    admin_id character varying PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    admin_fname character varying NOT NULL,
    admin_lname character varying NOT NULL
);

-- MunicipalityDetails (FK to Users)
CREATE TABLE public.municipalitydetails (
    municipality_id character varying PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    municipality_name character varying NOT NULL,
    region_name character varying NOT NULL UNIQUE,
    municipality_code character varying,
    municipality_location public.geography(Point, 4326),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- ResidentDetails (FK to Users)
CREATE TABLE public.residentdetails (
    resident_id character varying PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    resident_fname character varying NOT NULL,
    resident_lname character varying NOT NULL,
    resident_dob character varying,
    resident_idnb character varying,
    resident_idpic character varying,
    home_location public.geography(Point, 4326),
    work_location public.geography(Point, 4326),
    last_known_location public.geography(Point, 4326),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- ResponderDetails (FK to Users)
CREATE TABLE public.responderdetails (
    responder_id character varying PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    unit_nb character varying NOT NULL,
    unit_location public.geography(Point, 4326),
    assigned_region character varying,
    responder_status character varying CHECK (responder_status IN ('Active', 'Standby', 'Unavailable')),
    last_known_location public.geography(Point, 4326),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- FireRespondAssignment (FK to FireEvents and ResponderDetails)
CREATE TABLE public.firerespondassignments (
    assignment_id character varying PRIMARY KEY,
    assigned_at timestamp without time zone,
    assignment_status character varying,
    fire_id character varying REFERENCES public.fireevents(fire_id) ON DELETE CASCADE,
    responder_id character varying REFERENCES public.responderdetails(responder_id) ON DELETE CASCADE
);

-- Alert (FK to FireEvents)
CREATE TABLE public.alerts (
    alert_id character varying PRIMARY KEY,
    alert_type character varying,
    target_role character varying,
    alert_message text NOT NULL,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fire_id character varying REFERENCES public.fireevents(fire_id) ON DELETE CASCADE,
    CONSTRAINT alert_alert_type_check CHECK (((alert_type)::text = ANY ((ARRAY['FireAlert'::character varying, 'EvacuationAlert'::character varying, 'PredictionAlert'::character varying])::text[]))),
    CONSTRAINT alert_target_role_check CHECK (((target_role)::text = ANY ((ARRAY['Resident'::character varying, 'Responder'::character varying, 'Municipality'::character varying, 'Admin'::character varying])::text[])))
);

-- EvacuationRoute (FK to FireEvents)
CREATE TABLE public.evacuationroutes (
    route_id character varying PRIMARY KEY,
    route_status character varying,
    route_priority integer,
    route_path public.geography(LineString, 4326),
    safe_zone public.geography(Point, 4326),
    distance_km numeric,
    estimated_time interval,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fire_id character varying REFERENCES public.fireevents(fire_id) ON DELETE CASCADE
);

-- Notification (FK to FireEvents and Users)
CREATE TABLE public.notifications (
    notification_id character varying PRIMARY KEY,
    target_role character varying,
    notification_message text NOT NULL,
    notification_status character varying,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fire_id character varying REFERENCES public.fireevents(fire_id) ON DELETE SET NULL,
    user_id character varying REFERENCES public.users(user_id) ON DELETE CASCADE,
    CONSTRAINT notification_notification_status_check CHECK (((notification_status)::text = ANY ((ARRAY['Sent'::character varying, 'Delivered'::character varying, 'Failed'::character varying])::text[]))),
    CONSTRAINT notification_target_role_check CHECK (((target_role)::text = ANY ((ARRAY['Resident'::character varying, 'Responder'::character varying, 'Municipality'::character varying, 'Admin'::character varying])::text[])))
);

-- End of script
