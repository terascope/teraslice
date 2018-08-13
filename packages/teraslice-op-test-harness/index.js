'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const { EventEmitter } = require('events');
const debug = require('debug')('teraslice-op-test-harness');

const { validators, schemas } = require('@terascope/teraslice-validators');

// load data
const sampleDataArrayLike = require('./data/sampleDataArrayLike.json');
const sampleDataEsLike = require('./data/sampleDataEsLike.json');

const simpleData = [
    { name: 'Skippy', age: 20 },
    { name: 'Flippy', age: 21 },
    { name: 'Hippy', age: 22 },
    { name: 'Dippy', age: 23 },
];

const fakeLogger = {
    logger: {
        fatal(...args) {
            debug('fatal:', ...args);
        },
        error(...args) {
            debug('error:', ...args);
        },
        warn(...args) {
            debug('warn:', ...args);
        },
        info(...args) {
            debug('info:', ...args);
        },
        debug(...args) {
            debug('debug:', ...args);
        },
        trace(...args) {
            debug('trace:', ...args);
        },
    }
};

function runProcessorSpecs(processor) {
    // TODO: I'd like to refactor this out into a stand-alone spec file in a
    // subdirectory, but this will do for now.
    describe('test harness', () => {
        it('has a schema and newProcessor method', () => {
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
    const events = new EventEmitter();
    const context = {
        logger: fakeLogger.logger,
        foundation: {
            getEventEmitter: () => events, // Deprecated
            getSystemEvents: () => events,
            makeLogger: () => {},
            getConnection: () => ({ client: {} }),
            startWorkers: () => {}
        },
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

    const jobSchema = schemas.jobSchema(context);

    /**
     * jobSpec returns a simple jobConfig object consisting of two operations,
     * the first one `noop` and the second one the op being tested.
     * @param  {Object} opConfig an optional partial opConfig
     * @return {Object}          a jobConfig object
     */

    function jobSpec(opConfig) {
        return {
            operations: [
                {
                    _op: 'noop'
                },
                opConfig
            ],
        };
    }

    function run(data, extraOpConfig, extraContext) {
        return processFn(getProcessor(extraOpConfig, extraContext), data);
    }

    function runAsync(data, extraOpConfig, extraContext) {
        return Promise.resolve(getProcessor(extraOpConfig, extraContext))
            .then(proc => processFn(proc, data));
    }

    function runSlices(slices, extraOpConfig, extraContext) {
        const newProcessor = getProcessor(extraOpConfig, extraContext);
        return Promise.resolve(slices)
            .mapSeries(slice => processFn(newProcessor, slice))
            .then((results) => {
                // Not yet clear if this is general enough. Trying it out to
                // help keep callers simple.
                emulateShutdown();

                return Promise.resolve().then(() => processFn(newProcessor, [])).then((result) => {
                    results.push(result);
                    return results;
                });
            });
    }

    function getProcessor(opConfig, extraContext) {
        if (opConfig == null) {
            opConfig = {}; // eslint-disable-line no-param-reassign
        }
        // run the jobConfig and opConfig through the validator to get
        // complete and convict validated configs
        const jobConfig = validators.validateConfig(jobSchema, jobSpec(opConfig));

        return processor.newProcessor(
            _.assign({}, context, extraContext),
            validators.validateConfig(processor.schema(), opConfig),
            jobConfig
        );
    }

    function processFn(myProcessor, data) {
        return myProcessor(data, fakeLogger.logger);
    }

    function emulateShutdown() {
        events.emit('worker:shutdown');
    }

    return {
        /* Setup mock contexts for processor, each processor takes:
         *   context - global teraslice/terafoundation context object
         *   opConfig - configuration of the specific operation being executed (the processor)
         *   jobConfig - details on this jobs configuration
         *   sliceLogger - a logger instance for each slice
         */
        context,

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
        fakeLogger,

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
        runProcessorSpecs,
        run,
        runAsync,
        runSlices,
        emulateShutdown,
        getProcessor,
        process: processFn
    };
};
