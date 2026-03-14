const express = require('express');
const cors = require('cors');
const session = require('express-session');
const v1Routes = require('./api/v1');
const v2Routes = require('./api/v2');

const app = express();

const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:8081',
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// API Routes
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// Base route
app.get('/', (req, res) => {
    res.json({ message: 'AuraTrace API is running.' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
