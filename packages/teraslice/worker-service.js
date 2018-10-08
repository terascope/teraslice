'use strict';

/* eslint-disable class-methods-use-this, no-console */

const _ = require('lodash');
const Promise = require('bluebird');
const { shutdownHandler } = require('./lib/workers/helpers/worker-shutdown');
const { safeDecode } = require('./lib/utils/encoding_utils');
const ExecutionContext = require('./lib/workers/context/execution-context');
const makeTerafoundationContext = require('./lib/workers/context/terafoundation-context');
const ExecutionController = require('./lib/workers/execution-controller');
const Worker = require('./lib/workers/worker');

class Service {
    constructor(context) {
        const ex = this._getExecutionConfigFromEnv();

        this.context = context;

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
        this.shutdownTimeout = _.get(this.context, 'sysconfig.teraslice.shutdown_timeout', 60 * 1000);
    }

    async initialize() {
        const { assignment, ex_id: exId } = this.executionConfig;
        this.logger.trace(`Initializing ${assignment} for execution ${exId}...`, this.executionConfig);

        const executionContext = new ExecutionContext(this.context, this.executionConfig);
        await executionContext.initialize();

        if (assignment === 'worker') {
            this.instance = new Worker(this.context, executionContext);
        } else if (assignment === 'execution_controller') {
            this.instance = new ExecutionController(this.context, executionContext);
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

const context = makeTerafoundationContext();
const cmd = new Service(context);

cmd.shutdownHandler = shutdownHandler(context, () => {
    if (!cmd.instance) return Promise.resolve();
    return cmd.instance.shutdown();
});

Promise.resolve()
    .then(() => cmd.initialize())
    .then(() => cmd.run())
    .then(() => cmd.shutdown())
    .catch(err => cmd.shutdown(err));
