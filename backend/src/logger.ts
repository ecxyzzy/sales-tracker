import 'dotenv/config';
import pino from 'pino';

const devSettings = {
    level: 'debug', transport: {
        target: 'pino-pretty', options: {
            colorize: true, translateTime: 'SYS:standard'
        }
    }
};

const prodSettings = {
    level: 'info', transport: {
        target: 'pino/file', options: {
            destination: process.env.LOG_PATH_PROD, mkdir: true
        }
    }
};

export default pino(process.env.NODE_ENV === 'development' ? devSettings : prodSettings);
