const express = require('express');
const router = express.Router();
const { getInventoryLogs, getStaffLogs } = require('../controllers/logController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/inventory', protect, admin, getInventoryLogs);
router.get('/staff', protect, admin, getStaffLogs);

module.exports = router;