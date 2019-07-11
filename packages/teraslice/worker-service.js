'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const { shutdownHandler } = require('./lib/workers/helpers/worker-shutdown');
const { safeDecode } = require('./lib/utils/encoding_utils');
const makeExecutionContext = require('./lib/workers/context/execution-context');
const makeTerafoundationContext = require('./lib/workers/context/terafoundation-context');
const ExecutionController = require('./lib/workers/execution-controller');
const Worker = require('./lib/workers/worker');

class Service {
    constructor(context) {
        this.executionConfig = this._getExecutionConfigFromEnv();
        this.context = context;

        this.logger = this.context.logger;
        this.shutdownTimeout = _.get(
            this.context,
            'sysconfig.teraslice.shutdown_timeout',
            60 * 1000
        );
    }

    async initialize() {
        const { assignment } = this.context;
        const { ex_id: exId } = this.executionConfig;
        this.logger.trace(
            `Initializing ${assignment} for execution ${exId}...`,
            this.executionConfig
        );

        const executionContext = await makeExecutionContext(this.context, this.executionConfig);

        if (assignment === 'worker') {
            this.instance = new Worker(executionContext.context, executionContext);
        } else if (assignment === 'execution_controller') {
            this.instance = new ExecutionController(executionContext.context, executionContext);
        }

        await this.instance.initialize();

        this.logger.trace(`Initialized ${assignment} for execution ${exId}`);
    }

    run() {
        return this.instance.run();
    }

    shutdown(err) {
        if (err) {
            this.logger.error(err, 'Teraslice Worker shutting down due to failure!');
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
