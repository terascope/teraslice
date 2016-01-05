'use strict';

var es_reader = require('../../lib/readers/elasticsearch_reader');
var Promise = require('bluebird');
var moment = require('moment');

describe('elasticsearch_reader', function() {
    var clientData;
    var loggedMessage;

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
            info: function(data) {
                loggedMessage = data;
            }
        }
    };

    var client = context.foundation.getConnection().client;

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
        var message = {start: '2015/08/30', end: '2015/08/31', count: 50};

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

    it('determineSlice returns an object with keys start and end', function(done) {

        var config = {date_field_name: '@timestamp', size: 100, index: 'someIndex'};
        var start = moment(new Date('2015/08/30'));
        var end = moment(new Date('2015/08/31'));
        var size = 100;

        Promise.resolve(es_reader.determineSlice(client, config, start, end, size))
            .then(function(data) {
                expect(data).toBeDefined();
                expect(typeof data).toBe('object');
                expect(data.start).toBeDefined();
                expect(data.end).toBeDefined();
                expect(data.start.format()).toEqual('2015-08-30T00:00:00-07:00');
                expect(data.end.format()).toEqual('2015-08-31T00:00:00-07:00');

                done();
            });

    });

    it('determineSlice recurses, splitting chunk in half to get right chunk', function(done) {

        var config = {date_field_name: '@timestamp', size: 50, index: 'someIndex'};
        var start = moment(new Date('2015/08/30'));
        var end = moment(new Date('2015/08/31'));
        var size = 50;

        Promise.resolve(es_reader.determineSlice(client, config, start, end, size))
            .then(function(data) {
                expect(data.end.format()).toEqual('2015-08-30T12:00:00-07:00');
                done();
            });

    });

    it('determineSlice will return oversized slice if interval is  === || < 1 ms ', function(done) {

        var config = {date_field_name: '@timestamp', size: 10, index: 'someIndex'};
        var start = moment(new Date('2015/08/30'));
        var end = moment(new Date('2015/08/31'));
        var size = 10;

        Promise.resolve(es_reader.determineSlice(client, config, start, end, size))
            .then(function(data) {
                expect(data.start.format()).toEqual('2015-08-30T00:00:00-07:00');
                expect(data.end.format()).toEqual('2015-08-30T00:00:01-07:00');

                done();
            });

    });

    it('newSlicer return a function', function() {

        var opConfig = {date_field_name: '@timestamp', size: 50, index: 'someIndex', interval: '12_hrs'};
        var jobConfig = {};

        var fn = es_reader.newSlicer(context, opConfig, jobConfig);

        expect(typeof fn).toEqual('function');

    });

    it('newSlicer returns nextChunk that returns an object for the worker', function(done) {

        var opConfig = {
            date_field_name: '@timestamp',
            size: 100,
            index: 'someIndex',
            interval: '2_hrs',
            start: "2015-08-25",
            end: "2015-08-26"
        };

        var jobConfig = {};

        var slicer = es_reader.newSlicer(context, opConfig, jobConfig);

        Promise.resolve(slicer()).then(function(data) {
            expect(data).toEqual({
                start: '2015-08-25T00:00:00+00:00',
                end: '2015-08-25T02:00:00+00:00',
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
            interval: '2_hrs',
            start: "2015-08-25T00:00:00",
            end: "2015-08-25T00:02:00"
        };

        var jobConfig = {};

        var slicer = es_reader.newSlicer(context, opConfig, jobConfig);

        Promise.resolve(slicer()).then(function(msg) {
            return slicer();
        }).then(function(data) {
            expect(data).toBeNull();
            done()
        });

    });

    it(' will log a warning if your max_window is set to 10000 ', function() {
        var opConfig = {index: 'someIndex'};
        var logger = context.logger;

        es_reader.checkElasticsearch(client, opConfig, logger);

        expect(loggedMessage).toEqual(' max_result_window for index: someIndex is set at 10000. On very large indices it is possible that a slice can not be divided to stay below this limit. If that occurs an error will be thrown by Elasticsearch and the slice can not be processed. Increasing max_result_window in the Elasticsearch index settings will resolve the problem. ');
    });

});