const axios = require('axios');

const getAuthUrl = (state) => {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const redirectUri = process.env.STRAVA_REDIRECT_URI;
    // activity:read_all scope needed to list activities
    const scope = 'read,activity:read_all';

    let url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&approval_prompt=force`;

    if (state) {
        url += `&state=${encodeURIComponent(state)}`;
    }

    return url;
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
            per_page: 50 // Increased to 50 to ensure we get enough after filtering
        }
    };

    const response = await axios.get(url, config);

    // Filter to only include specific types
    const allowedTypes = ['Run', 'Walk', 'Ride'];
    const filteredActivities = response.data.filter(activity =>
        allowedTypes.includes(activity.type)
    );

    return filteredActivities;
};

const fetchActivityById = async (accessToken, activityId) => {
    const url = `https://www.strava.com/api/v3/activities/${activityId}`;

    const config = {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    };

    const response = await axios.get(url, config);
    return response.data;
};

const fetchActivityStreams = async (accessToken, activityId, keys = 'time,distance,latlng,altitude,velocity_smooth,heartrate,cadence,watts,temp,moving,grade_smooth') => {
    const url = `https://www.strava.com/api/v3/activities/${activityId}/streams`;

    const config = {
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        params: {
            keys: keys,
            key_by_type: true
        }
    };

    const response = await axios.get(url, config);
    return response.data;
};

module.exports = {
    getAuthUrl,
    exchangeCodeForToken,
    fetchActivities,
    fetchActivityById,
    fetchActivityStreams
};
