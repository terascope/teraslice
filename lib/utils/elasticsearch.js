'use strict';
var Promise = require('bluebird');
var moment = require('moment');


function buildQuery(source, msg) {
    var dateFieldName = source.dateFieldName;
    var dateObj = {};
    dateObj[dateFieldName] = {
        gte: msg.start,
        lt: msg.end
    };

    var body = {
        index: source.index,
        size: source.size,
        body: {
            query: {
                filtered: {
                    filter: {
                        range: dateObj
                    }
                }
            }
        }
    };

    return body;
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
        return
    }
    else {
        return client.bulk({body: data});
    }
}

function nextChunk(config) {
    var start = moment(config.start);
    var interval = config.interval.split('_');
    var end = moment(config.start).add(interval[0], interval[1]);
    var limit = moment(config.end);
    var wasCalled = false;

    return function () {
        if (wasCalled) {
            start = start.add(interval[0], interval[1]);
            end = end.add(interval[0], interval[1]);
            if (start > limit) {
                return null;
            }
            return {start: start.format(), end: end.format()};
        }
        else {
            wasCalled = true;
            return {start: start.startOf(interval[1]).format(), end: end.startOf(interval[1]).format()};
        }
    }
}

module.exports = {
    getData: getData,
    processData: processData,
    sendData: sendData,
    nextChunk: nextChunk
};