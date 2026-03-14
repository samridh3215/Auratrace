const jwt = require('jsonwebtoken');
const stravaService = require('./strava.service');

const login = (req, res) => {
    // Determine if the request is from a mobile app or web
    const device = req.query.device || 'web'; // 'web' or 'mobile'
    const authUrl = stravaService.getAuthUrl(device);
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

        // If mobile, redirect to deep link scheme
        if (state === 'mobile') {
            const scheme = process.env.APP_SCHEME || 'auratrace';
            return res.redirect(`${scheme}://dashboard?token=${userToken}`);
        }

        // TODO: Update FRONTEND_URL in .env when hosting the frontend (e.g., on Vercel)
        // Otherwise redirect to web frontend with token in fragment (or query)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
        res.redirect(`${frontendUrl}/dashboard?token=${userToken}`);
    } catch (err) {
        console.error('--- STRAVA AUTH ERROR ---');
        console.error('Message:', err.message);
        if (err.response) {
            console.error('Strava API Response Data:', err.response.data);
            console.error('Strava API Response Status:', err.response.status);
        }
        console.error('--------------------------');
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
