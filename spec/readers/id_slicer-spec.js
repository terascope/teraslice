'use strict';

var id_reader = require('../../lib/readers/id_reader');
var Promise = require('bluebird');
var events = require('events');
var eventEmitter = new events.EventEmitter();

describe('id_reader', function() {

    var clientData;
    var makeSearchFailure = false;

    beforeEach(function() {
        clientData = [{hits: {total: 100}}, {hits: {total: 100}}, {hits: {total: 100}}, {hits: {total: 100}}, {hits: {total: 100}}, {hits: {total: 100}}];
    });

    var context = {
        foundation: {
            getConnection: function() {
                return {
                    client: {
                        search: function() {
                            var metaData = {_shards: {failed: 0}};
                            if (makeSearchFailure) {
                                metaData._shards.failed = 1;
                                metaData._shards.failures = [{reason: {type: 'some Error'}}];
                                makeSearchFailure = false;
                            }

                            if (clientData.length > 1) {
                                var data = clientData.shift();
                                return Promise.resolve(
                                    Object.assign({}, data, metaData))
                            }
                            else {
                                return Promise.resolve(Object.assign({}, clientData[0], metaData));
                            }
                        }
                    }
                }
            },
            getEventEmitter: function() {
                return eventEmitter;
            }
        },
        logger: {
            error: function() {
            },
            info: function() {
            },
            warn: function() {
            }
        }
    };

    var logger = context.logger;
    var slicerAnalytics = {};


    it('has a schema, newSlicer and a newReader method, crossValidation', function() {
        var reader = id_reader;

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

    it('crossValidation makes sure its configured correctly', function() {
        var errorStr1 = 'The number of slicers specified on the job cannot be more the length of key_range';
        var errorStr2 = 'The number of slicers specified on the job cannot be more than 16';
        var errorStr3 = 'The number of slicers specified on the job cannot be more than 64';

        var sysconfig = {};
        var job1 = {slicers: 1, operations: [{_op: 'id_reader', key_range: ['a', 'b']}]};
        var job2 = {slicers: 2, operations: [{_op: 'id_reader', key_range: ['a']}]};
        var job3 = {slicers: 4, operations: [{_op: 'id_reader', key_type: 'hexadecimal'}]};
        var job4 = {slicers: 20, operations: [{_op: 'id_reader', key_type: 'hexadecimal'}]};
        var job5 = {slicers: 20, operations: [{_op: 'id_reader', key_type: 'base64url'}]};
        var job6 = {slicers: 70, operations: [{_op: 'id_reader', key_type: 'base64url'}]};


        expect(function() {
            id_reader.crossValidation(job1, sysconfig)
        }).not.toThrow();
        expect(function() {
            id_reader.crossValidation(job2, sysconfig)
        }).toThrowError(errorStr1);

        expect(function() {
            id_reader.crossValidation(job3, sysconfig)
        }).not.toThrow();
        expect(function() {
            id_reader.crossValidation(job4, sysconfig)
        }).toThrowError(errorStr2);

        expect(function() {
            id_reader.crossValidation(job5, sysconfig)
        }).not.toThrow();
        expect(function() {
            id_reader.crossValidation(job6, sysconfig)
        }).toThrowError(errorStr3);

    });

    it('can create multiple slicers', function(done) {
        var retryData = [];
        var job1 = {
            jobConfig: {
                slicers: 1,
                operations: [{_op: 'id_reader', key_type: 'hexadecimal', key_range: ['a', 'b']}]
            }
        };
        var job2 = {
            jobConfig: {
                slicers: 2,
                operations: [{_op: 'id_reader', key_type: 'hexadecimal', key_range: ['a', 'b']}]
            }
        };

        var slicer = id_reader.newSlicer(context, job1, retryData, slicerAnalytics, logger)

        Promise.resolve(slicer)
            .then(function(slicers) {
                expect(slicers.length).toEqual(1);
                expect(typeof slicers[0]).toEqual('function');
                return id_reader.newSlicer(context, job2, retryData, slicerAnalytics, logger);
            })
            .then(function(slicers) {
                expect(slicers.length).toEqual(2);
                expect(typeof slicers[0]).toEqual('function');
                expect(typeof slicers[1]).toEqual('function');
                done()
            });
    });

    it('it produces values', function(done) {
        var retryData = [];
        var job1 = {
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

        var slicer = id_reader.newSlicer(context, job1, retryData, slicerAnalytics, logger);

        Promise.resolve(slicer)
            .then(function(slicers) {
                return Promise.resolve(slicers[0]())
                    .then(function(results) {
                        expect(results).toEqual({count: 100, key: 'events-#a*'});
                        return Promise.resolve(slicers[0]())
                    })
                    .then(function(results) {
                        expect(results).toEqual({count: 100, key: 'events-#b*'});

                        return Promise.resolve(slicers[0]())
                    })
                    .then(function(results) {
                        expect(results).toEqual(null);
                        done();
                    });
            })
            .catch(function(err){
                fail(err)
            })

    });

    it('it produces values starting at a specific depth', function(done) {
        var retryData = [];
        var job1 = {
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

        var slicer = id_reader.newSlicer(context, job1, retryData, slicerAnalytics, logger);

        Promise.resolve(slicer)
            .then(function(slicers) {
                return Promise.resolve(slicers[0]())
                    .then(function(results) {
                        expect(results).toEqual({count: 100, key: 'events-#a00*'});
                        return Promise.resolve(slicers[0]())
                    })
                    .then(function(results) {
                        expect(results).toEqual({count: 100, key: 'events-#a01*'});
                        return Promise.resolve(slicers[0]())
                    })
                    .then(function(results) {
                        expect(results).toEqual({count: 100, key: 'events-#a02*'});
                        done();
                    })
            })
            .catch(function(err){
                fail(err)
            })
    });

    it('it produces values even with an initial search error', function(done) {
        var retryData = [];
        var job1 = {
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

        var slicer = id_reader.newSlicer(context, job1, retryData, slicerAnalytics, logger);

        Promise.resolve(slicer)
            .then(function(slicers) {
                makeSearchFailure = true;
                return Promise.resolve(slicers[0]())
                    .then(function(results) {
                        expect(results).toBeDefined();
                        expect(results).toEqual({count: 100, key: 'events-#a*'});
                        makeSearchFailure = false;
                        return Promise.resolve(slicers[0]())
                    })
                    .then(function(results) {
                        expect(results).toEqual({count: 100, key: 'events-#b*'});

                        return Promise.resolve(slicers[0]())
                    })
                    .then(function(results) {
                        expect(results).toEqual(null);
                        done();
                    })
                    .catch(function(err) {
                        fail(err);
                        done();
                    });
            })

    });

    it('key range gets divided up by number of slicers', function(done) {
        var retryData = [];
        var job1 = {
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


        var slicer = id_reader.newSlicer(context, job1, retryData, slicerAnalytics, logger);

        Promise.resolve(slicer)
            .then(function(slicers) {
                return Promise.all([slicers[0](), slicers[1]()])
                    .then(function(results) {
                        expect(results[0]).toEqual({count: 100, key: 'events-#a*'});
                        expect(results[1]).toEqual({count: 100, key: 'events-#b*'});

                        return Promise.all([slicers[0](), slicers[1]()])
                    })
                    .then(function(results) {
                        expect(results[0]).toEqual(null);
                        expect(results[1]).toEqual(null);

                        done();
                    });
            })
    });

    it('key range gets divided up by number of slicers', function(done) {
        clientData = [{hits: {total: 100}}, {hits: {total: 500}}, {hits: {total: 200}}, {hits: {total: 100}}, {hits: {total: 100}}];

        var retryData = [];
        var job1 = {
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

        var slicer = id_reader.newSlicer(context, job1, retryData, slicerAnalytics, logger);

        Promise.resolve(slicer)
            .then(function(slicers) {
                return Promise.resolve(slicers[0]())
                    .then(function(results) {
                        expect(results).toEqual({count: 100, key: 'events-#a*'});
                        return Promise.resolve(slicers[0]())
                    })
                    .then(function(results) {
                        expect(results).toEqual({count: 100, key: 'events-#b00*'});

                        return Promise.resolve(slicers[0]())
                    })
                    .then(function(results) {
                        expect(results).toEqual({count: 100, key: 'events-#b01*'});

                        return Promise.resolve(slicers[0]())
                    })
                    .then(function(results) {
                        expect(results).toEqual({count: 100, key: 'events-#b02*'});

                        return Promise.resolve(slicers[0]())
                    })
                    .then(function(results) {
                        expect(results).toEqual({count: 100, key: 'events-#b03*'});
                        done();
                    })

            })

    });

    it('can return to previous position', function(done) {
        var retryData = [{lastSlice: {key: 'events-#a6*'}}];
        var job1 = {
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

        var slicer = id_reader.newSlicer(context, job1, retryData, slicerAnalytics, logger);

        Promise.resolve(slicer)
            .then(function(slicers) {
                return Promise.resolve(slicers[0]())
                    .then(function(results) {
                        expect(results).toEqual({count: 100, key: 'events-#a7*'});
                        return Promise.resolve(slicers[0]())
                    })
                    .then(function(results) {
                        expect(results).toEqual({count: 100, key: 'events-#a8*'});
                        return Promise.resolve(slicers[0]())
                    })
                    .then(function(results) {
                        expect(results).toEqual({count: 100, key: 'events-#a9*'});
                        return Promise.resolve(slicers[0]())
                    })
                    .then(function(results) {
                        expect(results).toEqual({count: 100, key: 'events-#aa*'});
                        return Promise.resolve(slicers[0]())
                    })
                    .then(function(results) {
                        expect(results).toEqual({count: 100, key: 'events-#ab*'});
                        done();
                    })
            })
    });


});
