'use strict';

const procProcessor = require('./proc/processor');
const procSchema = require('./proc/schema');
const procSlicer = require('./proc/slicer');

const proc2API = require('./proc2/api');
const proc2Schema = require('./proc2/schema');
const proc2Fetcher = require('./proc2/fetcher');

module.exports = {
    proc: {
        Processor: procProcessor,
        Schema: procSchema,
        Slicer: procSlicer
    },
    proc2: {
        API: proc2API,
        Schema: proc2Schema,
        Fetcher: proc2Fetcher
    }
};
