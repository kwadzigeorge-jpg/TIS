-- TIS Initial Schema Migration
-- Run: psql $DATABASE_URL -f 001_initial_schema.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name          TEXT,
  avatar_url    TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'email', -- 'email' | 'google' | 'apple'
  provider_id   TEXT,
  fcm_tokens    TEXT[] DEFAULT '{}',
  preferences   JSONB DEFAULT '{}',            -- { categories: [], radius_km: 5, notifications: true }
  is_admin      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id    SERIAL PRIMARY KEY,
  slug  TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  icon  TEXT
);

INSERT INTO categories (slug, label, icon) VALUES
  ('landmark',   'Landmarks',    'landmark'),
  ('cultural',   'Cultural',     'museum'),
  ('scenic',     'Scenic',       'mountain'),
  ('restaurant', 'Food & Drink', 'utensils'),
  ('beach',      'Beaches',      'umbrella-beach'),
  ('wildlife',   'Wildlife',     'paw'),
  ('religious',  'Religious',    'place-of-worship'),
  ('shopping',   'Shopping',     'shopping-bag')
ON CONFLICT (slug) DO NOTHING;

-- Points of Interest
CREATE TABLE IF NOT EXISTS pois (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name               TEXT NOT NULL,
  description        TEXT,
  category_id        INT REFERENCES categories(id),
  location           GEOGRAPHY(POINT, 4326) NOT NULL,
  address            TEXT,
  city               TEXT,
  region             TEXT,
  country_code       CHAR(2) DEFAULT 'GH',
  images             TEXT[] DEFAULT '{}',
  avg_rating         NUMERIC(3,2) DEFAULT 0,
  review_count       INT DEFAULT 0,
  avg_stop_time_mins INT DEFAULT 30,
  entrance_fee       NUMERIC(10,2),
  currency           CHAR(3) DEFAULT 'GHS',
  opening_hours      JSONB DEFAULT '{}',   -- { mon: "08:00-18:00", ... }
  website            TEXT,
  phone              TEXT,
  tags               TEXT[] DEFAULT '{}',
  is_active          BOOLEAN DEFAULT TRUE,
  is_verified        BOOLEAN DEFAULT FALSE,
  metadata           JSONB DEFAULT '{}',
  created_by         UUID REFERENCES users(id),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Critical spatial index
CREATE INDEX IF NOT EXISTS idx_pois_location    ON pois USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_pois_country     ON pois(country_code);
CREATE INDEX IF NOT EXISTS idx_pois_category    ON pois(category_id);
CREATE INDEX IF NOT EXISTS idx_pois_active      ON pois(is_active);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poi_id     UUID REFERENCES pois(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body       TEXT,
  images     TEXT[] DEFAULT '{}',
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poi_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_poi  ON reviews(poi_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  poi_id     UUID REFERENCES pois(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, poi_id)
);

-- Saved Routes
CREATE TABLE IF NOT EXISTS routes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT,
  origin_name  TEXT,
  dest_name    TEXT,
  origin       GEOGRAPHY(POINT, 4326),
  destination  GEOGRAPHY(POINT, 4326),
  polyline     TEXT NOT NULL,
  radius_km    SMALLINT DEFAULT 5,
  distance_m   INT,
  duration_s   INT,
  cached_pois  JSONB DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routes_user ON routes(user_id);

-- Notification Log (prevent duplicate notifications)
CREATE TABLE IF NOT EXISTS notification_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  poi_id     UUID REFERENCES pois(id) ON DELETE CASCADE,
  route_id   UUID REFERENCES routes(id) ON DELETE CASCADE,
  type       TEXT DEFAULT 'approaching',
  sent_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, poi_id, route_id)
);

-- Articles / Blog
CREATE TABLE IF NOT EXISTS articles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  body         TEXT,
  excerpt      TEXT,
  cover_image  TEXT,
  author_id    UUID REFERENCES users(id),
  poi_tags     UUID[] DEFAULT '{}',
  category_tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pois_updated     BEFORE UPDATE ON pois     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reviews_updated  BEFORE UPDATE ON reviews  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_articles_updated BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: recalculate avg_rating on reviews insert/update/delete
CREATE OR REPLACE FUNCTION refresh_poi_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pois SET
    avg_rating   = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE poi_id = COALESCE(NEW.poi_id, OLD.poi_id)),
    review_count = (SELECT COUNT(*) FROM reviews WHERE poi_id = COALESCE(NEW.poi_id, OLD.poi_id))
  WHERE id = COALESCE(NEW.poi_id, OLD.poi_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_poi_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION refresh_poi_rating();
