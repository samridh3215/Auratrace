const express = require('express');

const router = express.Router();

// v2 routes will be added here
router.get('/', (req, res) => {
    res.json({ message: 'AuraTrace API v2' });
});

module.exports = router;
