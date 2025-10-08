import { get, logError } from '@terascope/utils';
import { shutdownHandler } from './dist/src/lib/workers/helpers/worker-shutdown.js';
import { makeTerafoundationContext } from './dist/src/lib/workers/context/terafoundation-context.js';
import { ClusterMaster } from './dist/src/lib/cluster/cluster_master.js';
import { AssetsService } from './dist/src/lib/cluster/services/index.js';
import { makeLogger } from './dist/src/lib/workers/helpers/terafoundation.js';

class Service {
    constructor(context) {
        this.context = context;
        this.logger = this.context.logger;
        this.shutdownTimeout = get(this.context, 'sysconfig.teraslice.shutdown_timeout', 60 * 1000);
    }

    async initialize() {
        const { assignment } = this.context;
        this.logger.trace(`Initializing ${assignment}`);

        if (assignment === 'cluster_master') {
            // require this here so node doesn't have load extra code into memory
            this.instance = new ClusterMaster(this.context);
        } else if (assignment === 'assets_service') {
            // require this here so node doesn't have load extra code into memory
            this.instance = new AssetsService(this.context);
        }

        await this.instance.initialize();

        this.logger.trace(`Initialized ${assignment}`);
    }

    async run() {
        return this.instance.run();
    }

    shutdown(err) {
        if (err) {
            logError(this.logger, err, 'Cluster Worker shutting down due to failure!');
        }
        this.shutdownHandler.exit('error', err);
    }
}

async function main() {
    const context = await makeTerafoundationContext();
    context.logger = makeLogger(context, 'cluster-service');
    const cmd = new Service(context);

    cmd.shutdownHandler = shutdownHandler(context, () => {
        if (!cmd.instance) return Promise.resolve();
        return cmd.instance.shutdown();
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
