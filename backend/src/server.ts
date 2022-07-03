import 'dotenv/config';
import bodyParser from 'body-parser';
import express, { Express } from 'express';
import pinoHttp from 'pino-http';
import fs from 'fs';
import http from 'http';
import https from 'https';
import logging from './logging';

// helper function to warn of the perils of running without HTTPS
function warnNoHTTPS(msg: string) {
    logging.warn(msg);
    logging.warn('HTTPS will not be enabled.');
    logging.warn('This is a potential security risk, as all passwords will be transmitted over cleartext.');
}

// express configuration
const app: Express = express();
app.use(bodyParser.json());
app.use(pinoHttp({
    logger: logging,
    useLevel: 'debug',
    autoLogging: true,
}));

// HTTP(S) configuration
const httpServer: http.Server = http.createServer(app);
httpServer.listen(process.env.HTTP_PORT, () => {
    logging.info(`sales-tracker-backend HTTP server listening on port ${process.env.HTTP_PORT}`);
});
let httpsServer: https.Server;
if (process.env.HTTPS_PORT && process.env.HTTPS_CERT_PATH && process.env.HTTPS_KEY_PATH) {
    try {
        httpsServer = https.createServer({
            cert: fs.readFileSync(process.env.HTTPS_CERT_PATH, 'utf-8'),
            key: fs.readFileSync(process.env.HTTPS_KEY_PATH, 'utf-8')
        }, app);
        httpsServer.listen(process.env.HTTPS_PORT, () => {
            logging.info(`sales-tracker-backend HTTPS server listening on port ${process.env.HTTPS_PORT}`);
        });
    } catch (e) {
        warnNoHTTPS(`The HTTPS 
        ${e.path === process.env.HTTPS_CERT_PATH ? 'certificate' : 'private key'} could not be read.`);
    }

} else {
    warnNoHTTPS('One or more settings required for HTTPS were not found in the configuration file.');
}
