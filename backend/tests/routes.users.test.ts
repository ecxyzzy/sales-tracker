import { assert } from 'chai';
import request from './request';
import { httpCodes } from '../src/helper';

describe('/users', function () {
    let adminToken: string;
    let userToken: string;
    before('get login tokens', async function () {
        adminToken = (
            await request
                .post('/login')
                .send({ username: 'admin', password: 'admin' })
                .set('Accept', 'application/json')
        ).body.payload.token;
        userToken = (
            await request.post('/login').send({ username: 'user', password: 'user' }).set('Accept', 'application/json')
        ).body.payload.token;
    });
    describe('POST /users/create', function () {
        it('returns 403 for missing token', function (done) {
            request
                .post('/users/create')
                .send({})
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(403)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 403);
                    assert.equal(body.error, httpCodes[403]);
                    assert.equal(body.message, 'Invalid token');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 403 for underprivileged token', function (done) {
            request
                .post('/users/create')
                .send({})
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${userToken}`)
                .expect('Content-Type', /json/)
                .expect(403)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 403);
                    assert.equal(body.error, httpCodes[403]);
                    assert.equal(body.message, 'Insufficient permissions');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 400 for missing fields', function (done) {
            request
                .post('/users/create')
                .send({})
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect('Content-Type', /json/)
                .expect(400)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 400);
                    assert.equal(body.error, httpCodes[400]);
                    assert.property(body, 'timestamp');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 200 for new entry', function (done) {
            request
                .post('/users/create')
                .send({
                    username: 'testUser',
                    password: 'testPass',
                    isAdmin: 0,
                    isHandler: 0,
                })
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 200);
                    done();
                })
                .catch((e) => done(e));
        });
    });
    describe('GET /users/get', function () {
        it('returns json containing added transaction', function (done) {
            request
                .get('/users/get')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${userToken}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 200);
                    assert.lengthOf(body.payload, 4);
                    done();
                })
                .catch((e) => done(e));
        });
    });
    describe('POST /users/update', function () {
        it('returns 400 for missing uid', function (done) {
            request
                .post('/users/update')
                .send({})
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect('Content-Type', /json/)
                .expect(400)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 400);
                    assert.equal(body.error, httpCodes[400]);
                    assert.equal(body.message, 'User ID not provided');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 404 for nonexistent user', function (done) {
            request
                .post('/users/update')
                .send({ uid: -1 })
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect('Content-Type', /json/)
                .expect(404)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 404);
                    assert.equal(body.error, httpCodes[404]);
                    assert.equal(body.message, 'User does not exist');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 200 for updated user', function (done) {
            request
                .post('/users/update')
                .send({ uid: 4, username: 'newUser' })
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 200);
                    done();
                })
                .catch((e) => done(e));
        });
        it('user update is persistent', function (done) {
            request
                .get('/users/get')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${userToken}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((res1) => {
                    const body = res1.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 200);
                    assert.lengthOf(body.payload, 4);
                    assert.equal(body.payload[3].username, 'newUser');
                    done();
                })
                .catch((e) => done(e));
        });
    });
    describe('POST /users/delete', function () {
        it('returns 400 for missing uid', function (done) {
            request
                .post('/users/delete')
                .send({})
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect('Content-Type', /json/)
                .expect(400)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 400);
                    assert.equal(body.error, httpCodes[400]);
                    assert.equal(body.message, 'User ID not provided');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 404 for nonexistent user', function (done) {
            request
                .post('/users/delete')
                .send({ uid: -1 })
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect('Content-Type', /json/)
                .expect(404)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 404);
                    assert.equal(body.error, httpCodes[404]);
                    assert.equal(body.message, 'User does not exist');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 200 for deleted user', function (done) {
            request
                .post('/users/delete')
                .send({ uid: 4 })
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 200);
                    done();
                })
                .catch((e) => done(e));
        });
        it('user deletion is persistent', function (done) {
            request
                .get('/users/get')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${userToken}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((res1) => {
                    const body = res1.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 200);
                    assert.lengthOf(body.payload, 3);
                    done();
                })
                .catch((e) => done(e));
        });
     });
});
