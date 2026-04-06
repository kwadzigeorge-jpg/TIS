const router = require('express').Router();
const https = require('https');
const { encode } = require('@mapbox/polyline');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// GET /v1/routes/directions?origin=Accra&destination=Kumasi
router.get('/directions', async (req, res, next) => {
  try {
    const { origin, destination } = req.query;
    if (!origin || !destination) return res.status(400).json({ error: 'origin and destination required' });

    const token = process.env.MAPBOX_ACCESS_TOKEN;

    const [oData, dData] = await Promise.all([
      httpGet(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(origin)}.json?access_token=${token}&country=GH&limit=1`),
      httpGet(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination)}.json?access_token=${token}&country=GH&limit=1`),
    ]);

    const oFeature = oData.features[0];
    const dFeature = dData.features[0];

    if (!oFeature) return res.status(404).json({ error: `Could not geocode origin: ${origin}` });
    if (!dFeature) return res.status(404).json({ error: `Could not geocode destination: ${destination}` });

    const [oLng, oLat] = oFeature.center;
    const [dLng, dLat] = dFeature.center;

    const dirData = await httpGet(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${oLng},${oLat};${dLng},${dLat}?access_token=${token}&geometries=geojson&overview=full&steps=false`
    );

    const route = dirData.routes[0];
    if (!route) return res.status(404).json({ error: 'No route found between these locations' });

    const coords = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
    const distanceKm = (route.distance / 1000).toFixed(1);
    const durationMin = Math.round(route.duration / 60);

    // Encode as Mapbox polyline for the along-route POI query
    const polyline = encode(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]));

    res.json({
      origin: { name: oFeature.place_name, lat: oLat, lng: oLng },
      destination: { name: dFeature.place_name, lat: dLat, lng: dLng },
      coords,
      distanceKm,
      durationMin,
      polyline,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
