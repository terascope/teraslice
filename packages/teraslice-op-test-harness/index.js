'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const {
    validateJobConfig,
    validateOpConfig,
    jobSchema,
    TestContext
} = require('@terascope/job-components');
const { bindThis } = require('./lib/utils');
const Operation = require('./lib/operation');

// load data
const sampleDataArrayLike = require('./data/sampleDataArrayLike.json');
const sampleDataEsLike = require('./data/sampleDataEsLike.json');

const simpleData = [
    { name: 'Skippy', age: 20 },
    { name: 'Flippy', age: 21 },
    { name: 'Hippy', age: 22 },
    { name: 'Dippy', age: 23 },
];

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

function wrapper(clientList) {
    return (config) => {
        const { type, endpoint } = config;
        const client = _.get(clientList, [type, endpoint], null);
        if (!client) throw new Error(`No client was found at type ${type}, endpoint: ${endpoint}`);
        return { client };
    };
}

class TestHarness {
    constructor(op) {
        this.context = new TestContext('teraslice-op-test-harness');
        this.schema = jobSchema(this.context);
        this.events = this.context.apis.foundation.getSystemEvents();
        this.logger = this.context.logger;
        this.operationFn = op;
        this._getConnetionIsWrapped = false;
        this.clientList = {};
        // This is for backwards compatiblity
        this._jobSpec = jobSpec;
        bindThis(this, TestHarness);
    }

    async processData(opConfig, data) {
        const op = await this.init({ opConfig });
        return op.run(data);
    }

    setClients(clients = []) {
        const { clientList, context } = this;

        clients.forEach((clientConfig) => {
            const { client, type, endpoint = 'default' } = clientConfig;

            if (!type || (typeof type !== 'string')) throw new Error('you must specify a type when setting a client');

            _.set(clientList, [type, endpoint], client);
            _.set(context, ['sysconfig', 'terafoundation', 'connectors', type, endpoint], {});
        });

        if (!this._getConnetionIsWrapped) {
            this._getConnetionIsWrapped = true;
            this.context.apis.foundation.getConnection = wrapper(clientList);
            this.context.foundation.getConnection = wrapper(clientList);
        }
    }

    async init({
        opConfig: newOpConfig = null,
        executionConfig: newExecutionConfig = null,
        context: newContext = null,
        retryData = [],
        clients = null,
        type = 'slicer'
    }) {
        const {
            context: _context,
            logger,
            operationFn: op,
        } = this;

        let opConfig;
        let executionConfig;
        let executionContext;
        let context = _context;

        if (newOpConfig) opConfig = validateOpConfig(op.schema(), newOpConfig);
        if (!newOpConfig) opConfig = { _op: 'test-op-name' };

        if (newExecutionConfig) {
            executionConfig = newExecutionConfig;
            this.executionConfig = executionConfig;
            executionContext = { config: _.cloneDeep(executionConfig) };
            this.executionContext = executionContext;
        }
        if (!newExecutionConfig) {
            executionConfig = validateJobConfig(this.schema, jobSpec(opConfig));
            this.executionConfig = executionConfig;
            executionContext = { config: _.cloneDeep(executionConfig) };
            this.executionContext = executionContext;
        }
        this.retryData = retryData;

        if (newContext) {
            context = Object.assign({}, _context, newContext);
            this.context = context;
        }

        if (clients) {
            this.setClients(clients);
        }

        const instance = new Operation({
            op,
            context,
            opConfig,
            logger,
            retryData,
            executionConfig,
            executionContext,
            type
        });

        return instance.init();
    }

    // This and below is for all backward compatible code

    run(data, extraOpConfig, extraContext) {
        const { processFn, getProcessor } = this;
        return processFn(getProcessor(extraOpConfig, extraContext), data);
    }

    runAsync(data, extraOpConfig, extraContext) {
        const { processFn, getProcessor } = this;
        return Promise.resolve(getProcessor(extraOpConfig, extraContext))
            .then(proc => processFn(proc, data));
    }

    runSlices(slices, extraOpConfig, extraContext) {
        const { processFn, getProcessor, emulateShutdown } = this;
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

    getProcessor(_opConfig, extraContext) {
        let opConfig = _opConfig;
        if (_opConfig == null) {
            opConfig = {};
        }

        if (!opConfig._op) {
            opConfig._op = 'test-op-name';
        }
        const operation = this.operationFn;
        const { schema, context } = this;
        // run the jobConfig and opConfig through the validator to get
        // complete and convict validated configs
        const jobConfig = validateJobConfig(schema, jobSpec(opConfig));
        return operation.newProcessor(
            _.assign({}, context, extraContext),
            validateOpConfig(operation.schema(), opConfig),
            jobConfig
        );
    }

    processFn(myProcessor, data) {
        const { logger } = this;
        return myProcessor(data, logger);
    }

    emulateShutdown() {
        this.events.emit('worker:shutdown');
    }

    get fakeLogger() {
        return this.logger;
    }

    set fakeLogger(logger) {
        this.logger = logger;
    }

    set process(processFn) {
        this.processFn = processFn;
    }

    get process() {
        return this.processFn;
    }

    runProcessorSpecs(processor) {
        // TODO: I'd like to refactor this out into a stand-alone spec file in a
        // subdirectory, but this will do for now.
        // TODO: this is not needed?
        this.fakeLogger.info();
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

    get data() {
        return {
            simple: simpleData.slice(),
            arrayLike: sampleDataArrayLike.slice(),
            esLike: _.cloneDeep(sampleDataEsLike)
        };
    }
}

module.exports = op => new TestHarness(op);
