'use strict';

const _ = require('lodash');
const makeExecutionRunner = require('teraslice/lib/cluster/runners/execution');
const { makeLogger } = require('../utils/context');
const WrapError = require('../utils/wrap-error');
const Assets = require('./assets');

class ExecutionRunner {
    constructor(context, executionContext) {
        this._runner = makeExecutionRunner(context, {
            execution: executionContext.job,
            processAssingment: executionContext.assignment,
        });

        this._assets = new Assets(context, executionContext);
        this._logger = makeLogger(context, executionContext, 'execution_runner');
        this._assignment = executionContext.assignment;

        Object.assign(this, executionContext);

        this.config = executionContext.job;
        this.queue = [];
        this.reader = null;
        this.slicer = null;
        this.reporter = null;
        this.queueLength = 10000;
        this.dynamicQueueLength = false;
    }

    async initialize() {
        await this._assets.load();
        try {
            Object.assign(this, await this._runner.initialize());
        } catch (err) {
            /* istanbul ignore next */
            throw new WrapError('Unable to initialize runner', err);
        }

        if (this._assignment === 'execution_controller') {
            await this._setQueueLength();
        }

        return this;
    }

    /* istanbul ignore next */
    async _setQueueLength() {
        const { slicer } = this;

        if (!slicer.slicerQueueLength) return;
        if (!_.isFunction(slicer.slicerQueueLength)) {
            this._logger.error(`slicerQueueLength on the reader must be a function, defaulting to ${this.queueLength}`);
            return;
        }

        const results = await slicer.slicerQueueLength(this);

        if (results === 'QUEUE_MINIMUM_SIZE') {
            this.dynamicQueueLength = true;
            this.queueLength = this.config.workers;
        } else if (_.isNumber(results) && results >= 1) {
            this.queueLength = results;
        }

        const isDyanmic = this.dynamicQueueLength ? ' and is dynamic' : '';

        this._logger.info(`Setting slicer queue length to ${this.queueLength}${isDyanmic}`);
    }
}

module.exports = ExecutionRunner;
