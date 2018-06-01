'use strict';

const util = require('util');
const moment = require('moment');
const bunyan = require('bunyan');
const Promise = require('bluebird');

const levelsObj = {
    10: 'trace',
    20: 'debug',
    30: 'info',
    40: 'warn',
    50: 'error',
    60: 'fatal'
};

const indexFormat = {
    daily: 'YYYY.MM.DD',
    monthly: 'YYYY.MM',
    yearly: 'YYYY'
};

function RingBuffer(index, limit, delay, client, timeseriesFormat) {
    const rlimit = limit || 500;
    this.index = index;
    this.timeseriesFormat = timeseriesFormat;
    if (client) {
        this.client = client;
    }

    bunyan.RingBuffer.call(this, { limit: rlimit });
    const self = this;
    // set a timer to flush logs
    this.interval = setInterval(() => {
        self.sendBulk();
    }, delay);
}
util.inherits(RingBuffer, bunyan.RingBuffer);

RingBuffer.prototype.write = function (record) {
    if (!this.writable) {
        throw (new Error('RingBuffer has been ended already'));
    }
    this.records.push(record);

    if (this.records.length >= this.limit) {
        this.sendBulk();
    }

    return (true);
};

RingBuffer.prototype.sendBulk = function () {
    const {
        records, client, index, timeseriesFormat
    } = this;

    const esData = records.reduce((prev, record) => {
        prev.push({
            index: {
                _index: `${index}__logs-${moment(record.time).format(indexFormat[timeseriesFormat])}`,
                _type: 'logs'
            }
        });
        prev.push(parseRecord(record));
        return prev;
    }, []);

    // delete old records
    this.records = [];

    if (esData.length > 0) {
        return client.bulk({ body: esData })
            .then((res) => {
                if (res.errors) {
                    console.log('whats this error', JSON.stringify(res));
                    res.items.forEach((item) => {
                        console.log(item.create);
                    });
                }
            })
            .catch((err) => {
                const errMsg = err.toJSON ? err.toJSON : err.stack;
                return Promise.reject(errMsg);
            });
    }

    return Promise.resolve(true);
};

RingBuffer.prototype.flush = function () {
    const { interval } = this;
    if (this.records.length > 0) {
        clearInterval(interval);
        return this.sendBulk();
    }

    clearInterval(interval);
    return Promise.resolve(true);
};

RingBuffer.prototype.setBufferClient = function (client) {
    this.client = client;
};

function loggerClient(context, logger, loggingConnection) {
    const esClient = logger.streams.filter((stream) => {
        if (stream.stream instanceof RingBuffer) {
            return stream;
        }
    });

    if (esClient.length > 0) {
        const { client } = context.foundation.getConnection({
            type: 'elasticsearch',
            endpoint: loggingConnection,
            cached: true
        });

        esClient[0].stream.setBufferClient(client);
    }
}

function parseRecord(record) {
    record.level = levelsObj[record.level];
    return record;
}


module.exports = {
    RingBuffer,
    loggerClient
};
