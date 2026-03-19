const axios = require('axios');
const logger = require('../../utils/logger');

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

    logger.info('Strava API → POST /oauth/token');
    const start = Date.now();
    const response = await axios.post(url, payload);
    logger.info(`Strava API ← POST /oauth/token - 200 - ${Date.now() - start}ms`);
    return response.data;
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

    logger.info('Strava API → GET /athlete/activities');
    const start = Date.now();
    const response = await axios.get(url, config);
    const allowedTypes = ['Run', 'Walk', 'Ride'];
    const filteredActivities = response.data.filter(activity =>
        allowedTypes.includes(activity.type)
    );
    logger.info(`Strava API ← GET /athlete/activities - 200 - ${Date.now() - start}ms - ${filteredActivities.length} activities`);
    return filteredActivities;
};

const fetchActivityById = async (accessToken, activityId) => {
    const url = `https://www.strava.com/api/v3/activities/${activityId}`;

    const config = {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    };

    logger.info(`Strava API → GET /activities/${activityId}`);
    const start = Date.now();
    const response = await axios.get(url, config);
    logger.info(`Strava API ← GET /activities/${activityId} - 200 - ${Date.now() - start}ms`);
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

    logger.info(`Strava API → GET /activities/${activityId}/streams`);
    const start = Date.now();
    const response = await axios.get(url, config);
    logger.info(`Strava API ← GET /activities/${activityId}/streams - 200 - ${Date.now() - start}ms`);
    return response.data;
};

module.exports = {
    getAuthUrl,
    exchangeCodeForToken,
    fetchActivities,
    fetchActivityById,
    fetchActivityStreams
};
