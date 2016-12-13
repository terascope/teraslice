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

        expect(function() {
            dateOptions('Day')
        }).toThrowError();

        expect(dateOptions('day')).toEqual('d');

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

    it('compareInterval can take moment dates to compare interval range and date range', function() {
        var compareInterval = utils.compareInterval;

        var start = new Date();
        var date = moment(start);
        var oldDate = moment(start).subtract(60, 'd');
        var data = {start: oldDate, limit: date};

        var results1 = compareInterval(['90', 'd'], data, {time_resolution: 'ms'});
        var results2 = compareInterval(['90', 'd'], data, {time_resolution: 's'});

        expect(results1[0]).toEqual(5184000000);
        expect(results1[1]).toEqual('ms');

        expect(results2[0]).toEqual(5184000);
        expect(results2[1]).toEqual('s');

    });

    it('processInterval can take moment dates to compare interval range and date range', function() {
        var processInterval = utils.processInterval;
        var start = new Date();
        var date = moment(start);
        var oldDate = moment(start).subtract(60, 'd');
        var otherDate = moment(start).subtract(1, 'm');

        var data = {start: oldDate, limit: date};
        var otherData = {start: otherDate, limit: date};

        var results1 = processInterval('5min', data, {time_resolution: 'ms'});
        var results2 = processInterval('5min', otherData, {time_resolution: 'ms'});

        expect(results1[0]).toEqual('5');
        expect(results1[1]).toEqual('m');

        expect(results2[0]).toEqual(60000);
        expect(results2[1]).toEqual('ms');

    });

    it('buildRangeQuery will return an object formatted for elasticsearch use', function() {
        var source = {date_field_name: '@timestamp'};
        var message = {start: '2015/08/30', end: '2015/08/30'};
        var obj = utils.buildRangeQuery(source, message);

        expect(Object.prototype.toString.call(obj)).toEqual('[object Object]');
        expect(obj).toEqual({
            query: {
                range: {
                    '@timestamp': {
                        gte: '2015/08/30',
                        lt: '2015/08/30'
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

});
