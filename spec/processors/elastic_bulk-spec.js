'use strict';

var es_sender = require('../../lib/processors/elasticsearch_bulk');
var events = require('events');
var eventEmitter = new events.EventEmitter();

describe('elasticsearch_bulk', function() {

    var context = {
        foundation: {
            getConnection: function() {
                return {
                    client: {
                        count: function() {
                            if (clientData.length > 1) {
                                return Promise.resolve(clientData.shift())
                            }
                            return Promise.resolve(clientData[0])
                        },
                        indices: {
                            getSettings: function() {
                                return Promise.resolve({
                                    'someIndex': {
                                        settings: {
                                            index: {
                                                max_result_window: 10000
                                            }
                                        }
                                    }
                                })
                            }
                        },
                        cluster: {
                            stats: function() {
                                return Promise.resolve({nodes: {versions: ['2.1.1']}})
                            }
                        },
                        search: function() {
                            return Promise.resolve({
                                hits: {
                                    hits: clientData.map(function(obj) {
                                        return {_source: obj}
                                    })
                                }
                            })
                        },
                        bulk: function(results) {
                            return Promise.resolve(results)
                        }
                    }
                }
            },
            getEventEmitter: function(){
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

    it('has both a newSender and schema method', function() {

        expect(es_sender.newProcessor).toBeDefined();
        expect(es_sender.schema).toBeDefined();
        expect(typeof es_sender.newProcessor).toEqual('function');
        expect(typeof es_sender.schema).toEqual('function');

    });

    it('schema has defaults', function() {
        var defaults = es_sender.schema();

        expect(defaults.size).toBeDefined();
        expect(defaults.size.default).toEqual(500);

    });

    it('returns a function', function() {
        var opConfig = {size: 100, multisend: false};
        var jobConfig = {};

        var sender = es_sender.newProcessor(context, opConfig, jobConfig);

        expect(typeof sender).toEqual('function');

    });

    it('if no docs, returns a promise of undefined', function(done) {
        var opConfig = {size: 100, multisend: false};
        var jobConfig = {};

        var sender = es_sender.newProcessor(context, opConfig, jobConfig);
        sender().then(val => {
            expect(val).toEqual(undefined);
            done();
        });
    });

    it('does not split if the size is <= than 2 * size in opConfig', function(done) {
        //usually each doc is paired with metadata, thus doubling the size of incoming array, hence we double size 
        var opConfig = {size: 50, multisend: false};
        var jobConfig = {};
        var incData = [];

        for (var i = 0; i < 50; i++) {
            incData.push({some: 'data'})
        }

        var sender = es_sender.newProcessor(context, opConfig, jobConfig);
        sender(incData).then(val => {
            expect(val.length).toEqual(1);
            expect(val[0].body.length).toEqual(50);
            done();
        });
    });

    it('it does split if the size is greater than 2 * size in opConfig', function(done) {
        //usually each doc is paired with metadata, thus doubling the size of incoming array, hence we double size
        var opConfig = {size: 50, multisend: false};
        var jobConfig = {};
        var incData = [];

        for (var i = 0; i < 120; i++) {
            incData.push({some: 'data'})
        }

        var sender = es_sender.newProcessor(context, opConfig, jobConfig);
        sender(incData).then(val => {
            expect(val.length).toEqual(2);
            //length to index is off by 1
            expect(val[0].body.length).toEqual(101);
            expect(val[1].body.length).toEqual(19);
            done();
        });
    });

    it('it splits the array up properly when there are delete operations (not a typical doubling of data)', function(done) {
        //usually each doc is paired with metadata, thus doubling the size of incoming array, hence we double size
        var opConfig = {size: 2, multisend: false};
        var jobConfig = {};
        var incData = [{create: {}}, {some: 'data'}, {update: {}}, {other: 'data'}, {delete: {}}, {index: {}}, {final: 'data'}];
        var copy = incData.slice();


        var sender = es_sender.newProcessor(context, opConfig, jobConfig);
        sender(incData).then(val => {
            expect(val.length).toEqual(2);
            //length to index is off by 1

            expect(JSON.stringify(val[0].body)).toEqual(JSON.stringify(copy.slice(0, 5)));
            expect(JSON.stringify(val[1].body)).toEqual(JSON.stringify(copy.slice(5)));
            done();
        });
    });

    it('multisend will send based off of _id ', function(done) {
        //usually each doc is paired with metadata, thus doubling the size of incoming array, hence we double size
        var opConfig = {
            size: 5,
            multisend: true,
            connection_map: {
                'a': 'default'
            }
        };

        var jobConfig = {};
        var incData = [{create: {_id: 'abc'}}, {some: 'data'}, {update: {_id: 'abc'}}, {other: 'data'}, {delete: {_id: 'abc'}}, {index: {_id: 'abc'}}, {final: 'data'}];
        var copy = incData.slice();


        var sender = es_sender.newProcessor(context, opConfig, jobConfig);
        sender(incData).then(val => {
            expect(val.length).toEqual(1);
            //length to index is off by 1

            expect(JSON.stringify(val[0].body)).toEqual(JSON.stringify(copy));
            done();
        });
    });

    it('it can multisend to several places', function(done) {
        //usually each doc is paired with metadata, thus doubling the size of incoming array, hence we double size
        var opConfig = {
            size: 5,
            multisend: true,
            connection_map: {
                'a': 'default',
                'b': 'otherConnection'
            }
        };
        //multisend_index_append
        var jobConfig = {};
        var incData = [{create: {_id: 'abc'}}, {some: 'data'}, {update: {_id: 'abc'}}, {other: 'data'}, {delete: {_id: 'bc'}}, {index: {_id: 'bc'}}, {final: 'data'}];
        var copy = incData.slice();


        var sender = es_sender.newProcessor(context, opConfig, jobConfig);
        sender(incData).then(val => {

            expect(val.length).toEqual(2);
            //length to index is off by 1
            expect(JSON.stringify(val[0].body)).toEqual(JSON.stringify(copy.slice(0, 4)));
            expect(JSON.stringify(val[1].body)).toEqual(JSON.stringify(copy.slice(4)));
            done();
        });
    });

    it('multisend_index_append will change outgoing _id ', function(done) {
        //usually each doc is paired with metadata, thus doubling the size of incoming array, hence we double size
        var opConfig = {
            size: 5,
            multisend: true,
            multisend_index_append: 'hello',
            connection_map: {
                'a': 'default'
            }
        };

        var jobConfig = {};
        var incData = [{create: {_id: 'abc'}}, {some: 'data'}, {update: {_id: 'abc'}}, {other: 'data'}, {delete: {_id: 'abc'}}, {index: {_id: 'abc'}}, {final: 'data'}];
        var copy = incData.slice();


        var sender = es_sender.newProcessor(context, opConfig, jobConfig);
        sender(incData).then(val => {
            expect(val.length).toEqual(1);
            //length to index is off by 1

            expect(JSON.stringify(val[0].body)).toEqual(JSON.stringify(copy));
            done();
        });
    });

    it('crossValidation makes sure connection_map is configured in sysconfig', function() {
        var badJob = {
            operations: [{
                _op: 'elasticsearch_bulk',
                multisend: true,
                connection_map: {a: 'connectionA', z: 'connectionZ'}
            }]
        };
        var goodJob = {
            operations: [{
                _op: 'elasticsearch_bulk',
                multisend: true,
                connection_map: {a: 'connectionA', b: 'connectionB'}
            }]
        };

        var sysconfig = {
            terafoundation: {
                connectors: {
                    elasticsearch: {
                        connectionA: 'connection Config',
                        connectionB: 'otherConnection Config'
                    }
                }
            }
        };
        var errorString = 'elasticsearch_bulk connection_map specifies a connection for [connectionZ] but is not found in the system configuration [terafoundation.connectors.elasticsearch]';

        expect(function() {
            es_sender.crossValidation(badJob, sysconfig)
        }).toThrowError(errorString);

        expect(function() {
            es_sender.crossValidation(goodJob, sysconfig)
        }).not.toThrow();
    })

});

