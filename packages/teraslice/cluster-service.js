'use strict';

/* eslint-disable class-methods-use-this, no-console */

const Promise = require('bluebird');
const get = require('lodash/get');
const { shutdownHandler } = require('./lib/workers/helpers/worker-shutdown');
const makeClusterMaster = require('./lib/cluster/cluster_master');
const makeAssetsService = require('./lib/cluster/services/assets');
const makeTerafoundationContext = require('./lib/workers/context/terafoundation-context');

class Service {
    constructor() {
        this.context = makeTerafoundationContext();

        this.shutdownHandler = shutdownHandler(this.context, () => {
            if (!this.instance) return Promise.resolve();
            return this.instance.shutdown();
        });

        this.logger = this.context.logger;
        this.shutdownTimeout = get(this.context, 'sysconfig.teraslice.shutdown_timeout', 60 * 1000);
    }

    async initialize() {
        const { assignment } = this.context;
        this.logger.trace(`Initializing ${assignment}`);

        if (assignment === 'cluster_master') {
            this.instance = makeClusterMaster(this.context);
        } else if (assignment === 'assets_service') {
            this.instance = makeAssetsService(this.context);
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

const cmd = new Service();
Promise.resolve()
    .then(() => cmd.initialize())
    .then(() => cmd.run())
    .then(() => cmd.shutdown())
    .catch(err => cmd.shutdown(err));
