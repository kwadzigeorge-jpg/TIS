const router = require('express').Router();
const Joi = require('joi');
const authService = require('../services/auth.service');
const { authenticate } = require('../middleware/auth');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const result = await authService.register(value);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const result = await authService.login(value);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/google', async (req, res, next) => {
  try {
    const { google_id, email, name, avatar_url } = req.body;
    if (!google_id || !email) return res.status(400).json({ error: 'google_id and email are required' });
    const result = await authService.googleAuth({ google_id, email, name, avatar_url });
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'refresh_token required' });
    const tokens = await authService.refreshTokens(refresh_token);
    res.json({ tokens });
  } catch (err) { next(err); }
});

router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ message: 'current_password and new_password required' });
    if (new_password.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
    await authService.changePassword(req.user.id, current_password, new_password);
    res.json({ message: 'Password updated successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
