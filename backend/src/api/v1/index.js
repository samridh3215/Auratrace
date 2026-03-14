const express = require('express');
const stravaRoutes = require('../../features/strava/strava.routes');

const router = express.Router();

// Feature routes
router.use('/strava', stravaRoutes);

module.exports = router;
