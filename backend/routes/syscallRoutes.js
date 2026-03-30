const express = require('express');
const router = express.Router();
const { executeCall } = require('../controllers/syscallController');
const { authenticate } = require('../middlewares/authMiddleware');

router.post('/execute', authenticate, executeCall);

module.exports = router;
