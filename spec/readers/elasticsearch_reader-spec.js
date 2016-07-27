'use strict';

var es_reader = require('../../lib/readers/elasticsearch_reader');
var Promise = require('bluebird');

describe('elasticsearch_reader', function() {
    var clientData;

    beforeEach(function() {
        clientData = [{'@timestamp': new Date(), count: 100}, {'@timestamp': new Date(), count: 50}];
    });

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
                        }
                    }
                }
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

    it('has a schema, newSlicer and a newReader method', function() {
        var reader = es_reader;

        expect(reader).toBeDefined();
        expect(reader.newSlicer).toBeDefined();
        expect(reader.schema).toBeDefined();
        expect(reader.newReader).toBeDefined();
        expect(typeof reader.newSlicer).toEqual('function');
        expect(typeof reader.newReader).toEqual('function');
        expect(typeof reader.schema).toEqual('function');

    });

    it('schema function returns on object, formatted to be used by convict', function() {
        var schema = es_reader.schema();
        var type = Object.prototype.toString.call(schema);
        var keys = Object.keys(schema);

        expect(type).toEqual('[object Object]');
        expect(keys.length).toBeGreaterThan(0);
        expect(schema.size.default).toEqual(5000);
        expect(schema.interval.default).toEqual('auto')

    });

    it('newReader returns a function that queries elasticsearch', function() {

        var opConfig = {date_field_name: '@timestamp', size: 50, index: 'someIndex', full_response: true};
        var jobConfig = {lifecycle: 'once'};

        var reader = es_reader.newReader(context, opConfig, jobConfig);

        expect(typeof reader).toEqual('function');

    });

    it('newSlicer return a function', function() {

        var opConfig = {
            _op: 'elasticsearch_reader',
            time_resolution: 's',
            date_field_name: '@timestamp',
            size: 50,
            index: 'someIndex',
            interval: '12hrs',
            start: new Date(),
            end: new Date()
        };
        var jobConfig = {
            jobConfig: {
                lifecycle: 'once', slicers: 1, operations: [opConfig], logger: {
                    info: function() {
                    }
                }
            }, readerConfig: opConfig
        };

        Promise.resolve(es_reader.newSlicer(context, jobConfig, [])).then(function(slicer) {
            expect(typeof slicer[0]).toEqual('function');
        });

    });

    it('slicers will throw if date_field_name does not exist on docs in the index', function(done) {
        var opConfig = {
            _op: 'elasticsearch_reader',
            date_field_name: 'date',
            time_resolution: 's',
            size: 100,
            index: 'someIndex',
            interval: '2hrs',
            start: "2015-08-25T00:00:00",
            end: "2015-08-25T00:02:00"
        };
        var jobConfig = {jobConfig: {lifecycle: 'once', slicers: 1, operations: [opConfig]}, readerConfig: opConfig};

        //this is proving that an error occurs and is caught in the catch phrase, not testing directly as it return the stack
        Promise.resolve(es_reader.newSlicer(context, jobConfig, [])).then(function(slicer) {
            Promise.resolve(slicer[0]())
                .then(function(data) {
                    return slicer[0]();
                })

        }).catch(function(err) {
            done()
        });

    });

});
