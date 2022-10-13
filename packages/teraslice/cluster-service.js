'use strict';

import { get, logError } from '@terascope/utils';
import { shutdownHandler } from './lib/workers/helpers/worker-shutdown';
import makeTerafoundationContext from './lib/workers/context/terafoundation-context';
import makeClusterMaster from './lib/cluster/cluster_master';
import makeAssetService from './lib/cluster/services/assets';

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
            this.instance = makeClusterMaster(this.context);
        } else if (assignment === 'assets_service') {
            // require this here so node doesn't have load extra code into memory
            this.instance = makeAssetService(this.context);
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
    .catch((err) => cmd.shutdown(err));
