const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// ── Landing page ──
router.get('/', (req, res) => {
  res.render('index', { title: 'Manasyn — Support · Reflect · Grow' });
});

// ── How it works ──
router.get('/how-it-works', (req, res) => {
  res.render('pages/how-it-works', { title: 'How it works — Manasyn' });
});

// ── For You ──
router.get('/for-you', (req, res) => {
  res.render('pages/for-you', { title: 'For You — Manasyn' });
});

// ── For Students ──
router.get('/for-students', (req, res) => {
  res.render('pages/for-students', { title: 'For Students — Manasyn' });
});

// ── Safety ──
router.get('/safety', (req, res) => {
  res.render('pages/safety', { title: 'Safety — Manasyn' });
});

// ── About ──
router.get('/about', (req, res) => {
  res.render('pages/about', { title: 'About — Manasyn' });
});

// ── Pricing ──
router.get('/pricing', (req, res) => {
  res.render('pages/pricing', { title: 'Pricing — Manasyn' });
});

// ── Crisis resources (public, always accessible) ──
router.get('/crisis-resources', (req, res) => {
  res.render('pages/crisis-resources', { title: 'Crisis Resources — Manasyn' });
});

module.exports = router;