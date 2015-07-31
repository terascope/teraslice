'use strict';
var Promise = require('bluebird');
var moment = require('moment');
//var counter = 0;

//TODO check out dates better
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

function getData(client, source, msg) {
    var query = buildQuery(source, msg);
    return client.search(query);
}

function processData(data, query) {
    //TODO deal with indexing to multiple places
    var dataArray = data.hits.hits;
    var length = dataArray.length;
    var start = 0;
    var formated = [];
    var index = query.index;
    var type = query.type;

    while (start < length) {
        formated.push({"index": {"_index": index, "_type": type, "_id": dataArray[start]._id}});
        formated.push(dataArray[start]._source);
        start++;
    }

    return formated;
}

function sendData(client, data) {
    //bulk throws an error if you send an empty array
    if (data.length === 0) {
        return Promise.resolve(null);
    }
    else {
        return client.bulk({body: data});
    }
}

function dateOptions(value) {

    var timeInterval = value.toLowerCase();
    var options = {
        months: 'M', month: 'M', mo: 'M', mos: 'M',
        weeks: 'w', week: 'w', wks: 'w', wk: 'w', w: 'w',
        days: 'd', day: 'd', d: 'd',
        hours: 'h', hour: 'h', hr: 'h', hrs: 'h', h: 'h',
        minutes: 'm', minute: 'm', min: 'm', mins: 'm', m: 'm',
        seconds: 's', second: 's', s: 's',
        milliseconds: 'ms', millisecond: 'ms', ms: 'ms'
    };

    if (options[timeInterval]) {
        return options[timeInterval];
    }
    else {
        throw new Error('date interval is not formatted correctly')
    }
}

function processInterval(str) {
    var interval = str.split("_");
    interval[1] = dateOptions(interval[1]);
    return interval;
}
//might have to many calls to client
function determineSlice(client, config, start, end, size) {
    return client.count({
        index: config.index,
        body: buildRangeQuery(config, {start: start.format(), end: end.format()})
    })
        .then(function (data) {
            if (data.count > size) {
                //find difference in milliseconds and divide in half
                console.log("I had to recurse")
                var diff = Math.floor(end.diff(start) / 2);
                var newEnd = moment(start).add(diff, 'ms');
                return determineSlice(client, config, start, newEnd, size)
            }
            else {
               /* counter += data.count;
                console.log('this is counter', counter)*/
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

    return function () {
        if (start >= limit) {
            return null;
        }
        else {
            return determineSlice(client, config, start, end, size)
                .then(function (data) {
                    start = data.end;
                    if (moment(data.end).add(interval[0], interval[1]) > limit) {
                        end = moment(data.end).add(limit - data.end);
                    }
                    else{
                        end = moment(data.end).add(interval[0], interval[1]);
                    }

                    return {start: data.start.format(), end: data.end.format()}
                }
            );
        }
    };
}

module.exports = {
    getData: getData,
    processData: processData,
    sendData: sendData,
    nextChunk: nextChunk
};