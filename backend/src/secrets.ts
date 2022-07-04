import fs from 'fs';

const authKey = fs.readFileSync(process.env.AUTH_KEY_PATH, 'utf-8')
const httpsCert = fs.readFileSync(process.env.HTTPS_CERT_PATH, 'utf-8');
const httpsKey = fs.readFileSync(process.env.HTTPS_KEY_PATH, 'utf-8');

export { authKey, httpsCert, httpsKey };
