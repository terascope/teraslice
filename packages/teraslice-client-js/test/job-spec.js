'use strict';

const nock = require('nock');
const Job = require('../lib/job');

describe('Teraslice Job', () => {
    let scope;
    const baseUrl = 'http://teraslice.example.dev';

    beforeEach(() => {
        scope = nock(baseUrl);
    });

    afterEach(() => {
        scope = null;
        nock.cleanAll();
    });


    describe('->id', () => {
        describe('when constructed without a jobId', () => {
            it('should throw an error', () => {
                expect(() => new Job()).toThrowError('Job requires jobId');
            });
        });

        describe('when constructed with a invalid jobId', () => {
            it('should throw an error', () => {
                expect(() => new Job({}, { invalid: true })).toThrowError('Job requires jobId to be a string');
            });
        });

        describe('when constructed with a jobId', () => {
            let job;

            beforeEach(() => {
                job = new Job({}, 'some-job-id');
            });

            it('should return the jobId', () => {
                expect(job.id()).toEqual('some-job-id');
            });
        });
    });

    describe('->slicer', () => {
        describe('when called with nothing', () => {
            let result;
            beforeEach((done) => {
                scope.get('/jobs/some-job-id/slicer')
                    .reply(200, {
                        id: 'example'
                    });

                new Job({ baseUrl }, 'some-job-id').slicer()
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(result).toEqual({
                    id: 'example'
                });
            });
        });
    });

    ['start', 'stop', 'pause', 'resume'].forEach((method) => {
        describe(`->${method}`, () => {
            describe('when called with nothing', () => {
                let result;
                beforeEach((done) => {
                    scope.post(`/jobs/some-job-id/_${method}`)
                        .reply(200, {
                            id: 'example'
                        });

                    new Job({ baseUrl }, 'some-job-id')[method]()
                        .then((_result) => {
                            result = _result;
                            done();
                        }).catch(fail);
                });

                it('should resolve json result from Teraslice', () => {
                    expect(result).toEqual({
                        id: 'example'
                    });
                });
            });

            describe('when called with a query', () => {
                let result;
                beforeEach((done) => {
                    scope.post(`/jobs/some-job-id/_${method}`)
                        .query({ someParam: 'yes' })
                        .reply(200, {
                            key: 'some-other-key'
                        });

                    new Job({ baseUrl }, 'some-job-id')[method]({ someParam: 'yes' })
                        .then((_result) => {
                            result = _result;
                            done();
                        }).catch(fail);
                });

                it('should resolve json result from Teraslice', () => {
                    expect(result).toEqual({
                        key: 'some-other-key'
                    });
                });
            });
        });
    });

    describe('->recover', () => {
        beforeEach(() => {
            scope.get('/jobs/some-job-id/ex')
                .reply(200, {
                    ex_id: 'some-ex-id'
                });
        });

        describe('when called with nothing', () => {
            let result;
            beforeEach((done) => {
                scope.post('/ex/some-ex-id/_recover')
                    .reply(200, {
                        id: 'example'
                    });

                new Job({ baseUrl }, 'some-job-id')
                    .recover()
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(result).toEqual({
                    id: 'example'
                });
            });
        });

        describe('when called with a query', () => {
            let result;
            beforeEach((done) => {
                scope.post('/ex/some-ex-id/_recover')
                    .query({ cleanup: 'errors' })
                    .reply(200, {
                        key: 'some-other-key'
                    });

                new Job({ baseUrl }, 'some-job-id')
                    .recover({ cleanup: 'errors' })
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(result).toEqual({
                    key: 'some-other-key'
                });
            });
        });
    });

    describe('->ex', () => {
        describe('when called with nothing', () => {
            let result;
            beforeEach((done) => {
                scope.get('/jobs/some-job-id/ex')
                    .reply(200, {
                        ex_id: 'example-ex-id'
                    });

                new Job({ baseUrl }, 'some-job-id')
                    .ex()
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(result).toEqual('example-ex-id');
            });
        });
    });

    describe('->status', () => {
        describe('when called with nothing', () => {
            let result;
            beforeEach((done) => {
                scope.get('/jobs/some-job-id/ex')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: 'example'
                    });

                new Job({ baseUrl }, 'some-job-id')
                    .status()
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(result).toEqual('example');
            });
        });
    });

    describe('->spec', () => {
        describe('when called with nothing', () => {
            let result;
            beforeEach((done) => {
                scope.get('/jobs/some-job-id')
                    .reply(200, {
                        jobId: 'example-job-id',
                        example: 'job-spec'
                    });

                new Job({ baseUrl }, 'some-job-id')
                    .spec()
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(result).toEqual({
                    jobId: 'example-job-id',
                    example: 'job-spec'
                });
            });
        });
    });

    describe('->errors', () => {
        describe('when called with nothing', () => {
            let result;
            beforeEach((done) => {
                scope.get('/jobs/some-job-id/errors')
                    .reply(200, [
                        { error: 'example' },
                        { error: 'example-2' }
                    ]);

                new Job({ baseUrl }, 'some-job-id')
                    .errors()
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(result).toEqual([
                    { error: 'example' },
                    { error: 'example-2' }
                ]);
            });
        });
    });

    describe('->workers', () => {
        describe('when called and the state has workers', () => {
            let results;
            beforeEach((done) => {
                scope.get('/cluster/state')
                    .reply(200, {
                        'some-node-id': {
                            node_id: 'some-node-id',
                            active: [
                                {
                                    job_id: 'some-job-id',
                                    assignment: 'worker'
                                },
                                {
                                    job_id: 'some-job-id',
                                    assignment: 'worker'
                                }
                            ]
                        },
                        'some-other-node-id': {
                            node_id: 'some-other-node-id',
                            active: [
                                {
                                    job_id: 'some-job-id',
                                    assignment: 'worker'
                                },
                                {
                                    job_id: 'some-other-job-id',
                                    assignment: 'worker'
                                },
                                {
                                    job_id: 'some-other-job-id',
                                    assignment: 'execution_controller'
                                }
                            ]
                        }
                    });

                new Job({ baseUrl }, 'some-job-id')
                    .workers()
                    .then((_results) => {
                        results = _results;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(results).toEqual([
                    {
                        node_id: 'some-node-id',
                        job_id: 'some-job-id',
                        assignment: 'worker'
                    },
                    {
                        node_id: 'some-node-id',
                        job_id: 'some-job-id',
                        assignment: 'worker'
                    },
                    {
                        node_id: 'some-other-node-id',
                        job_id: 'some-job-id',
                        assignment: 'worker'
                    },
                ]);
            });
        });
    });

    describe('->changeWorkers', () => {
        describe('when called with add and num', () => {
            let result;
            beforeEach((done) => {
                scope.post('/jobs/some-job-id/_workers')
                    .query({ add: 2 })
                    .reply(200, 'Changed workers!');

                new Job({ baseUrl }, 'some-job-id')
                    .changeWorkers('add', 2)
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(result).toEqual('Changed workers!');
            });
        });

        describe('when called with remove and num', () => {
            let result;
            beforeEach((done) => {
                scope.post('/jobs/some-job-id/_workers')
                    .query({ remove: 2 })
                    .reply(200, 'Changed workers!');

                new Job({ baseUrl }, 'some-job-id')
                    .changeWorkers('remove', 2)
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(result).toEqual('Changed workers!');
            });
        });

        describe('when called with total and num', () => {
            let result;
            beforeEach((done) => {
                scope.post('/jobs/some-job-id/_workers')
                    .query({ total: 2 })
                    .reply(200, 'Changed workers!');

                new Job({ baseUrl }, 'some-job-id')
                    .changeWorkers('total', 2)
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(result).toEqual('Changed workers!');
            });
        });

        describe('when called with nothing', () => {
            let err;
            beforeEach((done) => {
                new Job({ baseUrl }, 'some-job-id')
                    .changeWorkers()
                    .then(fail)
                    .catch((_err) => {
                        err = _err;
                        done();
                    });
            });

            it('should reject with an error', () => {
                expect(err.toString()).toEqual('Error: changeWorkers requires action and count');
            });
        });

        describe('when called with an invalid action', () => {
            let err;
            beforeEach((done) => {
                new Job({ baseUrl }, 'some-job-id')
                    .changeWorkers('invalid', 2)
                    .then(fail)
                    .catch((_err) => {
                        err = _err;
                        done();
                    });
            });

            it('should reject with an error', () => {
                expect(err.toString()).toEqual('Error: changeWorkers requires action to be one of add, remove, or total');
            });
        });
    });

    describe('->waitForStatus', () => {
        describe('when called and it matches on the first try', () => {
            let result;
            beforeEach((done) => {
                scope.get('/jobs/some-job-id/ex')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: 'example'
                    });


                new Job({ baseUrl }, 'some-job-id')
                    .waitForStatus('example')
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(result).toEqual('example');
            });
        });

        describe('when called and it matches on the second try', () => {
            let result;
            beforeEach((done) => {
                scope.get('/jobs/some-job-id/ex')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: 'not-example'
                    });

                scope.get('/jobs/some-job-id/ex')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: 'example'
                    });


                new Job({ baseUrl }, 'some-job-id')
                    .waitForStatus('example')
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(result).toEqual('example');
            });
        });

        describe('when called and it never matches', () => {
            let err;

            beforeEach((done) => {
                scope.get('/jobs/some-job-id/ex')
                    .times(11)
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: 'not-example'
                    });


                new Job({ baseUrl }, 'some-job-id')
                    .waitForStatus('example', 100, 1000)
                    .then(() => {
                        fail('Expected job to status not to change');
                    }).catch((_err) => {
                        err = _err;
                        done();
                    });
            });

            it('should reject with a timeout error', () => {
                expect(err.toString()).toEqual('Error: Job status failed to change from status "not-example" within 1000ms');
            });
        });

        describe('when called and it times out', () => {
            let status;

            beforeEach((done) => {
                scope.get('/jobs/some-job-id/ex')
                    .delay(1100)
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: 'example'
                    });

                scope.get('/jobs/some-job-id/ex')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: 'example'
                    });


                new Job({ baseUrl }, 'some-job-id')
                    .waitForStatus('example', 100, 1500)
                    .then(() => {
                        done();
                    }).catch((err) => {
                        fail(err);
                    });
            });

            it('should resolve with the correct status', () => {
                expect(status).toEqual(status);
            });
        });

        describe('when called and returns a terminal status', () => {
            let err;

            beforeEach((done) => {
                scope.get('/jobs/some-job-id/ex')
                    .times(11)
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: 'failed'
                    });


                new Job({ baseUrl }, 'some-job-id')
                    .waitForStatus('example')
                    .then(() => {
                        fail('Expected job to status not to finish');
                    }).catch((_err) => {
                        err = _err;
                        done();
                    });
            });

            it('should reject with a terminal status error', () => {
                expect(err.toString()).toEqual('Error: Job cannot reach the target status, "example", because it is in the terminal state, "failed"');
            });
        });
    });
});
