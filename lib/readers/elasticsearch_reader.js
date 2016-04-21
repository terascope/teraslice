'use strict';

var Promise = require('bluebird');
var moment = require('moment');
var processInterval = require('./../utils/elastic_utils').processInterval;
var getTimes = require('./../utils/elastic_utils').getTimes;
var getClient = require('../utils/config').getClient;
var buildQuery = require('./../utils/elastic_utils').buildQuery;
var buildRangeQuery = require('./../utils/elastic_utils').buildRangeQuery;
var dateFormat = require('./../utils/elastic_utils').dateFormat;
var parser = require('datemath-parser');


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

function checkElasticsearch(client, opConfig, logger) {
    return client.cluster.stats({}).then(function(data) {
        var version = data.nodes.versions[0];

        if (checkVersion(version)) {
            return client.indices.getSettings({}).then(function(results) {
                //TODO needs error handling if index doesn't exist
                var data = results[opConfig.index].settings.index.max_result_window;
                var window = data ? data : 10000;

                logger.info(' max_result_window for index: ' + opConfig.index + ' is set at ' + window + '. On very' +
                    ' large indices it is possible that a slice can not be divided to stay below this limit. ' +
                    'If that occurs an error will be thrown by Elasticsearch and the slice can not be processed. ' +
                    'Increasing max_result_window in the Elasticsearch index settings will resolve the problem. ');
            }).catch(function() {
                logger.error('index specified in reader does not exist')
            })
        }
    });
}

function determineSlice(client, config, start, end, size) {
    return client.count({
        index: config.index,
        body: buildRangeQuery(config, {start: start.format(dateFormat), end: end.format(dateFormat)})
    })
        .then(function(data) {
            if (data.count > size) {
                //find difference in milliseconds and divide in half
                var diff = Math.floor(end.diff(start) / 2);
                var newEnd = moment(start).add(diff, 'ms');

                //prevent recursive call if difference is one millisecond
                if (diff < 2) {
                    return {start: start, end: newEnd, count: data.count};
                }
                else {
                    return determineSlice(client, config, start, newEnd, size)
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

function checkVersion(str) {
    var num = Number(str.replace(/\./g, ''));
    return num >= 210;
}

function nextChunk(opConfig, client, jobConfig, dates) {

    var size = opConfig.size;
    var interval = processInterval(opConfig.interval);
    var start = moment(dates.start);
    var limit = moment(dates.end);
    var end = moment(start.format(dateFormat)).add(interval[0], interval[1]);

    return function(msg) {
        if (start.isSameOrAfter(limit)) {
            return null;
        }
        else {
            return determineSlice(client, opConfig, start, end, size)
                .then(function(data) {
                    start = data.end;
                    if (moment(data.end).add(interval[0], interval[1]) > limit) {
                        end = moment(data.end).add(limit - data.end);
                    }
                    else {
                        end = moment(data.end).add(interval[0], interval[1]);
                    }

                    return {
                        start: data.start.format(dateFormat),
                        end: data.end.format(dateFormat),
                        count: data.count
                    }
                }
            );
        }
    };

}

function awaitChunk(opConfig, client, jobConfig) {
    var size = opConfig.size;

    var dates = getTimes(opConfig);
    var delayTime = dates.delayTime;
    var start = dates.start;
    var end = dates.end;
    var limit = dates.limit;
    var interval = dates.interval;

    setInterval(function() {
        if (start.format(dateFormat) === end.format(dateFormat)) {
            end.add(interval[0], interval[1])
        }
        limit.add(interval[0], interval[1])
    }, delayTime);

    return function(msg) {
        if (start.isSameOrAfter(limit)) {
            return null;
        }
        else {

            return determineSlice(client, opConfig, start, end, size)
                .then(function(data) {

                    start = data.end;
                    if (moment(data.end).add(interval[0], interval[1]) > limit) {
                        end = moment(data.end).add(limit - data.end);

                    }
                    else {
                        end = moment(data.end).add(interval[0], interval[1]);
                    }

                    return {start: data.start.format(dateFormat), end: data.end.format(dateFormat), count: data.count}
                }
            );
        }
    };
}

function divideRange(start, end, numOfSlicers) {

    var results = [];
    var startNum = Number(moment(start).format('x'));
    var endNum = Number(moment(end).format('x'));
    var range = (endNum - startNum) / numOfSlicers;

    var step = moment(start);

    for (var i = 0; i < numOfSlicers; i++) {
        results.push({start: step.format(dateFormat), end: step.add(range).format(dateFormat)});
    }

    return results;
}

function parseDate(date) {
    var result;

    if (moment(new Date(date)).isValid()) {
        result = moment(new Date(date));
    }
    else {
        try {
            var ms = parser.parse(date);
            result = moment(date)
        }
        catch (e) {
            throw new Error('elasticsearch_reader start and/or end dates are invalid')
        }
    }

    return result;
}

function getIndexDate(opConfig, client, date, order) {
    //if an actual date is given, no need to query
    if (date) {
        return parseDate(date)
    }
    var sortObj = {};
    var sortOrder = order === 'start' ? 'asc' : 'desc';

    sortObj[opConfig.date_field_name] = {order: sortOrder};

    var query = {
        index: opConfig.index,
        size: 1,
        body: {
            sort: [
                sortObj
            ]
        }
    };

    if (opConfig.query) {
        query.q = opConfig.query;
    }

    return client.search(query).then(function(data) {
        if (order === 'start') {
            return parseDate(data.hits.hits[0]._source[opConfig.date_field_name])
        }
        else {
            //end date is non-inclusive, adding 1s so range will cover it
            var date = data.hits.hits[0]._source[opConfig.date_field_name];
            var time = moment(date).add(1, 's');
            return parseDate(time.format(dateFormat));
        }
    }).catch(function(e) {
        throw new Error('Could not retrieve ' + order + ' date for index: ' + e)
    });

}

function getDates(context, opConfig) {
    var client = getClient(context, opConfig, 'elasticsearch');
    return Promise.resolve(getIndexDate(opConfig, client, opConfig.start, 'start'))
        .then(function(startDate) {
            return Promise.resolve(getIndexDate(opConfig, client, opConfig.end, 'end'))
                .then(function(endDate) {
                    return {start: startDate, limit: endDate};
                });
        });
}

function newSlicer(context, opConfig, jobConfig) {
    var client = getClient(context, opConfig, 'elasticsearch');
    var isPersistent = jobConfig.lifecycle === 'persistent';
    var slicers = [];

    return checkElasticsearch(client, opConfig, context.logger)
        .then(function() {
            return getDates(context, opConfig)
        })
        .then(function(esDates) {
            var dateRange = divideRange(esDates.start, esDates.limit, jobConfig.slicers);

            dateRange.forEach(function(dates) {
                if (isPersistent) {
                    slicers.push(awaitChunk(opConfig, client, jobConfig));
                }
                else {
                    slicers.push(nextChunk(opConfig, client, jobConfig, dates));
                }
            });

            return slicers;
        })
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
            format: 'integer'
        },
        start: {
            doc: 'The start date (ISOstring or in ms) to which it will read from ',
            default: null
        },
        end: {
            doc: 'The end date (ISOstring or in ms) to which it will read to',
            default: null

        },
        interval: {
            doc: 'The time interval in which it will read from, the number must be separated from the unit of time ' +
            'by an underscore. The unit of time may be months, weeks, days, hours, minutes, seconds, millesconds ' +
            'or their appropriate abbreviations',
            default: '5mins',
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
