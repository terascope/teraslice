'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

const { TestContext } = require('@terascope/teraslice-types');
const { validateJobConfig, validateOpConfig, jobSchema } = require('@terascope/job-components');

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
    // TODO: make this work for slicers/readers
    return {
        operations: [
            {
                _op: 'noop'
            },
            opConfig
        ],
    };
}

function bindThis(instance, cls) {
    return Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
        .filter((name) => {
            const method = instance[name];
            return method instanceof Function && method !== cls;
        })
        .forEach((mtd) => {
            instance[mtd] = instance[mtd].bind(instance);
        });
}

class Operation {
    constructor({
        op,
        context,
        opConfig,
        logger,
        retryData,
        executionConfig,
        executionContext
    }) {
        this.operationFn = op;
        this.context = context;
        this.logger = logger;
        this.retryData = retryData;
        this.executionConfig = executionConfig;
        this.executionContext = executionContext;
        this.opConfig = opConfig;

        this.isProcessor = op.newProcessor !== undefined;
        this.isReader = op.newReader !== undefined;
        this.isSlicer = op.newSlicer !== undefined;
        this._hasInit = false;
        bindThis(this, Operation);
    }

    async init() {
        const {
            context,
            logger,
            retryData = [],
            executionContext,
            operationFn: op,
            opConfig,
            executionConfig
        } = this;

        if (!this._hasInit) {
            if (this.isProcessor) {
                this.operation = await op.newProcessor(context, opConfig, executionConfig);
            }
            if (this.isReader) {
                this.operation = await op.newReader(context, opConfig, executionConfig);
            }
            if (this.isSlicer) {
                this.operation = await op.newSlicer(context, executionContext, retryData, logger);
            }
            this._hasInit = true;
        }
        return this;
    }

    async run(slice) {
        if (!this._hasInit) await this.init();
        if (this.isSlicer) {
            // if just one slicer, return one value
            if (this.operation.length === 1) {
                return this.operation[0]();
            }
            const invocations = this.operation.map(fn => fn());
            return Promise.all(invocations);
        }
        return this.operation(slice);
    }
}
// TODO: cleanup extra parameters that this does not need
class TestHarness {
    constructor(op) {
        // TODO:this need to be changable;
        this.context = new TestContext('teraslice-op-test-harness');
        this.schema = jobSchema(this.context);
        this.events = this.context.apis.foundation.getSystemEvents();
        this.logger = this.context.logger;
        this.operationFn = op;
        // This is for backwards compatiblity
        this._jobSpec = jobSpec;
        bindThis(this, TestHarness);
    }

    async init(_opConfig = { _op: 'test-op-name' }) {
        const {
            context,
            logger,
            retryData = [],
            executionContext,
            operationFn: op,
        } = this;

        let { opConfig, executionConfig } = this;

        if (!opConfig) {
            opConfig = _opConfig._op === 'test-op-name' ? _opConfig : validateOpConfig(op.schema(), _opConfig);
        }
        if (!executionConfig) executionConfig = validateJobConfig(this.schema, jobSpec(opConfig));

        const instance = new Operation({
            op,
            context,
            opConfig,
            logger,
            retryData,
            executionConfig,
            executionContext
        });

        return instance.init();
    }

    async processData(opConfig, data) {
        const op = await this.init(opConfig);
        return op.run(data);
    }
    // TODO: Im not sure this should be here, maybe this should all be in init

    async setup({
        opConfig = null,
        executionConfig = null,
        context = null,
        retryData = null
    }) {
        const _opConfig = this.opConfig || {};
        const _executionConfig = this.executionConfig || {};
        const _context = this.context || {};

        if (opConfig) this.opConfig = Object.assign({}, _opConfig, opConfig);

        if (retryData) this.retryData = retryData;

        if (executionConfig) {
            const newExecutionConfig = Object.assign({}, _executionConfig, executionConfig);
            this.executionConfig = newExecutionConfig;
            this.executionContext = { config: _.cloneDeep(newExecutionConfig) };
        }

        if (context) this.context = Object.assign({}, _context, context);

        return this.init();
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
        const isOp = _.get(_opConfig, '_op');
        const opConfig = isOp ? _opConfig : { _op: 'test-op-name' };
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
        // TODO: this is not needed
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

    // eslint-disable-next-line class-methods-use-this
    get data() {
        return {
            simple: simpleData.slice(),
            arrayLike: sampleDataArrayLike.slice(),
            esLike: _.cloneDeep(sampleDataEsLike)
        };
    }
}

module.exports = op => new TestHarness(op);
