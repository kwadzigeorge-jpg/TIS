const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const db = require('../db');

// GET /v1/articles
router.get('/', async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const { rows } = await db.query(`
      SELECT a.id, a.title, a.slug, a.excerpt, a.cover_image,
             a.category_tags, a.published_at,
             u.name AS author_name
      FROM articles a
      JOIN users u ON u.id = a.author_id
      WHERE a.is_published = TRUE
      ORDER BY a.published_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);
    res.json({ articles: rows });
  } catch (err) { next(err); }
});

// GET /v1/articles/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT a.*, u.name AS author_name, u.avatar_url AS author_avatar
      FROM articles a
      JOIN users u ON u.id = a.author_id
      WHERE a.slug = $1 AND a.is_published = TRUE
    `, [req.params.slug]);
    if (!rows.length) return res.status(404).json({ error: 'Article not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
