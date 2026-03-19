require('dotenv').config();

const requiredEnvVars = [
    'STRAVA_CLIENT_ID',
    'STRAVA_CLIENT_SECRET',
    'STRAVA_REDIRECT_URI',
    'JWT_SECRET',
    'FRONTEND_URL'
];

requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
        throw new Error(`CRITICAL: Environment variable ${varName} is missing.`);
    }
});

const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT} — log file: ${logger.LOG_FILE}`);
});
