const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const poiService = require('../services/poi.service');

// GET /v1/pois/along-route
router.get('/along-route', async (req, res, next) => {
  try {
    const { polyline, radius_km = 5, categories, limit = 100 } = req.query;
    if (!polyline) return res.status(400).json({ error: 'polyline is required' });

    const pois = await poiService.getPOIsAlongRoute({
      polyline,
      radiusKm: parseFloat(radius_km),
      categories: categories ? categories.split(',') : [],
      limit: parseInt(limit, 10),
    });

    res.json({ pois, total: pois.length });
  } catch (err) { next(err); }
});

// GET /v1/pois/nearby
router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, radius_km = 5, categories, limit = 50 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

    const pois = await poiService.getNearbyPOIs({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radiusKm: parseFloat(radius_km),
      categories: categories ? categories.split(',') : [],
      limit: parseInt(limit, 10),
    });

    res.json({ pois, total: pois.length });
  } catch (err) { next(err); }
});

// GET /v1/pois/search
router.get('/search', async (req, res, next) => {
  try {
    const { q, country = 'GH', limit = 30 } = req.query;
    if (!q?.trim()) return res.status(400).json({ error: 'q (search query) is required' });
    const pois = await poiService.searchPOIs({ q, country, limit: parseInt(limit, 10) });
    res.json({ pois, total: pois.length });
  } catch (err) { next(err); }
});

// GET /v1/pois/:id
router.get('/:id', async (req, res, next) => {
  try {
    const poi = await poiService.getPOIById(req.params.id);
    if (!poi) return res.status(404).json({ error: 'POI not found' });
    res.json(poi);
  } catch (err) { next(err); }
});

module.exports = router;
