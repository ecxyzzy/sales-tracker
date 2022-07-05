import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as mysql2 from 'mysql2';
import { preHashPassword } from '../src/helper';
import { authKey } from '../src/secrets';

const db = mysql2
    .createConnection({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        multipleStatements: true,
    })
    .promise();

export async function mochaGlobalSetup() {
    const query = fs
        .readFileSync('./create_db.sql')
        .toString()
        .split('\n')
        .map((x) => x.replace('    ', ''))
        .join('');
    await db.query(query);
    const adminPass = await bcrypt.hash(await preHashPassword(authKey, 'admin'), 10);
    const handlerPass = await bcrypt.hash(await preHashPassword(authKey, 'handler'), 10);
    const userPass = await bcrypt.hash(await preHashPassword(authKey, 'user'), 10);
    await db.query(
        "INSERT INTO users VALUES (DEFAULT, 'admin', ?, 1, 1), (DEFAULT, 'handler', ?, 0, 1), (DEFAULT, 'user', ?, 0, 0)",
        [adminPass, handlerPass, userPass]
    );
}
