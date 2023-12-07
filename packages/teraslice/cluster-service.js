'use strict';

const { get, logError } = require('@terascope/utils');
const { shutdownHandler } = require('./dist/src/lib/workers/helpers/worker-shutdown');
const { makeTerafoundationContext } = require('./dist/src/lib/workers/context/terafoundation-context');
const { ClusterMaster } = require('./dist/src/lib/cluster/cluster_master');
const { AssetsService } = require('./dist/src/lib/cluster/services');

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
    const context = makeTerafoundationContext();
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
