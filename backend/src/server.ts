import 'dotenv/config';
import bodyParser from 'body-parser';
import express, { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import http from 'http';
import https from 'https';
import pinoHttp from 'pino-http';
import { sendError } from './helper';
import logger from './logger';
import router from './router';
import { httpsCert, httpsKey } from './secrets';

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
app.use(router);
app.use((req, res, next) => {
    if (!(process.env.NODE_ENV === 'development' || req.secure)) {
        return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
});
app.use((err: ErrorRequestHandler, req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'UnauthorizedError') {
        logger.info(`Unauthorized access attempt with token ${req.headers['authorization']} from ${req.ip}`);
        return sendError(res, 401, 'Invalid token');
    }
    next(err);
});

// HTTP(S) configuration
const httpServer = http.createServer(app);
const httpsServer = https.createServer(
    {
        cert: httpsCert,
        key: httpsKey,
    },
    app
);
httpServer.listen(process.env.HTTP_PORT, () => {
    logger.info(`sales-tracker-backend HTTP server listening on port ${process.env.HTTP_PORT}`);
});
httpsServer.listen(process.env.HTTPS_PORT, () => {
    logger.info(`sales-tracker-backend HTTPS server listening on port ${process.env.HTTPS_PORT}`);
});

export default app;
