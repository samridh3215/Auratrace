const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
    const start = Date.now();
    const { method, originalUrl, ip } = req;

    logger.info(`→ ${method} ${originalUrl} - ${ip}`);

    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const msg = `← ${method} ${originalUrl} - ${status} - ${duration}ms`;

        if (status >= 500) logger.error(msg);
        else if (status >= 400) logger.warn(msg);
        else logger.info(msg);
    });

    next();
};

module.exports = requestLogger;
