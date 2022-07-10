import pino from 'pino';

const devSettings = {
    level: 'debug',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
        },
    },
};

const testSettings = {
    level: 'fatal',
    transport: {
        target: 'pino/file',
        options: {
            destination: '/dev/null',
        },
    },
};

const prodSettings = {
    level: 'info',
    transport: {
        target: 'pino/file',
        options: {
            destination: process.env.LOG_PATH_PROD,
            mkdir: true,
        },
    },
};

let p: pino.Logger;
switch (process.env.NODE_ENV) {
    case 'development':
        p = pino(devSettings);
        break;
    case 'testing':
        p = pino(testSettings);
        break;
    case 'production':
        p = pino(prodSettings);
        break;
}

export default p;
