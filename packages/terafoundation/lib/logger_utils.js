'use strict';

var util = require('util');
var moment = require('moment');
var bunyan = require('bunyan');
var Promise = require('bluebird');

var levelsObj = {
    10: 'trace',
    20: 'debug',
    30: 'info',
    40: 'warn',
    50: 'error',
    60: 'fatal'
};

var indexFormat = {
    daily: 'YYYY.MM.DD',
    monthly: 'YYYY.MM',
    yearly: 'YYYY'
};

function RingBuffer(index_name, limit, delay, client, timeseriesFormat) {
    var rlimit = limit ? limit : 500;
    this.index_name = index_name;
    this.timeseriesFormat = timeseriesFormat;
    if (client) {
        this.client = client;
    }

    bunyan.RingBuffer.call(this, {limit: rlimit});
    var self = this;
    //set a timer to flush logs 
    this.interval = setInterval(function() {
        self.sendBulk();
    }, delay)
}
util.inherits(RingBuffer, bunyan.RingBuffer);

RingBuffer.prototype.write = function(record) {
    if (!this.writable) {
        throw (new Error('RingBuffer has been ended already'));
    }
    this.records.push(record);

    if (this.records.length >= this.limit) {
        this.sendBulk();
    }

    return (true);
};

RingBuffer.prototype.sendBulk = function() {
    var data = this.records;
    var client = this.client;
    var index_name = this.index_name;
    var timeseriesFormat = this.timeseriesFormat;

    var esData = data.reduce(function(prev, record) {
        prev.push({
            "index": {
                "_index": `${index_name}__logs-${moment(record.time).format(indexFormat[timeseriesFormat])}`,
                "_type": "logs"
            }
        });
        prev.push(parseRecord(record));
        return prev;
    }, []);

    //delete old records
    this.records = [];

    if (esData.length > 0) {
        return client.bulk({body: esData})
            .then(function(res) {
                if (res.errors) {
                    console.log('whats this error', JSON.stringify(res));
                    res.items.forEach(function(item) {
                        console.log(item.create)
                    })
                }
            })
            .catch(function(err) {
                var errMsg = err.toJSON ? err.toJSON : err.stack;
                return Promise.reject(errMsg)
            })
    }
    else {
        return Promise.resolve(true)
    }
};

RingBuffer.prototype.flush = function() {
    var interval = this.interval;
    if (this.records.length > 0) {
        clearInterval(interval);
        return this.sendBulk();
    }
    else {
        clearInterval(interval);
        return Promise.resolve(true)
    }
};

RingBuffer.prototype.setBufferClient = function(client) {
    this.client = client;
};

function loggerClient(context, logger, logging_connection) {
    var esClient = logger.streams.filter(function(stream) {
        if (stream.stream instanceof RingBuffer) {
            return stream
        }
    });

    if (esClient.length > 0) {
        var client = context.foundation.getConnection({
            type: 'elasticsearch',
            endpoint: logging_connection,
            cached: true
        }).client;
        esClient[0].stream.setBufferClient(client)
    }
}

function parseRecord(record) {
    record.level = levelsObj[record.level];
    return record;
}


module.exports = {
    RingBuffer: RingBuffer,
    loggerClient: loggerClient
};
