'use strict';

const idReader = require('../../lib/readers/id_reader');
const Promise = require('bluebird');
const events = require('events');

const eventEmitter = new events.EventEmitter();

describe('id_reader', () => {
    let clientData;
    let makeSearchFailure = false;

    beforeEach(() => {
        clientData = [
            { hits: { total: 100 } },
            { hits: { total: 100 } },
            { hits: { total: 100 } },
            { hits: { total: 100 } },
            { hits: { total: 100 } },
            { hits: { total: 100 } }
        ];
    });

    const context = {
        foundation: {
            getConnection() {
                return {
                    client: {
                        search() {
                            const metaData = { _shards: { failed: 0 } };
                            if (makeSearchFailure) {
                                metaData._shards.failed = 1;
                                metaData._shards.failures = [{ reason: { type: 'some Error' } }];
                                makeSearchFailure = false;
                            }

                            if (clientData.length > 1) {
                                const data = clientData.shift();
                                return Promise.resolve(
                                    Object.assign({}, data, metaData));
                            }

                            return Promise.resolve(Object.assign({}, clientData[0], metaData));
                        }
                    }
                };
            },
            getEventEmitter() {
                return eventEmitter;
            }
        },
        logger: {
            error() {},
            info() {},
            warn() {}
        }
    };

    const logger = context.logger;

    it('has a schema, newSlicer and a newReader method, crossValidation', () => {
        const reader = idReader;

        expect(reader).toBeDefined();
        expect(reader.newSlicer).toBeDefined();
        expect(reader.schema).toBeDefined();
        expect(reader.newReader).toBeDefined();
        expect(reader.crossValidation).toBeDefined();

        expect(typeof reader.newSlicer).toEqual('function');
        expect(typeof reader.newReader).toEqual('function');
        expect(typeof reader.schema).toEqual('function');
        expect(typeof reader.crossValidation).toEqual('function');
    });

    it('crossValidation makes sure its configured correctly', () => {
        const errorStr1 = 'The number of slicers specified on the job cannot be more the length of key_range';
        const errorStr2 = 'The number of slicers specified on the job cannot be more than 16';
        const errorStr3 = 'The number of slicers specified on the job cannot be more than 64';

        const sysconfig = {};
        const job1 = { slicers: 1, operations: [{ _op: 'id_reader', key_range: ['a', 'b'] }] };
        const job2 = { slicers: 2, operations: [{ _op: 'id_reader', key_range: ['a'] }] };
        const job3 = { slicers: 4, operations: [{ _op: 'id_reader', key_type: 'hexadecimal' }] };
        const job4 = { slicers: 20, operations: [{ _op: 'id_reader', key_type: 'hexadecimal' }] };
        const job5 = { slicers: 20, operations: [{ _op: 'id_reader', key_type: 'base64url' }] };
        const job6 = { slicers: 70, operations: [{ _op: 'id_reader', key_type: 'base64url' }] };


        expect(() => {
            idReader.crossValidation(job1, sysconfig);
        }).not.toThrow();
        expect(() => {
            idReader.crossValidation(job2, sysconfig);
        }).toThrowError(errorStr1);

        expect(() => {
            idReader.crossValidation(job3, sysconfig);
        }).not.toThrow();
        expect(() => {
            idReader.crossValidation(job4, sysconfig);
        }).toThrowError(errorStr2);

        expect(() => {
            idReader.crossValidation(job5, sysconfig);
        }).not.toThrow();
        expect(() => {
            idReader.crossValidation(job6, sysconfig);
        }).toThrowError(errorStr3);
    });

    it('can create multiple slicers', (done) => {
        const retryData = [];
        const job1 = {
            jobConfig: {
                slicers: 1,
                operations: [{ _op: 'id_reader', key_type: 'hexadecimal', key_range: ['a', 'b'] }]
            }
        };
        const job2 = {
            jobConfig: {
                slicers: 2,
                operations: [{ _op: 'id_reader', key_type: 'hexadecimal', key_range: ['a', 'b'] }]
            }
        };

        const slicer = idReader.newSlicer(context, job1, retryData, logger);

        Promise.resolve(slicer)
            .then((slicers) => {
                expect(slicers.length).toEqual(1);
                expect(typeof slicers[0]).toEqual('function');
                return idReader.newSlicer(context, job2, retryData, logger);
            })
            .then((slicers) => {
                expect(slicers.length).toEqual(2);
                expect(typeof slicers[0]).toEqual('function');
                expect(typeof slicers[1]).toEqual('function');
                done();
            });
    });

    it('it produces values', (done) => {
        const retryData = [];
        const job1 = {
            jobConfig: {
                slicers: 1,
                operations: [{
                    _op: 'id_reader',
                    type: 'events-',
                    key_type: 'hexadecimal',
                    key_range: ['a', 'b'],
                    size: 200
                }]
            }
        };

        const slicer = idReader.newSlicer(context, job1, retryData, logger);

        Promise.resolve(slicer)
            .then(slicers => Promise.resolve(slicers[0]())
                .then((results) => {
                    expect(results).toEqual({ count: 100, key: 'events-#a*' });
                    return Promise.resolve(slicers[0]());
                })
                .then((results) => {
                    expect(results).toEqual({ count: 100, key: 'events-#b*' });

                    return Promise.resolve(slicers[0]());
                })
                .then((results) => {
                    expect(results).toEqual(null);
                    done();
                }))
            .catch((err) => {
                fail(err);
            });
    });

    it('it produces values starting at a specific depth', (done) => {
        const retryData = [];
        const job1 = {
            jobConfig: {
                slicers: 1,
                operations: [{
                    _op: 'id_reader',
                    type: 'events-',
                    key_type: 'hexadecimal',
                    key_range: ['a', 'b', 'c', 'd'],
                    starting_key_depth: 3,
                    size: 200
                }]
            }
        };

        const slicer = idReader.newSlicer(context, job1, retryData, logger);

        Promise.resolve(slicer)
            .then(slicers => Promise.resolve(slicers[0]())
                .then((results) => {
                    expect(results).toEqual({ count: 100, key: 'events-#a00*' });
                    return Promise.resolve(slicers[0]());
                })
                .then((results) => {
                    expect(results).toEqual({ count: 100, key: 'events-#a01*' });
                    return Promise.resolve(slicers[0]());
                })
                .then((results) => {
                    expect(results).toEqual({ count: 100, key: 'events-#a02*' });
                    done();
                }))
            .catch((err) => {
                fail(err);
            });
    });

    it('it produces values even with an initial search error', (done) => {
        const retryData = [];
        const job1 = {
            jobConfig: {
                slicers: 1,
                operations: [{
                    _op: 'id_reader',
                    type: 'events-',
                    key_type: 'hexadecimal',
                    key_range: ['a', 'b'],
                    size: 200
                }]
            }
        };

        const slicer = idReader.newSlicer(context, job1, retryData, logger);

        Promise.resolve(slicer)
            .then((slicers) => {
                makeSearchFailure = true;
                return Promise.resolve(slicers[0]())
                    .then((results) => {
                        expect(results).toBeDefined();
                        expect(results).toEqual({ count: 100, key: 'events-#a*' });
                        makeSearchFailure = false;
                        return Promise.resolve(slicers[0]());
                    })
                    .then((results) => {
                        expect(results).toEqual({ count: 100, key: 'events-#b*' });

                        return Promise.resolve(slicers[0]());
                    })
                    .then((results) => {
                        expect(results).toEqual(null);
                        done();
                    })
                    .catch((err) => {
                        fail(err);
                        done();
                    });
            });
    });

    it('key range gets divided up by number of slicers', (done) => {
        const retryData = [];
        const job1 = {
            jobConfig: {
                slicers: 2,
                operations: [{
                    _op: 'id_reader',
                    type: 'events-',
                    key_type: 'hexadecimal',
                    key_range: ['a', 'b'],
                    size: 200
                }]
            }
        };


        const slicer = idReader.newSlicer(context, job1, retryData, logger);

        Promise.resolve(slicer)
            .then(slicers => Promise.all([slicers[0](), slicers[1]()])
                .then((results) => {
                    expect(results[0]).toEqual({ count: 100, key: 'events-#a*' });
                    expect(results[1]).toEqual({ count: 100, key: 'events-#b*' });

                    return Promise.all([slicers[0](), slicers[1]()]);
                })
                .then((results) => {
                    expect(results[0]).toEqual(null);
                    expect(results[1]).toEqual(null);

                    done();
                }));
    });

    it('key range gets divided up by number of slicers', (done) => {
        clientData = [
            { hits: { total: 100 } },
            { hits: { total: 500 } },
            { hits: { total: 200 } },
            { hits: { total: 100 } },
            { hits: { total: 100 } }
        ];

        const retryData = [];
        const job1 = {
            jobConfig: {
                slicers: 1,
                operations: [{
                    _op: 'id_reader',
                    type: 'events-',
                    key_type: 'hexadecimal',
                    key_range: ['a', 'b'],
                    size: 200
                }]
            }
        };

        const slicer = idReader.newSlicer(context, job1, retryData, logger);

        Promise.resolve(slicer)
            .then(slicers => Promise.resolve(slicers[0]())
                .then((results) => {
                    expect(results).toEqual({ count: 100, key: 'events-#a*' });
                    return Promise.resolve(slicers[0]());
                })
                .then((results) => {
                    expect(results).toEqual({ count: 100, key: 'events-#b00*' });

                    return Promise.resolve(slicers[0]());
                })
                .then((results) => {
                    expect(results).toEqual({ count: 100, key: 'events-#b01*' });

                    return Promise.resolve(slicers[0]());
                })
                .then((results) => {
                    expect(results).toEqual({ count: 100, key: 'events-#b02*' });

                    return Promise.resolve(slicers[0]());
                })
                .then((results) => {
                    expect(results).toEqual({ count: 100, key: 'events-#b03*' });
                    done();
                }));
    });

    it('can return to previous position', (done) => {
        const retryData = [{ lastSlice: { key: 'events-#a6*' } }];
        const job1 = {
            jobConfig: {
                slicers: 1,
                operations: [{
                    _op: 'id_reader',
                    type: 'events-',
                    key_type: 'hexadecimal',
                    key_range: ['a', 'b'],
                    size: 200
                }]
            }
        };

        const slicer = idReader.newSlicer(context, job1, retryData, logger);

        Promise.resolve(slicer)
            .then(slicers => Promise.resolve(slicers[0]())
                .then((results) => {
                    expect(results).toEqual({ count: 100, key: 'events-#a7*' });
                    return Promise.resolve(slicers[0]());
                })
                .then((results) => {
                    expect(results).toEqual({ count: 100, key: 'events-#a8*' });
                    return Promise.resolve(slicers[0]());
                })
                .then((results) => {
                    expect(results).toEqual({ count: 100, key: 'events-#a9*' });
                    return Promise.resolve(slicers[0]());
                })
                .then((results) => {
                    expect(results).toEqual({ count: 100, key: 'events-#aa*' });
                    return Promise.resolve(slicers[0]());
                })
                .then((results) => {
                    expect(results).toEqual({ count: 100, key: 'events-#ab*' });
                    done();
                }));
    });
});
