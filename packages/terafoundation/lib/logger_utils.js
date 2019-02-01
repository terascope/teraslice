'use strict';

const util = require('util');
const moment = require('moment');
const bunyan = require('bunyan');
const Promise = require('bluebird');
const esApi = require('@terascope/elasticsearch-api');

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
    }, 1000);
}
util.inherits(RingBuffer, bunyan.RingBuffer);

RingBuffer.prototype.write = function write(record) {
    if (!this.writable) {
        throw (new Error('RingBuffer has been ended already'));
    }
    this.records.push(record);

    if (this.records.length >= this.limit) {
        this.sendBulk();
    }

    return (true);
};

RingBuffer.prototype.sendBulk = async function sendBulk() {
    const {
        records, client, index, timeseriesFormat, logger
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
        try {
            const results = await client.bulkSend(esData, logger);
            return results;
        } catch (err) {
            logger.error(err, `failed to send logs to index: ${index}`);
            // non retrialbe error, so we return. We do not return an error
            // as that could have other side effects in teraslice
            return true;
        }
    }

    return true;
};

RingBuffer.prototype.flush = function flush() {
    const { interval } = this;
    if (this.records.length > 0) {
        clearInterval(interval);
        return this.sendBulk();
    }

    clearInterval(interval);
    return Promise.resolve(true);
};

RingBuffer.prototype.setBufferClient = function setBufferClient(client, logger) {
    this.client = client;
    this.logger = logger;
};

function loggerClient(context) {
    const {
        logger,
        sysconfig: { terafoundation: { log_connection: endpoint } }
    } = context;

    const esClient = logger.streams.filter((stream) => {
        if (stream.stream instanceof RingBuffer) {
            return stream;
        }
        return false;
    });

    if (esClient.length > 0) {
        const { client } = context.foundation.getConnection({
            type: 'elasticsearch',
            endpoint,
            cached: true
        });
        const api = esApi(client, logger);
        esClient[0].stream.setBufferClient(api, logger);
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
