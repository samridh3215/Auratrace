const stravaService = require('./strava.service');

const login = (req, res) => {
    const authUrl = stravaService.getAuthUrl();
    res.redirect(authUrl);
};

const callback = async (req, res) => {
    try {
        const { code, error } = req.query;

        if (error) {
            return res.status(403).json({ error: 'Authorization failed', details: error });
        }

        if (!code) {
            return res.status(400).json({ error: 'Authorization code missing' });
        }

        // Exchange code for access token
        const tokenData = await stravaService.exchangeCodeForToken(code);

        // Save tokens in session
        req.session.stravaAuth = {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: tokenData.expires_at,
            athlete: tokenData.athlete
        };

        // Redirect to frontend on successful authentication
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
        res.redirect(`${frontendUrl}/dashboard`);
    } catch (err) {
        console.error('Error during Strava OAuth callback:', err.message);
        res.status(500).json({ error: 'Internal Server Error during authentication' });
    }
};

const getActivities = async (req, res) => {
    try {
        const { stravaAuth } = req.session;

        if (!stravaAuth || !stravaAuth.accessToken) {
            return res.status(401).json({ error: 'Unauthorized. Please authenticate via /api/v1/strava/login first' });
        }

        const activities = await stravaService.fetchActivities(stravaAuth.accessToken);

        res.json({ count: activities.length, activities });
    } catch (err) {
        console.error('Error fetching Strava activities:', err.message);
        res.status(500).json({ error: 'Failed to fetch activities from Strava' });
    }
};

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session during logout:', err);
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ message: 'Successfully logged out' });
    });
};

module.exports = {
    login,
    callback,
    getActivities,
    logout
};
