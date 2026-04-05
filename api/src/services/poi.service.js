const { decode } = require('@mapbox/polyline');
const db = require('../db');

/**
 * Find all active POIs within `radiusKm` of a given encoded route polyline.
 * Uses PostGIS ST_DWithin on a GEOGRAPHY column for accurate metre-level distance.
 */
async function getPOIsAlongRoute({ polyline, radiusKm = 5, categories = [], limit = 100 }) {
  const coords = decode(polyline); // [[lat, lng], ...]
  if (!coords.length) throw new Error('Invalid polyline');

  const linestring = `LINESTRING(${coords.map(([lat, lng]) => `${lng} ${lat}`).join(',')})`;
  const radiusM = radiusKm * 1000;

  const categoryClause = categories.length
    ? `AND c.slug = ANY($3::text[])`
    : '';

  const params = [linestring, radiusM, ...(categories.length ? [categories] : [])];

  const { rows } = await db.query(`
    SELECT
      p.id,
      p.name,
      p.description,
      p.images,
      p.avg_rating,
      p.review_count,
      p.avg_stop_time_mins,
      p.entrance_fee,
      p.currency,
      p.address,
      p.city,
      p.tags,
      c.slug  AS category,
      c.label AS category_label,
      ST_Y(p.location::geometry) AS lat,
      ST_X(p.location::geometry) AS lng,
      ROUND(ST_Distance(
        p.location,
        ST_GeogFromText('SRID=4326;' || $1)
      )::numeric, 0) AS distance_from_route_m
    FROM pois p
    JOIN categories c ON c.id = p.category_id
    WHERE
      p.is_active = TRUE
      AND ST_DWithin(
        p.location,
        ST_GeogFromText('SRID=4326;' || $1),
        $2
      )
      ${categoryClause}
    ORDER BY distance_from_route_m ASC
    LIMIT ${parseInt(limit, 10)}
  `, params);

  return rows;
}

/**
 * Find POIs near a single coordinate point.
 */
async function getNearbyPOIs({ lat, lng, radiusKm = 5, categories = [], limit = 50 }) {
  const categoryClause = categories.length
    ? `AND c.slug = ANY($3::text[])`
    : '';

  const params = [lng, lat, radiusKm * 1000, ...(categories.length ? [categories] : [])];

  const { rows } = await db.query(`
    SELECT
      p.id,
      p.name,
      p.description,
      p.images,
      p.avg_rating,
      p.avg_stop_time_mins,
      c.slug  AS category,
      c.label AS category_label,
      ST_Y(p.location::geometry) AS lat,
      ST_X(p.location::geometry) AS lng,
      ROUND(ST_Distance(
        p.location,
        ST_MakePoint($1, $2)::geography
      )::numeric, 0) AS distance_m
    FROM pois p
    JOIN categories c ON c.id = p.category_id
    WHERE
      p.is_active = TRUE
      AND ST_DWithin(
        p.location,
        ST_MakePoint($1, $2)::geography,
        $3
      )
      ${categoryClause}
    ORDER BY distance_m ASC
    LIMIT ${parseInt(limit, 10)}
  `, params);

  return rows;
}

async function getPOIById(id) {
  const { rows } = await db.query(`
    SELECT
      p.*,
      c.slug AS category,
      c.label AS category_label,
      ST_Y(p.location::geometry) AS lat,
      ST_X(p.location::geometry) AS lng
    FROM pois p
    JOIN categories c ON c.id = p.category_id
    WHERE p.id = $1 AND p.is_active = TRUE
  `, [id]);
  return rows[0] || null;
}

async function searchPOIs({ q, country = 'GH', limit = 30 }) {
  const { rows } = await db.query(`
    SELECT
      p.id, p.name, p.description, p.images, p.avg_rating,
      c.slug AS category,
      ST_Y(p.location::geometry) AS lat,
      ST_X(p.location::geometry) AS lng
    FROM pois p
    JOIN categories c ON c.id = p.category_id
    WHERE
      p.is_active = TRUE
      AND p.country_code = $2
      AND (
        p.name ILIKE '%' || $1 || '%'
        OR p.description ILIKE '%' || $1 || '%'
        OR p.city ILIKE '%' || $1 || '%'
        OR $1 = ANY(p.tags)
      )
    ORDER BY p.avg_rating DESC
    LIMIT $3
  `, [q, country, limit]);
  return rows;
}

async function createPOI(data) {
  const {
    name, description, category_id, lat, lng,
    address, city, region, country_code = 'GH',
    images = [], avg_stop_time_mins = 30,
    entrance_fee, currency = 'GHS',
    opening_hours = {}, website, phone, tags = [],
    created_by,
  } = data;

  const { rows } = await db.query(`
    INSERT INTO pois (
      name, description, category_id, location,
      address, city, region, country_code,
      images, avg_stop_time_mins, entrance_fee, currency,
      opening_hours, website, phone, tags, created_by
    ) VALUES (
      $1, $2, $3, ST_GeogFromText('SRID=4326;POINT(' || $4 || ' ' || $5 || ')'),
      $6, $7, $8, $9,
      $10, $11, $12, $13,
      $14, $15, $16, $17, $18
    )
    RETURNING *
  `, [
    name, description, category_id, lng, lat,
    address, city, region, country_code,
    images, avg_stop_time_mins, entrance_fee, currency,
    JSON.stringify(opening_hours), website, phone, tags, created_by,
  ]);

  return rows[0];
}

module.exports = { getPOIsAlongRoute, getNearbyPOIs, getPOIById, searchPOIs, createPOI };
