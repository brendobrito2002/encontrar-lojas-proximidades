const { createLogger, transports, format } = require('winston');
const path = require('path');

const logger = createLogger({
    format: format.combine(
        format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
        format.json()
    ),
    transports: [
        new transports.File({ filename: path.join('logs/combined.log'), level: 'info'}),
        new transports.File({ filename: path.join('logs/errors.log'), level: 'error'})
    ]
});

module.exports = logger;