const express = require('express');
const stravaController = require('./strava.controller');

const router = express.Router();

// Initiate Strava OAuth login
router.get('/login', stravaController.login);

// Strava OAuth callback
router.get('/callback', stravaController.callback);

// List authenticated user's activities
router.get('/activities', stravaController.getActivities);

// Get a single activity detail (for accurate calories, etc.)
router.get('/activities/:id', stravaController.getActivityById);

// Get specific activity stream
router.get('/activities/:id/streams', stravaController.getActivityStreams);

// Logout user
router.get('/logout', stravaController.logout);

module.exports = router;
