import 'dotenv/config';
import bodyParser from 'body-parser';
import express from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import pinoHttp from 'pino-http';
import logger from './logger';
import router from './router';

// check HTTPS configuration
if (!(process.env.HTTPS_PORT && process.env.HTTPS_CERT_PATH && process.env.HTTPS_KEY_PATH)) {
    throw new Error('One or more settings required for HTTPS were not found in the configuration file.');
}

// express configuration
const app = express();
app.enable('trust proxy');
app.use(bodyParser.json());
app.use(
    pinoHttp({
        logger: logger,
        useLevel: 'debug',
        autoLogging: true,
    })
);
app.use('/', router);
app.use((req, res, next) => {
    if (!(process.env.NODE_ENV === 'development' || req.secure)) {
        return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
});

// HTTP(S) configuration
const httpServer = http.createServer(app);
const httpsServer = https.createServer(
    {
        cert: fs.readFileSync(process.env.HTTPS_CERT_PATH, 'utf-8'),
        key: fs.readFileSync(process.env.HTTPS_KEY_PATH, 'utf-8'),
    },
    app
);
httpServer.listen(process.env.HTTP_PORT, () => {
    logger.info(`sales-tracker-backend HTTP server listening on port ${process.env.HTTP_PORT}`);
});
httpsServer.listen(process.env.HTTPS_PORT, () => {
    logger.info(`sales-tracker-backend HTTPS server listening on port ${process.env.HTTPS_PORT}`);
});
