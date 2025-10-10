import {
    logError, get, isEmpty, isPlainObject
} from '@terascope/utils';
import { shutdownHandler } from './dist/src/lib/workers/helpers/worker-shutdown.js';
import { safeDecode } from './dist/src/lib/utils/encoding_utils.js';
import { makeExecutionContext } from './dist/src/lib/workers/context/execution-context.js';
import { makeTerafoundationContext } from './dist/src/lib/workers/context/terafoundation-context.js';
import { ExecutionController } from './dist/src/lib/workers/execution-controller/index.js';
import { Worker } from './dist/src/lib/workers/worker/index.js';
import { makeLogger } from './dist/src/lib/workers/helpers/terafoundation.js';

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

async function main() {
    const context = await makeTerafoundationContext();
    context.logger = makeLogger(context, 'worker-service');
    const cmd = new Service(context);

    cmd.shutdownHandler = shutdownHandler(context, (event, err) => {
        if (!cmd.instance) return Promise.resolve();
        return cmd.instance.shutdown(event, err, true);
    });

    try {
        await cmd.initialize();
        await cmd.run();
        await cmd.shutdown();
    } catch (err) {
        cmd.shutdown(err);
    }
}

main();
