'use strict';

const {
    logError, get, isEmpty, isPlainObject
} = require('@terascope/utils');
const { shutdownHandler } = require('./dist/src/lib/workers/helpers/worker-shutdown');
const { safeDecode } = require('./dist/src/lib/utils/encoding_utils');
const { makeExecutionContext } = require('./dist/src/lib/workers/context/execution-context');
const { makeTerafoundationContext } = require('./dist/src/lib/workers/context/terafoundation-context');
const { ExecutionController } = require('./dist/src/lib/workers/execution-controller');
const { Worker } = require('./dist/src/lib/workers/worker');

class Service {
    constructor(context) {
        this.executionConfig = this._getExecutionConfigFromEnv();
        this.context = context;

        this.logger = this.context.logger;
        this.shutdownTimeout = get(
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
            logError(this.logger, err, 'Teraslice Worker shutting down due to failure!');
        }
        this.shutdownHandler.exit('error', err);
    }

    _getExecutionConfigFromEnv() {
        if (isEmpty(process.env.EX)) {
            throw new Error('TerasliceWorker is missing process.env.EX');
        }
        const ex = safeDecode(process.env.EX);

        if (isEmpty(ex) || !isPlainObject(ex)) {
            throw new Error('TerasliceWorker is missing a valid process.env.EX');
        }

        return ex;
    }
}

const context = makeTerafoundationContext();
const cmd = new Service(context);

cmd.shutdownHandler = shutdownHandler(context, (event, err) => {
    if (!cmd.instance) return Promise.resolve();
    return cmd.instance.shutdown(true, event, err);
});

Promise.resolve()
    .then(() => cmd.initialize())
    .then(() => cmd.run())
    .then(() => cmd.shutdown())
    .catch((err) => cmd.shutdown(err));
