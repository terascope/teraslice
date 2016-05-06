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
        expect(schema.interval.default).toEqual('5m')

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
        var jobConfig = {jobConfig: {lifecycle: 'once', slicers: 1}, readerConfig: opConfig};

        Promise.resolve(es_reader.newSlicer(context, jobConfig, [])).then(function(slicer) {
            expect(typeof slicer[0]).toEqual('function');
        });

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

        var jobConfig = {jobConfig: {lifecycle: 'once', slicers: 1}, readerConfig: opConfig};

        Promise.resolve(es_reader.newSlicer(context, jobConfig, [])).then(function(slicer) {
            Promise.resolve(slicer[0]()).then(function(data) {
                expect(data).toEqual({
                    start: '2015-08-24T17:00:00.000-07:00',
                    end: '2015-08-24T19:00:00.000-07:00',
                    count: 100
                });
                done()
            });
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
        var jobConfig = {jobConfig: {lifecycle: 'once', slicers: 1}, readerConfig: opConfig};

        Promise.resolve(es_reader.newSlicer(context, jobConfig, [])).then(function(slicer) {
            Promise.resolve(slicer[0]())
                .then(function(data) {
                    return slicer[0]();
                })
                .then(function(data) {
                    expect(data).toBeNull();
                    done()
                })
        })
    });

    it('slicer will throw if start and/or end or formatted incorrectly', function(done) {

        var opConfig1 = {
            date_field_name: '@timestamp',
            size: 100,
            index: 'someIndex',
            interval: '2hrs',
            start: "2015-08-25T00:00:00",
            end: "2015-08-25T00:02:00"
        };

        var opConfig2 = {
            index: 'someIndex',
            start: "00s"
        };

        var opConfig3 = {
            index: 'someIndex',
            end: "59s"
        };

        var jobConfig2 = {lifecycle: 'persistent'};

        function makeConfigJob(op, job) {
            return {jobConfig: job, readerConfig: op};
        }

        expect(function() {
            es_reader.newSlicer(context, makeConfigJob(opConfig1, jobConfig2), [])
        }).toThrowError('elasticsearch_reader interval and/or delay are incorrectly formatted. Needs to follow ' +
            '[number][letter\'s] format, e.g. "12s"');

        expect(function() {
            es_reader.newSlicer(context, makeConfigJob(opConfig2, jobConfig2), [])
        }).toThrowError('elasticsearch_reader interval and/or delay are incorrectly formatted. Needs to follow ' +
            '[number][letter\'s] format, e.g. "12s"');

        expect(function() {
            es_reader.newSlicer(context, makeConfigJob(opConfig3, jobConfig2), [])
        }).toThrowError('elasticsearch_reader interval and/or delay are incorrectly formatted. Needs to follow ' +
            '[number][letter\'s] format, e.g. "12s"');

        done()
    });

});
