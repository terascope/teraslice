var sampleDataArrayLike = require('./data/sampleDataArrayLike.json');
var sampleDataEsLike = require('./data/sampleDataEsLike.json');

/**
 * Teraslice Processor Test Framework
 * @module teraslice_processor_test_framework
 */
module.exports = {
    /** Fake logger object with empty method definitions.  Suitable for use as
     *  the general teraslice logger or as the sliceLogger.  Implements the
     *  following log levels:
     *    - `fatal`
     *    - error
     *    - warn
     *    - info
     *    - debug
     *    - trace
     *  Which are derived from bunyan's default levels:
     *    https://github.com/trentm/node-bunyan#levels
     */
    fakeLogger: {
        logger: {
            fatal: function() {},
            error: function() {},
            warn: function() {},
            info: function() {},
            debug: function() {},
            trace: function() {},
        },
    },
    /** Standard test data objects: arrayLike and esLike */
    data: {
        /** Sample data in the form of an array of JSON documents , like would
        *   come from the elasticsearch_data_generator
        */
        arrayLike: sampleDataArrayLike,
        /** Sample data in the form of an array of Elasticsearch query response.
         *   documents
         */
        esLike: sampleDataEsLike
    }
};
