'use strict';

var Promise = require('bluebird');
var moment = require('moment');
var processInterval = require('./../utils/elastic_utils').processInterval;
var checkElasticsearch = require('./../utils/elastic_utils').checkElasticsearch;
var getTimes = require('./../utils/elastic_utils').getTimes;
var getClient = require('../utils/config').getClient;
var findInterval = require('./../utils/elastic_utils').findInterval;
var buildRangeQuery = require('./../utils/elastic_utils').buildRangeQuery;
var buildQuery = require('./../utils/elastic_utils').buildQuery;
var determineSlice = require('./../utils/elastic_utils').determineSlice;


function newReader(context, opConfig, jobConfig) {
    var client = getClient(context, opConfig, 'elasticsearch');

    if (opConfig.full_response) {

        return function(msg) {
            var query = buildQuery(opConfig, msg);
            return client.search(query);
        }
    }
    else {
        return function(msg) {
            return new Promise(function(resolve, reject) {
                var query = buildQuery(opConfig, msg);
                client.search(query).then(function(data) {
                    resolve(data.hits.hits.map(function(data) {
                        return data._source
                    }))
                });
            })
        }
    }
}

function nextChunk(opConfig, client) {
    var client = client;
    var config = opConfig;
    var size = config.size;

    if (!config.start || !config.end) {
        throw  new Error('elasticsearch_reader start and/or end are not set')
    }
    if (moment(new Date(config.start)).isValid() && moment(new Date(config.end)).isValid()) {
        var start = moment.utc(config.start);
        var limit = moment.utc(config.end);
        var interval = processInterval(config.interval);
        var end = moment.utc(config.start).add(interval[0], interval[1]);
    }
    else {
        throw new Error('elasticsearch_reader start and/or end dates are invalid')
    }

    return function(msg) {
        if (start >= limit) {
            return null;
        }
        else {
            return determineSlice(client, config, start, end, size)
                .then(function(data) {
                    start = data.end;
                    if (moment(data.end).add(interval[0], interval[1]) > limit) {
                        end = moment(data.end).add(limit - data.end);
                    }
                    else {
                        end = moment(data.end).add(interval[0], interval[1]);
                    }

                    return {start: data.start.format(), end: data.end.format(), count: data.count}
                }
            );
        }
    };
}

function awaitChunk(opConfig, client, jobConfig) {
    var client = client;
    var config = opConfig;
    var size = config.size;

    if (!config.start || !config.end) {
        throw  new Error('elasticsearch_reader start and/or end are not set')
    }

    var times = getTimes(opConfig);
    var start = moment.utc(times.start);
    var lookAheadStart = moment.utc(start).add(1, 'm');
    var lookAheadEnd = moment.utc(start).add(2, 'm');
    var interval = findInterval(config);
    var end = moment.utc(times.start).add(interval[0], interval[1]);
    var limit = moment.utc(times.end).subtract(interval[0], interval[1]);
    var canRun = false;
    var isCounting = false;

    return function(msg) {

        if (canRun) {
            if (start >= limit) {
                canRun = false;
                return null;
            }
            else {
                return determineSlice(client, config, start, end, size)
                    .then(function(data) {
                        start = data.end;
                        if (moment(data.end).add(interval[0], interval[1]) > limit) {
                            end = moment(data.end).add(limit - data.end);
                        }
                        else {
                            end = moment(data.end).add(interval[0], interval[1]);
                        }

                        return {start: data.start.format(), end: data.end.format(), count: data.count}
                    });
            }
        }
        else {
            if (!isCounting) {
                isCounting = true;

                client.count({
                    index: config.index,
                    body: buildRangeQuery(config, {start: lookAheadStart.format(), end: lookAheadEnd.format()})
                })
                    .then(function(data) {
                        if (data.count === 0) {
                            var currentTime = moment.utc(new Date());

                            //if no data in given interval point to next segment
                            if (currentTime.unix() > lookAheadStart.unix()) {
                                start = start.add(1, 'm');
                                end = end.add(1, 'm');
                                lookAheadStart = lookAheadStart.add(1, 'm');
                                lookAheadEnd = lookAheadEnd.add(1, 'm');
                                limit = limit.add(interval[0], interval[1]);
                            }
                            isCounting = false;
                            return null;
                        }
                        else {
                            canRun = true;
                            lookAheadStart = lookAheadStart.add(1, 'm');
                            lookAheadEnd = lookAheadEnd.add(1, 'm');
                            limit = limit.add(interval[0], interval[1]);
                            isCounting = false;
                        }
                    });
            }
            else {
                return null;
            }
        }
    };
}

function newSlicer(context, opConfig, jobConfig) {
    var client = getClient(context, opConfig, 'elasticsearch');
    var isPersistent = jobConfig.lifecycle === 'persistent';

    checkElasticsearch(client, opConfig, context.logger);

    if (isPersistent) {
        return awaitChunk(opConfig, client, jobConfig);
    }
    else {
        return nextChunk(opConfig, client, jobConfig);
    }
}


function schema() {
    return {
        index: {
            doc: 'Which index to read from',
            default: '',
            format: 'required_String'

        },
        size: {
            doc: 'The limit to the number of docs pulled in a chunk, if the number of docs retrieved ' +
            'by the interval exceeds this number, it will cause the function to recurse to provide a smaller batch',
            default: 5000,
            format: Number
        },
        start: {
            doc: 'The start date (ISOstring or in ms) to which it will read from ',
            default: ''
        },
        end: {
            doc: 'The end date (ISOstring or in ms) to which it will read to',
            default: ''

        },
        interval: {
            doc: 'The time interval in which it will read from, the number must be separated from the unit of time ' +
            'by an underscore. The unit of time may be months, weeks, days, hours, minutes, seconds, millesconds ' +
            'or their appropriate abbreviations',
            default: '5_mins',
            format: String
        },
        full_response: {
            doc: 'Set to true to receive the full Elasticsearch query response including index metadata.',
            default: false,
            format: Boolean
        },
        date_field_name: {
            doc: 'field name where the date of the doc is located',
            default: '',
            format: 'required_String'
        }
    };
}

module.exports = {
    newReader: newReader,
    newSlicer: newSlicer,
    schema: schema
};
