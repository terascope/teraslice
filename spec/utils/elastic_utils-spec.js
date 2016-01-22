'use strict';

var utils = require('../../lib/utils/elastic_utils');
var Promise = require('bluebird');
var moment = require('moment');
var dateFormat = utils.dateFormat;


describe('elastic_utils', function() {
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

    it('has methods dateOptions and processInterval', function() {
        var dateOptions = utils.dateOptions;
        var processInterval = utils.processInterval;

        expect(dateOptions).toBeDefined();
        expect(processInterval).toBeDefined();
        expect(typeof dateOptions).toEqual('function');
        expect(typeof processInterval).toEqual('function');

    });

    it('dateOptions returns a string used for the moment library', function() {
        var dateOptions = utils.dateOptions;

        var results1 = dateOptions('Day');
        var results2 = dateOptions('day');

        expect(results1).toEqual('d');
        expect(results2).toEqual('d');

    });

    it('dateOptions will throw a new error if not given correct values', function() {
        var dateOptions = utils.dateOptions;

        expect(function() {
            dateOptions('hourz')
        }).toThrowError();

        expect(function() {
            dateOptions(3)
        }).toThrowError();

        expect(function() {
            dateOptions({some: 'obj'})
        }).toThrowError();

        expect(function() {
            dateOptions(['hour'])
        }).toThrowError();

    });

    it('processInterval takes a string and returns an array', function() {
        var processInterval = utils.processInterval;

        var results = processInterval('5min');

        expect(Array.isArray(results)).toBe(true);

    });

    it('processInterval requires input to be a specific format', function() {
        var processInterval = utils.processInterval;
        var results1 = processInterval('5min');

        expect(results1[0]).toEqual('5');
        expect(results1[1]).toEqual('m');

        expect(function() {
            processInterval({some: 'obj'})
        }).toThrowError();

        expect(function() {
            processInterval('5-min')
        }).toThrowError();

        expect(function() {
            processInterval('5_minz')
        }).toThrowError();

    });

    it('buildRangeQuery will return an object formatted for elasticsearch use', function() {
        var source = {date_field_name: '@timestamp'};
        var message = {start: '2015/08/30', end: '2015/08/30'};
        var obj = utils.buildRangeQuery(source, message);

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

    it(' buildQuery should return an object that has a index, body and size key', function() {
        var source = {date_field_mame: '@timestamp', size: 50, index: 'someIndex'};
        var message = {start: '2015/08/30', end: '2015/08/30', count: 50};
        var obj = utils.buildQuery(source, message);

        expect(obj.index).toEqual('someIndex');
        expect(obj.body).toBeDefined();
        expect(obj.size).toEqual(50);

    });

    it(' checkElasticsearch will log a warning if your max_window is set to 10000 ', function(done) {
        var opConfig = {index: 'someIndex'};
        var logger = context.logger;

        utils.checkElasticsearch(client, opConfig, logger);

        //checkElasticsearch is a passive logger built on promises but not returning anything
        setTimeout(function() {
            expect(loggedMessage).toEqual(' max_result_window for index: someIndex is set at 10000. On very large indices it is possible that a slice can not be divided to stay below this limit. If that occurs an error will be thrown by Elasticsearch and the slice can not be processed. Increasing max_result_window in the Elasticsearch index settings will resolve the problem. ');
            done()
        }, 1);

    });

    it('determineSlice returns an object with keys start and end', function(done) {

        var config = {date_field_name: '@timestamp', size: 100, index: 'someIndex'};
        var start = moment(new Date('2015/08/30'));
        var end = moment(new Date('2015/08/31'));
        var size = 100;

        Promise.resolve(utils.determineSlice(client, config, start, end, size))
            .then(function(data) {
                expect(data).toBeDefined();
                expect(typeof data).toBe('object');
                expect(data.start).toBeDefined();
                expect(data.end).toBeDefined();
                expect(data.start.format(dateFormat)).toEqual('2015-08-30T00:00:00.000-07:00');
                expect(data.end.format(dateFormat)).toEqual('2015-08-31T00:00:00.000-07:00');

                done();
            });

    });

    it('determineSlice recurses, splitting chunk in half to get right chunk', function(done) {

        var config = {date_field_name: '@timestamp', size: 50, index: 'someIndex'};
        var start = moment(new Date('2015/08/30'));
        var end = moment(new Date('2015/08/31'));
        var size = 50;

        Promise.resolve(utils.determineSlice(client, config, start, end, size))
            .then(function(data) {
                expect(data.end.format(dateFormat)).toEqual('2015-08-30T12:00:00.000-07:00');
                done();
            });

    });

    it('determineSlice will return oversized slice if interval is  === || < 1 ms ', function(done) {

        var config = {date_field_name: '@timestamp', size: 10, index: 'someIndex'};
        var start = moment(new Date('2015/08/30'));
        var end = moment(new Date('2015/08/31'));
        var size = 10;

        Promise.resolve(utils.determineSlice(client, config, start, end, size))
            .then(function(data) {
                expect(data.start.format(dateFormat)).toEqual('2015-08-30T00:00:00.000-07:00');
                expect(data.end.format(dateFormat)).toEqual('2015-08-30T00:00:00.001-07:00');

                done();
            });

    });

    it('checkVersion will return a boolean if version is >= 2.1.0 of elasticsearch ', function() {
        var str1 = '2.0.0';
        var str2 = '2.0.1';
        var str3 = '1.7.1';
        var str4 = '2.1.0';
        var str5 = '4.3.0';

        expect(utils.checkVersion(str1)).toEqual(false);
        expect(utils.checkVersion(str2)).toEqual(false);
        expect(utils.checkVersion(str3)).toEqual(false);
        expect(utils.checkVersion(str4)).toEqual(true);
        expect(utils.checkVersion(str5)).toEqual(true);

    });

    it('getTimes returns valid iso dates', function() {
        var jobConfig1 = {interval: '0s', delay: '29s'};

        var results = utils.getTimes(jobConfig1);

        expect(results).toBeDefined();
        expect(results.start).toBeDefined();
        expect(results.end).toBeDefined();
        expect(typeof results.start).toEqual('object');
        expect(typeof results.end).toEqual('object');

        expect(function() {
            new Date(results.start)
        }).not.toThrow();

        expect(function() {
            new Date(results.end)
        }).not.toThrow();

    });

    it('recursiveSend will break up an array and send them in chunks', function() {
        var client = {
            bulk: function() {
            }
        };
        var dataArray = [{one: 'data'}, {two: 'data'}, {three: 'data'}];
        var limit = 2;

        spyOn(client, 'bulk');

        utils.recursiveSend(client, dataArray, limit);

        expect(client.bulk.calls.count()).toEqual(2);
        expect(client.bulk.calls.allArgs()).toEqual([[{body: [{one: 'data'}, {two: 'data'}]}],
            [{body: [{three: 'data'}]}]])

    });
});
