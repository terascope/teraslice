var sampleDataArrayLike = require('./data/sampleDataArrayLike.json');
var sampleDataEsLike = require('./data/sampleDataEsLike.json');

var fakeLogger = {
    logger: {
        fatal: function() {},
        error: function() {},
        warn: function() {},
        info: function() {},
        debug: function() {},
        trace: function() {},
    }
};

var simpleData = [
    {'name': 'Skippy', 'age': 20},
    {'name': 'Flippy', 'age': 21},
    {'name': 'Hippy', 'age': 22},
    {'name': 'Dippy', 'age': 23},
];


/**
 * Teraslice Processor Test Framework
 * @module teraslice_processor_test_framework
 */
module.exports = (op) => {
    return {
        /* Setup mock contexts for processor, each processor takes:
         *   context - global teraslice/terafoundation context object
         *   op - configuration of the specific operation being executed (the processor)
         *   jobConfig - details on this jobs configuration
         *   sliceLogger - a logger instance for each slice
         */
        context: {},
        op: {'_op': op},
        jobConfig: {fakeLogger},

        /** Fake logger object with empty method definitions.  Suitable for use as
         *  the general teraslice logger or as the sliceLogger.  Implements the
         *  following log levels:
         *    - fatal
         *    - error
         *    - warn
         *    - info
         *    - debug
         *    - trace
         *  Which are derived from bunyan's default levels:
         *    https://github.com/trentm/node-bunyan#levels
         */
        fakeLogger: fakeLogger,

        /** Standard test data objects: arrayLike and esLike */
        data: {
            /**
             * A very simple and small array of JSON objects
             */
            simple: simpleData,
            /**
             * Sample data in the form of an array of JSON documents , like would
             *   come from the elasticsearch_data_generator
             */
            arrayLike: sampleDataArrayLike,
            /**
             * Sample data in the form of an array of Elasticsearch query response.
             *   documents
             */
            esLike: sampleDataEsLike
        }
    };
};
