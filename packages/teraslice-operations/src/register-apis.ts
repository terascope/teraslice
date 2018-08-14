import { Context, ConnectionConfig } from '@terascope/teraslice-types';
import { has } from 'lodash';

interface GetClientConfig {
    connection?: string;
    endpoint?: string;
    connection_cache?: boolean;
}

export function registerApis(context: Context): void {
    /*
     * This will request a connection based on the 'connection' attribute of
     * an opConfig. Intended as a context API endpoint.
     */
    function getClient(config: GetClientConfig, type: string): any {
        const clientConfig: ConnectionConfig = {
            type,
            cached: true,
            endpoint: 'default',
        };
        const events = context.apis.foundation.getSystemEvents();

        if (config && has(config, 'connection')) {
            clientConfig.endpoint = config.connection || 'default';
            const isCached = config.connection_cache != null;
            clientConfig.cached = isCached ? config.connection_cache : true;
        } else {
            clientConfig.endpoint = 'default';
            clientConfig.cached = true;
        }

        try {
            return context.apis.foundation.getConnection(clientConfig).client;
        } catch (err) {
            const error = new Error(`No configuration for endpoint ${clientConfig.endpoint} was found in the terafoundation connectors config`);
            context.logger.error(error);
            events.emit('client:initialization:error', { error: error.message });
            return null;
        }
    }

    context.apis.registerAPI('op_runner', {
        getClient,
    });
}
