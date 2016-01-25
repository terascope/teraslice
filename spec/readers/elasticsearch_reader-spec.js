'use strict';

var es_reader = require('../../lib/readers/elasticsearch_reader');
var Promise = require('bluebird');

describe('elasticsearch_reader', function() {
    var clientData;

    beforeEach(function() {
        clientData = [{count: 100}, {count: 50}];
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
            info: function() {
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
        expect(schema.interval.default).toEqual('5_mins')

    });

    it('newReader returns a function that queries elasticsearch', function() {

        var opConfig = {date_field_name: '@timestamp', size: 50, index: 'someIndex', full_response: true};
        var jobConfig = {lifecycle: 'once'};

        var reader = es_reader.newReader(context, opConfig, jobConfig);

        expect(typeof reader).toEqual('function');

    });

    it('reader will return a full elasticsearch response if flagged', function(done) {

        var opConfig = {date_field_name: '@timestamp', size: 50, index: 'someIndex', full_response: true};

        var jobConfig = {lifecycle: 'once'};
        var message = {start: '2015/08/30', end: '2015/08/31', count: 50};

        var reader = es_reader.newReader(context, opConfig, jobConfig);

        reader(message).then(function(results) {
            expect(results).toEqual({
                hits: {
                    hits: clientData.map(function(obj) {
                        return {_source: obj}
                    })
                }
            });
            done();
        });

    });

    it('reader will by default return the actual data, not the associated elasticsearch metadata', function(done) {

        var opConfig = {date_field_name: '@timestamp', size: 50, index: 'someIndex'};

        var jobConfig = {lifecycle: 'once'};
        var message = {start: '2015/08/30', end: '2015/08/31', count: 50};

        var reader = es_reader.newReader(context, opConfig, jobConfig);

        reader(message).then(function(results) {
            expect(results).toEqual(clientData);
            done();
        });

    });

    it('newSlicer return a function', function() {

        var opConfig = {
            date_field_name: '@timestamp',
            size: 50,
            index: 'someIndex',
            interval: '12hrs',
            start: new Date(),
            end: new Date()
        };
        var jobConfig = {lifecycle: 'once'};

        var fn = es_reader.newSlicer(context, opConfig, jobConfig);

        expect(typeof fn).toEqual('function');

    });

    it('newSlicer returns nextChunk that returns an object for the worker', function(done) {

        var opConfig = {
            date_field_name: '@timestamp',
            size: 100,
            index: 'someIndex',
            interval: '2hrs',
            start: "2015-08-25T00:00:00Z",
            end: "2015-08-26T00:00:00Z"
        };

        var jobConfig = {lifecycle: 'once'};

        var slicer = es_reader.newSlicer(context, opConfig, jobConfig);

        Promise.resolve(slicer()).then(function(data) {
            expect(data).toEqual({
                start: '2015-08-24T17:00:00.000-07:00',
                end: '2015-08-24T19:00:00.000-07:00',
                count: 100
            });

            done()
        });

    });

    it('newSlicer will return null when all data has been given', function(done) {

        var opConfig = {
            date_field_name: '@timestamp',
            size: 100,
            index: 'someIndex',
            interval: '2hrs',
            start: "2015-08-25T00:00:00",
            end: "2015-08-25T00:02:00"
        };

        var jobConfig = {lifecycle: 'once'};

        var slicer = es_reader.newSlicer(context, opConfig, jobConfig);

        Promise.resolve(slicer()).then(function(msg) {
            return slicer();
        }).then(function(data) {
            expect(data).toBeNull();
            done()
        });

    });

    it('slicer will throw if start and/or end or formatted incorrectly', function() {

        var opConfig1 = {
            date_field_name: '@timestamp',
            size: 100,
            index: 'someIndex',
            interval: '2hrs',
            start: "2015-08-25T00:00:00",
            end: "2015-08-25T00:02:00"
        };

        var opConfig2 = {
            date_field_name: '@timestamp',
            size: 100,
            index: 'someIndex',
            interval: '2hrs',
            start: "2015-08-25T00:00:00"
        };

        var opConfig3 = {
            date_field_name: '@timestamp',
            size: 100,
            index: 'someIndex',
            interval: '2hrs',
            end: "2015-08-25T00:02:00"
        };

        var opConfig4 = {
            index: 'someIndex',
            start: "00s",
            end: "59s"
        };

        var opConfig5 = {
            index: 'someIndex',
            start: "00s"
        };

        var opConfig6 = {
            index: 'someIndex',
            end: "59s"
        };

        var jobConfig1 = {lifecycle: 'once'};

        var jobConfig2 = {lifecycle: 'persistent'};

        expect(function() {
            es_reader.newSlicer(context, opConfig1, jobConfig2)
        }).toThrowError('elasticsearch_reader start and/or end are incorrectly formatted. Needs to follow ' +
            '[number][letter\'s] format, e.g. "12s"');

        expect(function() {
            es_reader.newSlicer(context, opConfig2, jobConfig1)
        }).toThrowError('elasticsearch_reader start and/or end are not set');

        expect(function() {
            es_reader.newSlicer(context, opConfig3, jobConfig1)
        }).toThrowError('elasticsearch_reader start and/or end are not set');

        expect(function() {
            es_reader.newSlicer(context, opConfig4, jobConfig1)
        }).toThrowError('elasticsearch_reader start and/or end dates are invalid');

        expect(function() {
            es_reader.newSlicer(context, opConfig5, jobConfig2)
        }).toThrowError('elasticsearch_reader start and/or end are incorrectly formatted. Needs to follow ' +
            '[number][letter\'s] format, e.g. "12s"');

        expect(function() {
            es_reader.newSlicer(context, opConfig6, jobConfig2)
        }).toThrowError('elasticsearch_reader start and/or end are incorrectly formatted. Needs to follow ' +
            '[number][letter\'s] format, e.g. "12s"');
    });

});
