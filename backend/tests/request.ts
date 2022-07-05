import app from '../src/server';
import * as request from 'supertest';

export default request.agent(app);
