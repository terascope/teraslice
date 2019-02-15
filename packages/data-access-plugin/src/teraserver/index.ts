import { Express, Router } from 'express';
import { Logger } from '@terascope/utils';
import { TeraserverConfig, PluginConfig } from '../interfaces';

export default class TeraserverPlugin {
    readonly config: TeraserverConfig;
    readonly logger: Logger;
    readonly app: Express;

    constructor(config: PluginConfig) {
        this.config = config.server_config;
        this.logger = config.logger;
        this.app = config.app;
    }

    async initialize() {

    }

    registerRoutes(router: Router) {

    }
}
