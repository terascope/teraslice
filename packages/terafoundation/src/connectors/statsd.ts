import { Logger } from '@terascope/utils';
import { StatsD } from 'node-statsd';

function create(customConfig: Record<string, any>, logger: Logger): { client: any; } {
    logger.info(`Using statsd host: ${customConfig.host}`);

    const client = new StatsD(customConfig);

    return {
        client
    };
}

export default {
    async createClient(customConfig: Record<string, any>, logger: Logger) {
        return create(customConfig, logger);
    },
    config_schema(): Record<string, any> {
        return {
            host: {
                doc: '',
                default: '127.0.0.1'
            },
            mock: {
                doc: '',
                default: false
            }
        };
    }
};
