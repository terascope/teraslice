'use strict';

var Promise = require('bluebird');
var moment = require('moment');
var processInterval = require('./../utils/elastic_utils').processInterval;
var checkElasticsearch = require('./../utils/elastic_utils').checkElasticsearch;
var getTimes = require('./../utils/elastic_utils').getTimes;
var getClient = require('../utils/config').getClient;
var buildQuery = require('./../utils/elastic_utils').buildQuery;
var determineSlice = require('./../utils/elastic_utils').determineSlice;
var dateFormat = require('./../utils/elastic_utils').dateFormat;
var getDates = require('./../utils/elastic_utils').getDates;


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
    var size = opConfig.size;
    var interval = processInterval(opConfig.interval);

    return function(msg) {
        if (start.isSameOrAfter(limit)) {
            console.log('getting the limit');
            return null;
        }
        else {
            console.log('running slice');
            return determineSlice(client, opConfig, start, end, size)
                .then(function(data) {
                    start = data.end;
                    if (moment(data.end).add(interval[0], interval[1]) > limit) {
                        end = moment(data.end).add(limit - data.end);
                    }
                    else {
                        end = moment(data.end).add(interval[0], interval[1]);
                    }
                    console.log('returning a slice from slicer');
                    return {start: data.start.format(dateFormat), end: data.end.format(dateFormat), count: data.count}
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
        });

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
