var _ = require('lodash');

// load data
var sampleDataArrayLike = require('./data/sampleDataArrayLike.json');
var sampleDataEsLike = require('./data/sampleDataEsLike.json');

var simpleData = [
    {'name': 'Skippy', 'age': 20},
    {'name': 'Flippy', 'age': 21},
    {'name': 'Hippy', 'age': 22},
    {'name': 'Dippy', 'age': 23},
];

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

function runProcessorSpecs(processor) {
    // TODO: I'd like to refactor this out into a stand-alone spec file in a
    // subdirectory, but this will do for now.
    describe('The dupedoc processor', function() {
        it('has a schema and newProcessor method', function() {
            expect(processor).toBeDefined();
            expect(processor.newProcessor).toBeDefined();
            expect(processor.schema).toBeDefined();
            expect(typeof processor.newProcessor).toEqual('function');
            expect(typeof processor.schema).toEqual('function');
        });
    });
}

module.exports = (processor) => {
    var op = processor._op;
    /* A minimal context object */
    var context = {
        sysconfig:
            {
                teraslice: {
                    ops_directory: ''
                }
            }
    };

    var jobSchema = require('teraslice/lib/config/schemas/job').jobSchema(context);

    /**
     * jobSpec returns a simple jobConfig object consisting of two operations,
     * the first one `noop` and the second one the op being tested.  If the
     * optional opConfig object is passed in as a second argument it is merged
     * with the template opConfig for the second operation.
     * @param  {String} op       a string containing the name of the operation
     * @param  {Object} opConfig an optional partial opConfig
     * @return {Object}          a jobConfig object
     */
    function jobSpec(op, opConfig) {
        var baseOpConfig = {'_op': op};
        _.merge(baseOpConfig, opConfig);
        return {
            'operations': [
                {
                    '_op': 'noop'
                },
                baseOpConfig
            ],
        };
    }

    var validator = require('teraslice/lib/config/validators/config')();

    return {
        /* Setup mock contexts for processor, each processor takes:
         *   context - global teraslice/terafoundation context object
         *   opConfig - configuration of the specific operation being executed (the processor)
         *   jobConfig - details on this jobs configuration
         *   sliceLogger - a logger instance for each slice
         */
        context: context,

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
        },
        _jobSpec: jobSpec,
        runProcessorSpecs: runProcessorSpecs,
        run: function(data, extraOpConfig) {
            // run the jobConfig and opConfig through the validator to get
            // complete and convict validated configs
            var jobConfig = validator.validateConfig(jobSchema, jobSpec(op, extraOpConfig));
            jobConfig.operations = jobSpec(op, extraOpConfig).operations.map(function(opConfig) {
                return validator.validateConfig(processor.schema(), opConfig);
            });

            var myProcessor = processor.newProcessor(
                context, // context
                jobConfig.operations[1], // 1 is opConfig for current op, the 0th operation is a noop
                jobConfig); // jobConfig

            return myProcessor(data, fakeLogger.logger);
        },
    };
};
