const express = require('express');
const stravaController = require('./strava.controller');

const router = express.Router();

// Initiate Strava OAuth login
router.get('/login', stravaController.login);

// Strava OAuth callback
router.get('/callback', stravaController.callback);

// List authenticated user's activities
router.get('/activities', stravaController.getActivities);

// Logout user
router.get('/logout', stravaController.logout);

module.exports = router;
