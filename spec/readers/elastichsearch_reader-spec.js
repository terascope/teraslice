'use strict';

var es_reader = require('../../lib/readers/elasticsearch_reader');
var Promise = require('bluebird');
var moment = require('moment');

describe('elasticsearch_reader', function() {
    var validDate = new Date().toISOString().slice(0, 10);


    it('buildRangeQuery will return an object formated for elasticsearch use', function() {
        var source = {date_field_name: '@timestamp'};
        var message = {start: '2015/08/30', end: '2015/08/30'};
        var obj = es_reader.buildRangeQuery(source, message);

        expect(Object.prototype.toString.call(obj)).toEqual('[object Object]');
        expect(obj).toEqual({
            query: {
                filtered: {
                    filter: {
                        range: {
                            '@timestamp': {
                                gte: '2015/08/30',
                                lt: '2015/08/30'
                            }
                        }
                    }
                }
            }
        });
    });


    it('should have index, body and size keys', function() {
        var source = {date_field_mame: '@timestamp', size: 50, index: 'someIndex'};
        var message = {start: '2015/08/30', end: '2015/08/30', count: 50};
        var obj = es_reader.buildQuery(source, message);

        expect(obj.index).toEqual('someIndex');
        expect(obj.body).toBeDefined();
        expect(obj.size).toEqual(50);

    });

    it('newReader returns a function that queries elasticsearch', function() {
        var context = {
            foundation: {
                getConnection: function() {
                    return {
                        client: {
                            search: function(msg) {
                                return msg
                            }
                        }
                    }
                }
            }
        };
        var opConfig = {date_field_name: '@timestamp', size: 50, index: 'someIndex', full_response: true};
        var jobConfig = {lifecycle: 'once'};
        var message = {start: '2015/08/30', end: '2015/08/31', count: 50};

        var reader = es_reader.newReader(context, opConfig, jobConfig);
        var results = reader(message);

        expect(typeof reader).toEqual('function');
        expect(results).toEqual({
            index: 'someIndex',
            size: 50,
            body: {
                query: {
                    filtered: {
                        filter: {
                            range: {
                                '@timestamp': {
                                    gte: '2015/08/30',
                                    lt: '2015/08/31'
                                }
                            }
                        }
                    }
                }
            }
        });

    });

    it('determineSlice returns an object with keys start and end', function(done) {

        var client = {
            count: function() {
                return Promise.resolve({count: 25})
            }
        };
        var config = {date_field_name: '@timestamp', size: 50, index: 'someIndex'};
        var start = moment(new Date('2015/08/30'));
        var end = moment(new Date('2015/08/31'));
        var size = 50;
        var data;

        Promise.resolve(es_reader.determineSlice(client, config, start, end, size))
            .then(function(_data) {
                data = _data;

                expect(data).toBeDefined();
                expect(typeof data).toBe('object');
                expect(data.start).toBeDefined();
                expect(data.end).toBeDefined();
                expect(data.start.format()).toEqual('2015-08-30T00:00:00-07:00');
                expect(data.end.format()).toEqual('2015-08-31T00:00:00-07:00');

                done();
            });

    });

    it('determine slice recurses, splitting chunk in half to get right chunk', function(done) {
        var clientData = [{count: 100}, {count: 50}];
        var client = {
            count: function() {
                return Promise.resolve(clientData.shift())
            }
        };
        var config = {date_field_name: '@timestamp', size: 50, index: 'someIndex'};
        var start = moment(new Date('2015/08/30'));
        var end = moment(new Date('2015/08/31'));
        var size = 50;
        var data;

        Promise.resolve(es_reader.determineSlice(client, config, start, end, size))
            .then(function(_data) {
                data = _data;

                expect(data.end.format()).toEqual('2015-08-30T12:00:00-07:00');
                expect(clientData.length).toEqual(0);

                done();
            });

    });

    it('newSlicer return a function', function() {
        var clientData = [{count: 100}, {count: 50}];

        var context = {
            foundation: {
                getConnection: function() {
                    return {
                        client: {
                            count: function() {
                                return Promise.resolve(clientData.shift())
                            }
                        }
                    }
                }
            }
        };

        var opConfig = {date_field_name: '@timestamp', size: 50, index: 'someIndex', interval: '12_hrs'};
        var jobConfig = {};

        var fn = es_reader.newSlicer(context, opConfig, jobConfig);

        expect(typeof fn).toEqual('function');

    });

    it('newSlicer returns nextChunk that returns an object for the worker', function(done) {

        var context = {
            foundation: {
                getConnection: function() {
                    return {
                        client: {
                            count: function() {
                                return Promise.resolve({count: 50})
                            }
                        }
                    }
                }
            }
        };

        var opConfig = {
            date_field_name: '@timestamp',
            size: 50,
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
                count: 50
            });

            done()

        });

    });

    it('newSlicer will return null when all data has been given', function(done) {

        var context = {
            foundation: {
                getConnection: function() {
                    return {
                        client: {
                            count: function() {
                                return Promise.resolve({count: 50})
                            }
                        }
                    }
                }
            }
        };

        var opConfig = {
            date_field_name: '@timestamp',
            size: 50,
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

});