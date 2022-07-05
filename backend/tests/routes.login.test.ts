import { assert } from 'chai';
import { httpCodes } from '../src/helper';
import request from './request';

describe('/login', function () {
    describe('POST /login', function () {
        it('returns 400 for missing username', function (done) {
            request
                .post('/login')
                .send({})
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 400);
                    assert.equal(body.error, httpCodes[400]);
                    assert.equal(body.message, 'Username not provided');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 400 for missing password', function (done) {
            request
                .post('/login')
                .send({ username: 'foo' })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 400);
                    assert.equal(body.error, httpCodes[400]);
                    assert.equal(body.message, 'Password not provided');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns 401 for incorrect credentials', function (done) {
            request
                .post('/login')
                .send({ username: 'nonexistent', password: 'nonexistent' })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(401)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 401);
                    assert.equal(body.error, httpCodes[401]);
                    assert.equal(body.message, 'Invalid username or password');
                    done();
                })
                .catch((e) => done(e));
        });
        it('returns json containing token for valid credentials', function (done) {
            request
                .post('/login')
                .send({ username: 'user', password: 'user' })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .then((res) => {
                    const body = res.body;
                    assert.property(body, 'timestamp');
                    assert.equal(body.status, 200);
                    assert.property(body.payload, 'token');
                    done();
                })
                .catch((e) => done(e));
        });
    });
});
