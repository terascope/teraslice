import Promise from 'bluebird';
import {
    validateJobConfig, validateOpConfig, jobSchema,
    TestContext, newTestExecutionConfig, schemaShim,
    isFunction, cloneDeep,
} from '@terascope/job-components';
import { bindThis } from './lib/utils.js';
import Operation from './lib/operation.js';
import { createRequire } from "module";

const require = createRequire(import.meta.url);
// load data
const sampleDataArrayLike = require('./data/sampleDataArrayLike.json');
const sampleDataEsLike = require('./data/sampleDataEsLike.json');

const simpleData = [
    { name: 'Skippy', age: 20 },
    { name: 'Flippy', age: 21 },
    { name: 'Hippy', age: 22 },
    { name: 'Dippy', age: 23 },
];

function executionSpec(inputExConfig) {
    const newExConfig = newTestExecutionConfig();
    return Object.assign({}, newExConfig, inputExConfig);
}

class TestHarness {
    constructor(op) {
        this.context = new TestContext('teraslice-op-test-harness');
        this.schema = jobSchema(this.context);
        this.events = this.context.apis.foundation.getSystemEvents();
        this.logger = this.context.logger;
        this.operationFn = op;
        // This is for backwards compatiblity
        this._jobSpec = executionSpec;
        bindThis(this, TestHarness);
    }

    async processData(opConfig, data) {
        const op = await this.init({ opConfig });
        return op.run(data);
    }

    get clientList() {
        return this.context.apis.getTestClients();
    }

    setClients(clients = []) {
        const testClients = clients.map((config) => {
            const { client } = config;
            if (!isFunction(config.create)) {
                config.create = () => ({ client });
            }
            return config;
        });

        this.context.apis.setTestClients(testClients);
    }

    async init({
        opConfig: newOpConfig = null,
        executionConfig: newExConfig,
        retryData = [],
        clients = null,
        type = 'slicer'
    }) {
        const {
            context,
            logger,
            operationFn: op,
        } = this;

        const exConfig = executionSpec(newExConfig);

        const isProcessor = op.Processor || (op.newProcessor != null);
        const Schema = op.schema ? schemaShim(op).Schema : op.Schema;
        const schema = new Schema(context);

        let opConfig;
        // This is kind of pain to deal with
        // this can only work with exectionConfig
        // with two operations
        if (exConfig.operations.length < 2) {
            opConfig = schema.validate(newOpConfig || exConfig.operations[0]);
            if (isProcessor) {
                exConfig.operations = [{ _op: 'test-reader' }, opConfig];
            } else {
                exConfig.operations = [opConfig, { _op: 'noop' }];
            }
        } else {
            const opPosition = isProcessor ? 1 : 0;
            opConfig = schema.validate(newOpConfig || exConfig.operations[opPosition]);

            exConfig.operations[opPosition] = opConfig;
        }

        this.opConfig = opConfig;

        const executionConfig = validateJobConfig(this.schema, exConfig);
        schema.validateJob(executionConfig);

        this.executionConfig = executionConfig;
        this.retryData = retryData;

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
            .then((proc) => processFn(proc, data));
    }

    runSlices(slices, extraOpConfig, extraContext) {
        const { processFn, getProcessor, emulateShutdown } = this;
        const newProcessor = getProcessor(extraOpConfig, extraContext);
        return Promise.resolve(slices)
            .mapSeries((slice) => processFn(newProcessor, slice))
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
        const jobConfig = validateJobConfig(schema, { operations: [{ _op: 'noop' }, opConfig] });
        return operation.newProcessor(
            Object.assign({}, context, extraContext),
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
        return cloneDeep({
            simple: simpleData,
            arrayLike: sampleDataArrayLike,
            esLike: sampleDataEsLike
        });
    }
}

export default (op) => new TestHarness(op);
