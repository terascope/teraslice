'use strict';

const Promise = require('bluebird');
const get = require('lodash/get');
const { shutdownHandler } = require('./lib/workers/helpers/worker-shutdown');
const makeTerafoundationContext = require('./lib/workers/context/terafoundation-context');
const makeClusterMaster = require('./lib/cluster/cluster_master');
const makeAssetService = require('./lib/cluster/services/assets');

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
            this.logger.error('Cluster Worker shutting down due to failure!', err);
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
    .catch(err => cmd.shutdown(err));
