const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const db = require('../db');

// GET /v1/users/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT id, email, name, avatar_url, preferences, is_admin, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// PATCH /v1/users/me
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { name, avatar_url, preferences } = req.body;
    const { rows } = await db.query(`
      UPDATE users
      SET
        name        = COALESCE($2, name),
        avatar_url  = COALESCE($3, avatar_url),
        preferences = COALESCE($4::jsonb, preferences)
      WHERE id = $1
      RETURNING id, email, name, avatar_url, preferences
    `, [req.user.id, name, avatar_url, preferences ? JSON.stringify(preferences) : null]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// GET /v1/users/me/bookmarks
router.get('/me/bookmarks', authenticate, async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT p.id, p.name, p.images, p.avg_rating,
             c.slug AS category,
             ST_Y(p.location::geometry) AS lat,
             ST_X(p.location::geometry) AS lng,
             b.created_at AS bookmarked_at
      FROM bookmarks b
      JOIN pois p ON p.id = b.poi_id
      JOIN categories c ON c.id = p.category_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    res.json({ bookmarks: rows });
  } catch (err) { next(err); }
});

// POST /v1/users/me/bookmarks/:poiId
router.post('/me/bookmarks/:poiId', authenticate, async (req, res, next) => {
  try {
    await db.query(
      'INSERT INTO bookmarks (user_id, poi_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.poiId]
    );
    res.status(201).json({ bookmarked: true });
  } catch (err) { next(err); }
});

// DELETE /v1/users/me/bookmarks/:poiId
router.delete('/me/bookmarks/:poiId', authenticate, async (req, res, next) => {
  try {
    await db.query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND poi_id = $2',
      [req.user.id, req.params.poiId]
    );
    res.status(204).send();
  } catch (err) { next(err); }
});

// GET /v1/users/me/routes
router.get('/me/routes', authenticate, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM routes WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ routes: rows });
  } catch (err) { next(err); }
});

// POST /v1/users/me/routes
router.post('/me/routes', authenticate, async (req, res, next) => {
  try {
    const { name, origin_name, dest_name, polyline, radius_km = 5, cached_pois = [] } = req.body;
    if (!polyline) return res.status(400).json({ error: 'polyline is required' });

    const { rows } = await db.query(`
      INSERT INTO routes (user_id, name, origin_name, dest_name, polyline, radius_km, cached_pois)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [req.user.id, name, origin_name, dest_name, polyline, radius_km, JSON.stringify(cached_pois)]);

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
