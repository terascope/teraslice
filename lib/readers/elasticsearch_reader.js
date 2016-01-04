'use strict';

var Promise = require('bluebird');
var moment = require('moment');
var processInterval = require('./elastic_utils').processInterval;
var checkVersion = require('./elastic_utils').checkVersion;
var getTimes = require('./elastic_utils').getTimes;
var getClient = require('../utils/config').getClient;
var findInterval = require('./elastic_utils').findInterval;
var buildRangeQuery = require('./elastic_utils').buildRangeQuery;
var buildQuery = require('./elastic_utils').buildQuery;


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

function determineSlice(client, config, start, end, size) {
    return client.count({
        index: config.index,
        body: buildRangeQuery(config, {start: start.format(), end: end.format()})
    })
        .then(function(data) {
            if (data.count > size) {
                //find difference in milliseconds and divide in half
                var diff = Math.floor(end.diff(start) / 2);
                //must return an over sized chunk if time cannot split
                if (diff === 0) {
                    return {start: start, end: end, count: data.count};
                }
                else {
                    var newEnd = moment(start).add(diff, 'ms');
                    //prevent recursive call if newEnd is same as start
                    if (start.format() === newEnd.format()) {
                        return {start: start, end: end, count: data.count};
                    }
                    else {
                        return determineSlice(client, config, start, newEnd, size)
                    }
                }
            }
            else {
                return {start: start, end: end, count: data.count};
            }
        })
        .catch(function(e) {
            console.log('index: "' + config.index + '" does not exist \n', e.body);
            process.exit();
        })
}

function nextChunk(opConfig, client) {
    var client = client;
    var config = opConfig;
    var size = config.size;
    var start = moment.utc(config.start);
    var interval = processInterval(config.interval);
    var end = moment.utc(config.start).add(interval[0], interval[1]);
    var limit = moment.utc(config.end);

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

function checkElasticsearch(client, opConfig, logger) {
    client.cluster.stats({}).then(function(data) {
        var version = data.nodes.versions[0];

        if (checkVersion(version)) {
            client.indices.getSettings({}).then(function(results) {
                //TODO needs error handling if index doesn't exist
                var data = results[opConfig.index].settings.index.max_result_window;
                var window = data ? data : 10000;

                logger.info(' max_result_window for index: ' + opConfig.index + ' is set at ' + window + '. On very' +
                    ' large indices it is possible that a slice can not be divided to stay below this limit. ' +
                    'If that occurs an error will be thrown by Elasticsearch and the slice can not be processed. ' +
                    'Increasing max_result_window in the Elasticsearch index settings will resolve the problem. ');
            })
        }
    });
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
    schema: schema,
    determineSlice: determineSlice,
    checkElasticsearch: checkElasticsearch
};
