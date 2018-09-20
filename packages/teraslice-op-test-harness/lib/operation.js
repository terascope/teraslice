'use strict';

const _ = require('lodash');
const { bindThis } = require('./utils');

class Operation {
    constructor({
        op,
        context,
        opConfig,
        logger,
        retryData,
        executionConfig,
        executionContext,
        type
    }) {
        this.operationFn = op;
        this.context = context;
        this.logger = logger;
        this.retryData = retryData;
        this.executionConfig = executionConfig;
        this.executionContext = executionContext;
        this.opConfig = opConfig;

        this.isProcessor = op.newProcessor !== undefined;
        this.isReader = type === 'reader' && op.newReader !== undefined;
        this.isSlicer = type === 'slicer' && op.newSlicer !== undefined;
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
                // readers and slicers are currently mixed in the same file,
                // this will change with the new operations
                this.operation = await op.newReader(context, opConfig, executionConfig);
            }
            if (this.isSlicer) {
                this.operation = await op.newSlicer(context, executionContext, retryData, logger);
            }
            this._hasInit = true;
        }
        return this;
    }

    async run(data) {
        if (!this._hasInit) await this.init();
        if (this.isSlicer) {
            // if just one slicer, return one value
            if (this.operation.length === 1) {
                return this.operation[0](data);
            }
            const invocations = this.operation.map((fn, ind) => {
                const respData = _.get(data, ind, data);
                return fn(respData);
            });
            return Promise.all(invocations);
        }
        return this.operation(data, this.logger);
    }
}

module.exports = Operation;
