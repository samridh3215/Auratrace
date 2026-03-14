const axios = require('axios');

const getAuthUrl = () => {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const redirectUri = process.env.STRAVA_REDIRECT_URI;
    // activity:read_all scope needed to list activities
    const scope = 'read,activity:read_all';

    return `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&approval_prompt=force`;
};

const exchangeCodeForToken = async (code) => {
    const url = 'https://www.strava.com/oauth/token';

    const payload = {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
    };

    const response = await axios.post(url, payload);
    return response.data; // Includes access_token, refresh_token, athlete data
};

const fetchActivities = async (accessToken) => {
    const url = 'https://www.strava.com/api/v3/athlete/activities';

    const config = {
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        params: {
            per_page: 30 // Defaulting to 30 activities
        }
    };

    const response = await axios.get(url, config);
    return response.data;
};

module.exports = {
    getAuthUrl,
    exchangeCodeForToken,
    fetchActivities
};
