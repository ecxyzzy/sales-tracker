import mysql from 'mysql';
import config from './config';

const connectionUri = config.dbConfig;
if (!connectionUri.supportBigNumbers) {
    connectionUri.supportBigNumbers = true;
}
if (!connectionUri.bigNumberStrings) {
    connectionUri.supportBigNumbers = true;
}

const connection: mysql.Connection = mysql.createConnection(connectionUri);

export default connection;
