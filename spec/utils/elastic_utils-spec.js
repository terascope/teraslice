'use strict';

var utils = require('../../lib/utils/date_utils');
var Promise = require('bluebird');
var moment = require('moment');

var events = require('events');
var eventEmitter = new events.EventEmitter();

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
            },
            getEventEmitter: function(){
                return eventEmitter;
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

        expect(dateOptions).toBeDefined();
        expect(typeof dateOptions).toEqual('function');

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

});
