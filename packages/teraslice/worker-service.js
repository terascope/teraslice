'use strict';

/* eslint-disable class-methods-use-this, no-console */

const Promise = require('bluebird');
const _ = require('lodash');
const get = require('lodash/get');
const { shutdownHandler } = require('./lib/workers/helpers/worker-shutdown');
const { safeDecode } = require('./lib/utils/encoding_utils');
const Worker = require('./lib/workers/worker');
const ExecutionController = require('./lib/workers/execution-controller');
const ExecutionContext = require('./lib/workers/context/execution-context');
const makeTerafoundationContext = require('./lib/workers/context/terafoundation-context');

class Service {
    constructor() {
        const ex = this._getExecutionConfigFromEnv();

        this.context = makeTerafoundationContext();

        this.shutdownHandler = shutdownHandler(this.context, () => {
            if (!this.instance) return Promise.resolve();
            return this.instance.shutdown();
        });

        this.executionConfig = {
            assignment: this.context.assignment,
            job: _.omit(ex, [
                'node_id',
                'ex_id',
                'job_id',
                'slicer_port',
                'slicer_hostname',
            ]),
            ex_id: ex.ex_id,
            job_id: ex.job_id,
            slicer_port: ex.slicer_port,
            slicer_hostname: ex.slicer_hostname,
        };

        this.logger = this.context.logger;
        this.shutdownTimeout = get(this.context, 'sysconfig.teraslice.shutdown_timeout', 60 * 1000);
    }

    async initialize() {
        const { assignment, ex_id: exId } = this.executionConfig;
        this.logger.trace(`Initializing ${assignment} for execution ${exId}...`, this.executionConfig);

        this.executionContext = new ExecutionContext(this.context, this.executionConfig);
        await this.executionContext.initialize();

        if (assignment === 'worker') {
            this.instance = new Worker(this.context, this.executionContext);
        } else if (assignment === 'execution_controller') {
            this.instance = new ExecutionController(this.context, this.executionContext);
        }

        await this.instance.initialize();

        this.logger.trace(`Initialized ${assignment} for execution ${exId}`);
    }

    run() {
        return this.instance.run();
    }

    shutdown(err) {
        if (err) {
            this.logger.error('Teraslice Worker shutting down due to failure!', err);
        }
        this.shutdownHandler.exit('error', err);
    }

    _getExecutionConfigFromEnv() {
        if (_.isEmpty(process.env.EX)) {
            throw new Error('TerasliceWorker is missing process.env.EX');
        }
        const ex = safeDecode(process.env.EX);

        if (_.isEmpty(ex) || !_.isPlainObject(ex)) {
            throw new Error('TerasliceWorker is missing a valid process.env.EX');
        }

        return ex;
    }
}

const cmd = new Service();
Promise.resolve()
    .then(() => cmd.initialize())
    .then(() => cmd.run())
    .then(() => cmd.shutdown())
    .catch(err => cmd.shutdown(err));
