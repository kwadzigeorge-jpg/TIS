const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const poiService = require('../services/poi.service');
const db = require('../db');

router.use(authenticate, requireAdmin);

// GET /v1/admin/pois
router.get('/pois', async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    const searchClause = search ? `AND (p.name ILIKE '%${search}%' OR p.city ILIKE '%${search}%')` : '';
    const { rows } = await db.query(`
      SELECT p.id, p.name, p.city, p.country_code, p.is_active, p.is_verified,
             p.avg_rating, p.review_count, c.slug AS category, p.created_at
      FROM pois p
      JOIN categories c ON c.id = p.category_id
      WHERE 1=1 ${searchClause}
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);
    res.json({ pois: rows });
  } catch (err) { next(err); }
});

// POST /v1/admin/pois
router.post('/pois', async (req, res, next) => {
  try {
    const poi = await poiService.createPOI({ ...req.body, created_by: req.user.id });
    res.status(201).json(poi);
  } catch (err) { next(err); }
});

// PATCH /v1/admin/pois/:id
router.patch('/pois/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'is_active', 'is_verified', 'images', 'tags'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid fields to update' });

    const sets = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
    const { rows } = await db.query(
      `UPDATE pois SET ${sets} WHERE id = $1 RETURNING *`,
      [req.params.id, ...Object.values(updates)]
    );
    if (!rows.length) return res.status(404).json({ error: 'POI not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// GET /v1/admin/reviews (moderation queue)
router.get('/reviews', async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT r.*, u.name AS author_name, p.name AS poi_name
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN pois p ON p.id = r.poi_id
      WHERE r.is_flagged = TRUE
      ORDER BY r.created_at DESC
    `);
    res.json({ reviews: rows });
  } catch (err) { next(err); }
});

// DELETE /v1/admin/reviews/:id
router.delete('/reviews/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

// GET /v1/admin/analytics
router.get('/analytics', async (req, res, next) => {
  try {
    const [users, pois, reviews, topPois] = await Promise.all([
      db.query('SELECT COUNT(*) AS total FROM users'),
      db.query('SELECT COUNT(*) AS total FROM pois WHERE is_active = TRUE'),
      db.query('SELECT COUNT(*) AS total FROM reviews'),
      db.query(`
        SELECT p.id, p.name, p.avg_rating, p.review_count, c.slug AS category
        FROM pois p JOIN categories c ON c.id = p.category_id
        ORDER BY p.review_count DESC LIMIT 10
      `),
    ]);
    res.json({
      total_users: parseInt(users.rows[0].total),
      total_pois: parseInt(pois.rows[0].total),
      total_reviews: parseInt(reviews.rows[0].total),
      top_pois: topPois.rows,
    });
  } catch (err) { next(err); }
});

module.exports = router;
