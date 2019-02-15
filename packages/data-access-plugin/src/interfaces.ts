import { Express } from 'express';
import { Client } from 'elasticsearch';
import { Logger } from '@terascope/utils';

export interface PluginConfig {
    logger: Logger;
    app: Express;
    elasticsearch: Client;
    url_base: string;
    server_config: TeraserverConfig;
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
        url_base?: string;
        namespace?: string;
    };
    teraserver: {
        shutdown_timeout: number;
        plugins: string[];
        path?: string;
    };
    terafoundation: object;
}
