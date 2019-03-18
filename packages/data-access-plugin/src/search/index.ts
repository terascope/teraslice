import { Express } from 'express';
import { Client } from 'elasticsearch';
import { Logger } from '@terascope/utils';
import { DataAccessConfig } from '@terascope/data-access';
import { TeraserverConfig, PluginConfig } from '../interfaces';
import { SearchFn } from './interfaces';
import { ErrorHandlerFn } from '../utils';

/**
 * @todo add support for the search counter
 */
export default class SearchPlugin {
    readonly config: TeraserverConfig;
    readonly logger: Logger;
    readonly app: Express;
    readonly client: Client;

    constructor(pluginConfig: PluginConfig) {
        this.client = pluginConfig.elasticsearch;
        this.config = pluginConfig.server_config;
        this.logger = pluginConfig.logger;
        this.app = pluginConfig.app;
    }

    async initialize() {}

    async shutdown() {}

    registerRoutes() {
        const searchUrl = '/api/v2/:space';
        this.logger.info(`Registering data-access-plugin search endpoint at ${searchUrl}`);

        this.app.get(searchUrl, (req, res) => {
            // @ts-ignore
            const space: SpaceSearch = req.space;
            if (!space) {
                res.sendStatus(500);
                return;
            }

            space.searchErrorHandler(req, res, async () => {
                const result = await space.search(req.query);

                res
                    .status(200)
                    .set('Content-type', 'application/json; charset=utf-8');

                const { pretty } = req.query;
                const boolValues = [1, true, '1', 'true', 'True', 'TRUE', 'yes'];

                if (boolValues.includes(pretty)) {
                    res.send(JSON.stringify(result, null, 2));
                } else {
                    res.json(result);
                }
            });
        });
    }
}

export interface SpaceSearch {
    searchErrorHandler: ErrorHandlerFn;
    accessConfig: DataAccessConfig;
    search: SearchFn;
}
