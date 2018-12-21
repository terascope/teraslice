'use strict';

const nock = require('nock');
const path = require('path');
const fs = require('fs');
const Assets = require('../lib/assets');

describe('Teraslice Assets', () => {
    let assets;
    let scope;

    beforeEach(() => {
        assets = new Assets({
            baseUrl: 'http://teraslice.example.dev'
        });
        scope = nock('http://teraslice.example.dev');
    });

    afterEach(() => {
        nock.cleanAll();
    });

    describe('->post', () => {
        describe('when called with nothing', () => {
            let err;

            beforeEach((done) => {
                assets.post()
                    .then(fail)
                    .catch((_err) => {
                        err = _err;
                        done();
                    });
            });

            it('should reject with asset stream validation error', () => {
                expect(err.toString()).toEqual('Error: Asset stream must not be empty');
            });
        });

        describe('when called with a string', () => {
            let result;
            beforeEach((done) => {
                const contents = 'example-input';
                scope.post('/assets', contents)
                    .reply(200, { _id: 'some-asset-id' });

                assets.post(contents)
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve the json result from Teraslice', () => {
                expect(result).toEqual({ _id: 'some-asset-id' });
            });
        });

        describe('when called with a stream', () => {
            let result;

            beforeEach((done) => {
                const testFilePath = path.join(__dirname, 'fixtures', 'test.txt');
                const contents = fs.readFileSync(testFilePath, 'utf-8');
                scope.post('/assets', body => contents === body)
                    .reply(200, { _id: 'some-asset-id' });

                assets.post(fs.createReadStream(testFilePath))
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve the json result from Teraslice', () => {
                expect(result).toEqual({ _id: 'some-asset-id' });
            });
        });
    });

    describe('->delete', () => {
        describe('when called with nothing', () => {
            let err;

            beforeEach((done) => {
                assets.delete()
                    .then(fail)
                    .catch((_err) => {
                        err = _err;
                        done();
                    });
            });

            it('should reject with id validation error', () => {
                expect(err.toString()).toEqual('Error: Asset delete requires a ID');
            });
        });

        describe('when called an id', () => {
            let result;

            beforeEach((done) => {
                scope.delete('/assets/some-asset-id')
                    .reply(200, { ok: true });

                assets.delete('some-asset-id')
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve the json result from Teraslice', () => {
                expect(result).toEqual({ ok: true });
            });
        });
    });
});
