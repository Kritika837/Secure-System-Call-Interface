const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/logController');
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');

// Only allow Admin to view logs
router.get('/', authenticate, authorizeRole('Admin'), getLogs);

module.exports = router;
