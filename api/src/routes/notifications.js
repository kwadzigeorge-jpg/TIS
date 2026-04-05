const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const notifService = require('../services/notification.service');

// POST /v1/notifications/register-token
router.post('/register-token', authenticate, async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token is required' });
    await notifService.registerFCMToken({ userId: req.user.id, token });
    res.json({ registered: true });
  } catch (err) { next(err); }
});

// DELETE /v1/notifications/token
router.delete('/token', authenticate, async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token is required' });
    await notifService.removeFCMToken({ userId: req.user.id, token });
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
