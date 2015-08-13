'use strict';
var Promise = require('bluebird');
var moment = require('moment');
var processInterval = require('./elastic_utils').processInterval;

function newReader(context, opConfig, jobConfig) {
    var context = context;
    var opConfig = opConfig;
    //TODO make this set dynamically by config
    var client = context.elasticsearch.default;

    return function(msg) {
        var query = buildQuery(opConfig, msg);
        return client.search(query);
    }
}

function buildRangeQuery(source, obj) {
    var dateFieldName = source.dateFieldName;
    var dateObj = {};
    dateObj[dateFieldName] = {
        gte: obj.start,
        lt: obj.end
    };

    var body = {
        query: {
            filtered: {
                filter: {
                    range: dateObj
                }
            }
        }
    };

    return body;
}

function buildQuery(source, msg) {

    var query = {
        index: source.index,
        size: source.size,
        body: buildRangeQuery(source, msg)
    };

    return query;
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
                var newEnd = moment(start).add(diff, 'ms');
                return determineSlice(client, config, start, newEnd, size)
            }
            else {
                return {start: start, end: end};
            }
        })
}

function nextChunk(sourceConfig, client) {
    var client = client;
    var config = sourceConfig;
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

                    return {start: data.start.format(), end: data.end.format()}
                }
            );
        }
    };
}

function newSlicer(context, opConfig, jobConfig) {
    var context = context;
    var opConfig = opConfig;
    return nextChunk(opConfig, context.elasticsearch.default)
}

module.exports = {
    newReader: newReader,
    newSlicer: newSlicer
};