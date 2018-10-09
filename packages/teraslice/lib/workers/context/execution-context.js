'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const { OperationLoader, registerApis } = require('@terascope/job-components');
const { terasliceOpPath } = require('../../config');
const spawnAssetLoader = require('../assets/spawn');
const { makeLogger } = require('../helpers/terafoundation');
const { analyzeOp } = require('../helpers/op-analytics');

class ExectionContext {
    constructor(context, executionConfig) {
        if (_.get(context, 'sysconfig.teraslice.reporter')) {
            throw new Error('reporters are not functional at this time, please do not set one in the configuration');
        }

        this._opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: _.get(context, 'sysconfig.teraslice.assets_directory'),
        });

        registerApis(context, executionConfig.job);

        this._logger = makeLogger(context, executionConfig, 'execution_context');

        this._context = context;

        Object.assign(this, executionConfig);

        this.config = executionConfig.job;
        this.config.ex_id = executionConfig.ex_id;
        this.config.job_id = executionConfig.job_id;
        this.queue = [];
        this.reader = null;
        this.slicer = null;
        this.reporter = null;
        this.queueLength = 10000;
        this.dynamicQueueLength = false;
    }

    async initialize() {
        this.assetIds = await spawnAssetLoader(_.get(this.config, 'assets', []));

        if (this.assignment === 'worker') {
            await this._initializeOperations();
        }
        if (this.assignment === 'execution_controller') {
            await this._initializeSlicer();
        }

        // cleanup private stuff to keep memory footprint small
        this._context = null;
        this._initializeSlicer = null;
        this._initializeOperations = null;
        this._loadOperation = null;
        this._logger = null;
        this._opLoader = null;
        this._setQueueLength = null;
        return this;
    }

    async _initializeSlicer() {
        const opConfig = _.get(this.config, 'operations[0]');

        if (!opConfig) {
            throw new Error('Invalid configuration for operation');
        }

        this.slicer = await this._loadOperation(opConfig._op);
        await this._setQueueLength();
    }

    async _initializeOperations() {
        const context = this._context;
        const { config } = this;

        const operations = _.get(this.config, 'operations', []);
        this.queue = await Promise.map(operations, async (opConfig, index) => {
            const op = await this._loadOperation(opConfig._op);
            const args = [context, opConfig, config];
            const opFn = !index ? await op.newReader(...args) : await op.newProcessor(...args);
            if (!config.analytics) {
                return opFn;
            }
            return analyzeOp(opFn, index);
        });

        this.reader = _.first(this.queue);
    }

    async _loadOperation(opName) {
        return this._opLoader.load(opName, this.assetIds);
    }

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

module.exports = ExectionContext;
