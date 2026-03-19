const jwt = require('jsonwebtoken');
const stravaService = require('./strava.service');
const logger = require('../../utils/logger');

const login = (req, res) => {
    // The frontend should send its base redirect URL (e.g., http://localhost:8081 or exp://192.168.1.5:8081)
    const returnTo = req.query.redirect_uri || process.env.FRONTEND_URL;
    const authUrl = stravaService.getAuthUrl(returnTo);
    res.redirect(authUrl);
};

const callback = async (req, res) => {
    try {
        const { code, error, state } = req.query;

        if (error) {
            return res.status(403).json({ error: 'Authorization failed', details: error });
        }

        if (!code) {
            return res.status(400).json({ error: 'Authorization code missing' });
        }

        // Exchange code for access token
        const tokenData = await stravaService.exchangeCodeForToken(code);

        // Create a JWT for the user instead of relying solely on session cookies
        const userToken = jwt.sign({
            accessToken: tokenData.access_token,
            athlete: tokenData.athlete
        }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Redirect back to the dynamic return URL provided in 'state'
        const baseUrl = state || process.env.FRONTEND_URL;

        // Ensure there is no trailing slash for consistency
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

        res.redirect(`${cleanBaseUrl}/dashboard?token=${userToken}`);
    } catch (err) {
        logger.error(`Strava auth callback failed: ${err.message}`, err);
        if (err.response) {
            logger.error(`Strava API response: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
        }
        res.status(500).json({
            error: 'Internal Server Error during authentication',
            details: err.message,
            strava_msg: err.response?.data?.message
        });
    }
};

const getActivities = async (req, res) => {
    try {
        let accessToken;

        // Try to get token from Authorization header (Bearer token)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                accessToken = decoded.accessToken;
            } catch (err) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }
        }
        // Fallback to session for web if already established
        else if (req.session.stravaAuth) {
            accessToken = req.session.stravaAuth.accessToken;
        }

        if (!accessToken) {
            return res.status(401).json({ error: 'Unauthorized. Please login first' });
        }

        const activities = await stravaService.fetchActivities(accessToken);
        res.json({ count: activities.length, activities });
    } catch (err) {
        logger.error(`Failed to fetch activities: ${err.message}`, err);
        if (err.response && err.response.status === 401) {
            return res.status(401).json({ error: 'Strava access token expired' });
        }
        res.status(500).json({ error: 'Failed to fetch activities from Strava' });
    }
};

const getActivityById = async (req, res) => {
    try {
        let accessToken;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                accessToken = decoded.accessToken;
            } catch (err) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }
        } else if (req.session.stravaAuth) {
            accessToken = req.session.stravaAuth.accessToken;
        }

        if (!accessToken) {
            return res.status(401).json({ error: 'Unauthorized. Please login first' });
        }

        const { id } = req.params;
        const activity = await stravaService.fetchActivityById(accessToken, id);
        res.json(activity);
    } catch (err) {
        logger.error(`Failed to fetch activity ${req.params.id}: ${err.message}`, err);
        if (err.response && err.response.status === 401) {
            return res.status(401).json({ error: 'Strava access token expired' });
        }
        res.status(500).json({ error: 'Failed to fetch activity from Strava' });
    }
};

const getActivityStreams = async (req, res) => {
    try {
        let accessToken;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                accessToken = decoded.accessToken;
            } catch (err) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }
        } else if (req.session.stravaAuth) {
            accessToken = req.session.stravaAuth.accessToken;
        }

        if (!accessToken) {
            return res.status(401).json({ error: 'Unauthorized. Please login first' });
        }

        const { id } = req.params;
        const streams = await stravaService.fetchActivityStreams(accessToken, id);
        res.json(streams);
    } catch (err) {
        logger.error(`Failed to fetch streams for activity ${req.params.id}: ${err.message}`, err);
        if (err.response && err.response.status === 401) {
            return res.status(401).json({ error: 'Strava access token expired' });
        }
        if (err.response && err.response.status === 404) {
            return res.status(404).json({ error: 'Strava streams not found for this activity' });
        }
        res.status(500).json({ error: 'Failed to fetch activity streams from Strava' });
    }
};

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            logger.error(`Session destroy failed during logout: ${err.message}`, err);
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ message: 'Successfully logged out' });
    });
};

module.exports = {
    login,
    callback,
    getActivities,
    getActivityById,
    getActivityStreams,
    logout
};
