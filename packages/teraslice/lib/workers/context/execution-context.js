'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const { OperationLoader, registerApis } = require('@terascope/job-components');
const { terasliceOpPath } = require('../../config');
const spawnAssetLoader = require('../assets/spawn');
const { makeLogger } = require('../helpers/terafoundation');
const { analyzeOp } = require('../helpers/op-analytics');

class ExecutionContext {
    constructor(context, _executionConfig) {
        if (_.get(context, 'sysconfig.teraslice.reporter')) {
            throw new Error('reporters are not functional at this time, please do not set one in the configuration');
        }

        this._opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: _.get(context, 'sysconfig.teraslice.assets_directory'),
        });

        const executionConfig = _.cloneDeep(_executionConfig);

        if (executionConfig.config == null) {
            executionConfig.config = Object.assign({}, executionConfig.job, {
                ex_id: executionConfig.ex_id,
                job_id: executionConfig.job_id,
            });
            delete executionConfig.job;
        }

        registerApis(context, executionConfig.config);

        this._logger = makeLogger(context, executionConfig, 'execution_context');

        this._context = context;

        this.executionContext = Object.assign({}, executionConfig, {
            assetIds: [],
            queue: [],
            reader: null,
            slicer: null,
            reporter: null,
            queueLength: 10000,
            dynamicQueueLength: false,
        });
    }

    async initialize() {
        const assets = _.get(this.executionContext.config, 'assets', []);
        this.executionContext.assetIds = await spawnAssetLoader(assets);

        if (this.executionContext.assignment === 'worker') {
            await this._initializeOperations();
        }
        if (this.executionContext.assignment === 'execution_controller') {
            await this._initializeSlicer();
        }

        return this.executionContext;
    }

    async _initializeSlicer() {
        const opConfig = _.get(this.executionContext.config, 'operations[0]');

        if (!opConfig) {
            throw new Error('Invalid configuration for operation');
        }

        this.executionContext.slicer = await this._loadOperation(opConfig._op);
        await this._setQueueLength();
    }

    async _initializeOperations() {
        const context = this._context;
        const { config } = this.executionContext;

        const operations = _.get(this.executionContext.config, 'operations', []);
        this.executionContext.queue = await Promise.map(operations, async (opConfig, index) => {
            const op = await this._loadOperation(opConfig._op);
            const args = [context, opConfig, config];
            const opFn = !index ? await op.newReader(...args) : await op.newProcessor(...args);
            if (!config.analytics) {
                return opFn;
            }
            return analyzeOp(opFn, index);
        });

        this.executionContext.reader = _.first(this.executionContext.queue);
    }

    async _loadOperation(opName) {
        return this._opLoader.load(opName, this.executionContext.assetIds);
    }

    async _setQueueLength() {
        const { slicer } = this.executionContext;

        if (!slicer.slicerQueueLength) return;
        if (!_.isFunction(slicer.slicerQueueLength)) {
            this._logger.error(`slicerQueueLength on the reader must be a function, defaulting to ${this.executionContext.queueLength}`);
            return;
        }

        const results = await slicer.slicerQueueLength(this.executionContext);

        if (results === 'QUEUE_MINIMUM_SIZE') {
            this.executionContext.dynamicQueueLength = true;
            this.executionContext.queueLength = this.executionContext.config.workers;
        } else if (_.isNumber(results) && results >= 1) {
            this.executionContext.queueLength = results;
        }

        const isDyanmic = this.executionContext.dynamicQueueLength ? ' and is dynamic' : '';

        this._logger.info(`Setting slicer queue length to ${this.executionContext.queueLength}${isDyanmic}`);
    }
}

module.exports = ExecutionContext;
