require('dotenv').config();
const { getAuthUrl } = require('./src/features/strava/strava.service');
console.log(getAuthUrl());
