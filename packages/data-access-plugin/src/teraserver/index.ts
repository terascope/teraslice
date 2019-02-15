import { Express, Router } from 'express';
import { ACLManager } from '@terascope/data-access';
import { Logger } from '@terascope/utils';
import { TeraserverConfig, PluginConfig } from '../interfaces';

export default class TeraserverPlugin {
    readonly config: TeraserverConfig;
    readonly logger: Logger;
    readonly app: Express;
    readonly manager: ACLManager;

    constructor(pluginConfig: PluginConfig) {
        const client = pluginConfig.elasticsearch;
        this.config = pluginConfig.server_config;
        this.logger = pluginConfig.logger;
        this.app = pluginConfig.app;

        const namespace = this.config.data_access
            && this.config.data_access.namespace;

        this.manager = new ACLManager(client, {
            namespace,
            logger: pluginConfig.logger,
        });
    }

    async initialize() {
        return this.manager.initialize();
    }

    async shutdown() {
        return this.manager.shutdown();
    }

    registerRoutes(router: Router) {
        router.get('/', (req, res) => {
            res.send({
                ok: true
            });
        });
    }
}
