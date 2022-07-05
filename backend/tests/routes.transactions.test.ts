import { assert } from 'chai';
import request from './request';
import { httpCodes } from '../src/helper';

describe('/transactions', function () {
    let adminToken: string;
    let handlerToken: string;
    let userToken: string;
    let date: number;
    let pid: number;
    before('get login tokens', async function () {
        adminToken = (
            await request
                .post('/login')
                .send({ username: 'admin', password: 'admin' })
                .set('Accept', 'application/json')
        ).body.payload.token;
        handlerToken = (
            await request
                .post('/login')
                .send({ username: 'handler', password: 'handler' })
                .set('Accept', 'application/json')
        ).body.payload.token;
        userToken = (
            await request.post('/login').send({ username: 'user', password: 'user' }).set('Accept', 'application/json')
        ).body.payload.token;
    });
    before('set timestamp', function (done) {
        date = Date.now();
        done();
    });
    before('create product', async function () {
        await request
            .post('/products/create')
            .send({ productName: 'Balls' })
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${handlerToken}`);
        const payload = (
            await request
                .get('/products/get')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${userToken}`)
        ).body.payload;
        pid = payload.filter((x: Record<string, string>) => x['productName'] === 'Balls')[0].pid;
    });
    describe('POST /transactions/create', function () {
        it('returns 403 for missing token', function (done) {
            request
                .post('/transactions/create')
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
                .post('/transactions/create')
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
                .post('/transactions/create')
                .send({})
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${handlerToken}`)
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
                .post('/transactions/create')
                .send({
                    transactionDate: date,
                    product: pid,
                    transactionCount: 123.45,
                    price: 567.89,
                    actualTotal: 70106.02,
                    handler1: 1,
                })
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${handlerToken}`)
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
    describe('GET /transactions/get', function () {
        it('returns json containing added transaction', function (done) {
            request
                .get('/transactions/get')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${userToken}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 200);
                    assert.lengthOf(body.payload, 1);
                    done();
                })
                .catch((e) => done(e));
        });
    });
    describe('POST /transactions/update', function () {
        it('returns 400 for missing tid', function (done) {
            request
                .post('/transactions/update')
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
                    assert.equal(body.message, 'Transaction ID not provided');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 404 for nonexistent transaction', function (done) {
            request
                .post('/transactions/update')
                .send({ tid: -1 })
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect('Content-Type', /json/)
                .expect(404)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 404);
                    assert.equal(body.error, httpCodes[404]);
                    assert.equal(body.message, 'Transaction does not exist');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 200 for updated transaction', function (done) {
            request
                .post('/transactions/update')
                .send({ tid: 1, remarks: 'This is a remark' })
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
        it('transaction update is persistent', function (done) {
            request
                .get('/transactions/get')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${userToken}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((res1) => {
                    const body = res1.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 200);
                    assert.lengthOf(body.payload, 1);
                    assert.equal(body.payload[0].remarks, 'This is a remark');
                    done();
                })
                .catch((e) => done(e));
        });
    });
    describe('POST /transactions/delete', function () {
        it('returns 400 for missing tid', function (done) {
            request
                .post('/transactions/delete')
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
                    assert.equal(body.message, 'Transaction ID not provided');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 404 for nonexistent product', function (done) {
            request
                .post('/transactions/delete')
                .send({ tid: -1 })
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect('Content-Type', /json/)
                .expect(404)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 404);
                    assert.equal(body.error, httpCodes[404]);
                    assert.equal(body.message, 'Transaction does not exist');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 200 for deleted product', function (done) {
            request
                .post('/transactions/delete')
                .send({ tid: 1 })
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
        it('product deletion is persistent', function (done) {
            request
                .get('/transactions/get')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${userToken}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((res1) => {
                    const body = res1.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 200);
                    assert.lengthOf(body.payload, 0);
                    done();
                })
                .catch((e) => done(e));
        });
    });
});
