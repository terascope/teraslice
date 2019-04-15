import { Express } from 'express';
import { Client } from 'elasticsearch';
import { Logger } from '@terascope/utils';
import { Context } from '@terascope/job-components';

export interface PluginConfig {
    logger: Logger;
    app: Express;
    elasticsearch: Client;
    url_base: string;
    server_config: TeraserverConfig;
    context: Context;
}

export interface TeraserverConfig {
    teranaut?: {
        auth?: {
            open_signup: boolean;
        },
        ui: boolean;
        url_base?: string;
    };
    data_access?: {
        namespace?: string;
        connection?: string;
    };
    teraserver: {
        shutdown_timeout: number;
        plugins: string[];
        path?: string;
    };
    terafoundation: object;
}
