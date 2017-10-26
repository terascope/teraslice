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
    describe('test harness', function() {
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
    /* A minimal context object */
    var context = {
        logger: fakeLogger.logger,
        sysconfig:
            {
                teraslice: {
                    ops_directory: ''
                }
            },
        apis: {
            registerAPI() {},
        }
    };

    // Baseline op configuration. By default this is just empty.
    var baseOpConfig = {};

    var jobSchema = require('teraslice/lib/config/schemas/job').jobSchema(context);

    /**
     * jobSpec returns a simple jobConfig object consisting of two operations,
     * the first one `noop` and the second one the op being tested.  If the
     * optional opConfig object is passed in as a second argument it is merged
     * with the template opConfig for the second operation.
     * @param  {Object} opConfig an optional partial opConfig
     * @return {Object}          a jobConfig object
     */

    function jobSpec(opConfig) {
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

    function run(data, extraOpConfig, extraContext) {
        return Promise.resolve(getProcessor(extraOpConfig, extraContext))
            .then(function(proc) {
                return process(proc, data);
            });
    }

    function getProcessor(extraOpConfig, extraContext) {
        // run the jobConfig and opConfig through the validator to get
        // complete and convict validated configs
        var jobConfig = validator.validateConfig(jobSchema, jobSpec(extraOpConfig));

        var opConfig = _.merge(baseOpConfig, extraOpConfig);
        opConfig = validator.validateConfig(processor.schema(), opConfig);

        context = _.merge(context, extraContext);
        context = validator.validateConfig(processor.schema(), context);

        return processor.newProcessor(
            context,
            opConfig,
            jobConfig);
    }

    function process(myProcessor, data) {
        return myProcessor(data, fakeLogger.logger);
    }

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
        run: run,
        getProcessor: getProcessor,
        process, process
    };
};
