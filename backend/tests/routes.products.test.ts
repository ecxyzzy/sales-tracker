import { assert } from 'chai';
import { httpCodes } from '../src/helper';
import request from './request';

describe('/products', function () {
    let handlerToken: string;
    let userToken: string;
    before('get login tokens', async function () {
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
    describe('POST /products/create', function () {
        it('returns 403 for missing token', function (done) {
            request
                .post('/products/create')
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
                .post('/products/create')
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
        it('returns 400 for missing productName', function (done) {
            request
                .post('/products/create')
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
                    assert.equal(body.message, 'Product name not provided');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 200 for new entry', function (done) {
            request
                .post('/products/create')
                .send({ productName: 'Foo' })
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
        it('returns 409 for duplicate entry', function (done) {
            request
                .post('/products/create')
                .send({ productName: 'Foo' })
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${handlerToken}`)
                .expect('Content-Type', /json/)
                .expect(409)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 409);
                    assert.equal(body.error, httpCodes[409]);
                    assert.equal(body.message, 'Product with that name already exists');
                    done();
                })
                .catch((e) => done(e));
        });
    });
    describe('GET /products/get', function () {
        it('returns json containing added product', function (done) {
            request
                .get('/products/get')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${userToken}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 200);
                    assert.lengthOf(body.payload, 1);
                    assert.deepEqual(body.payload[0], { pid: 1, productName: 'Foo' });
                    done();
                })
                .catch((e) => done(e));
        });
    });
    describe('POST /products/update', function () {
        it('returns 400 for missing pid', function (done) {
            request
                .post('/products/update')
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
                    assert.equal(body.message, 'Product ID not provided');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 404 for nonexistent product', function (done) {
            request
                .post('/products/update')
                .send({ pid: -1 })
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${handlerToken}`)
                .expect('Content-Type', /json/)
                .expect(404)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 404);
                    assert.equal(body.error, httpCodes[404]);
                    assert.equal(body.message, 'Product does not exist');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 200 for updated product', function (done) {
            request
                .post('/products/update')
                .send({ pid: 1, productName: 'Bar' })
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
        it('product update is persistent', function (done) {
            request
                .get('/products/get')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${handlerToken}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((res1) => {
                    const body = res1.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 200);
                    assert.lengthOf(body.payload, 1);
                    assert.deepEqual(body.payload[0], { pid: 1, productName: 'Bar' });
                    done();
                })
                .catch((e) => done(e));
        });
    });
    describe('POST /products/delete', function () {
        it('returns 400 for missing pid', function (done) {
            request
                .post('/products/delete')
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
                    assert.equal(body.message, 'Product ID not provided');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 404 for nonexistent product', function (done) {
            request
                .post('/products/delete')
                .send({ pid: -1 })
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${handlerToken}`)
                .expect('Content-Type', /json/)
                .expect(404)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 404);
                    assert.equal(body.error, httpCodes[404]);
                    assert.equal(body.message, 'Product does not exist');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 200 for deleted product', function (done) {
            request
                .post('/products/delete')
                .send({ pid: 1 })
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
        it('product deletion is persistent', function (done) {
            request
                .get('/products/get')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${handlerToken}`)
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
