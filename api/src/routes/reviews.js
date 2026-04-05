const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const db = require('../db');

// GET /v1/reviews/poi/:poiId
router.get('/poi/:poiId', async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const { rows } = await db.query(`
      SELECT r.*, u.name AS author_name, u.avatar_url AS author_avatar
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.poi_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.params.poiId, parseInt(limit), parseInt(offset)]);
    res.json({ reviews: rows });
  } catch (err) { next(err); }
});

// POST /v1/reviews/poi/:poiId
router.post('/poi/:poiId', authenticate, async (req, res, next) => {
  try {
    const { rating, body, images = [] } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'rating must be 1–5' });

    const { rows } = await db.query(`
      INSERT INTO reviews (poi_id, user_id, rating, body, images)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (poi_id, user_id)
      DO UPDATE SET rating = $3, body = $4, images = $5, updated_at = NOW()
      RETURNING *
    `, [req.params.poiId, req.user.id, rating, body, images]);

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /v1/reviews/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Review not found or not yours' });
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
