import bodyParser from 'body-parser';
import express, { Express } from 'express';
import pinoHttp from 'pino-http';
import fs from 'fs';
import http from 'http';
import https from 'https';
import config from './config';
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
httpServer.listen(config.httpConfig.httpPort, () => {
    logging.info(`sales-tracker-backend HTTP server listening on port ${config.httpConfig.httpPort}`);
});
let httpsServer: https.Server;
if (config.httpConfig.httpsPort && config.httpConfig.httpsCertificatePath && config.httpConfig.httpsPrivateKeyPath) {
    try {
        httpsServer = https.createServer({
            cert: fs.readFileSync(config.httpConfig.httpsCertificatePath),
            key: fs.readFileSync(config.httpConfig.httpsPrivateKeyPath)
        }, app);
        httpsServer.listen(config.httpConfig.httpsPort, () => {
            logging.info(`sales-tracker-backend HTTPS server listening on port ${config.httpConfig.httpsPort}`);
        });
    } catch (e) {
        warnNoHTTPS(`The HTTPS 
        ${e.path === config.httpConfig.httpsCertificatePath ? 'certificate' : 'private key'} could not be read.`);
    }

} else {
    warnNoHTTPS('One or more settings required for HTTPS were not found in the configuration file.');
}
