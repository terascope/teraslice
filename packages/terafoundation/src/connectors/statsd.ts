import { Logger } from '@terascope/utils';

function create(customConfig: Record<string, any>, logger: Logger): { client: any; } {
    const { StatsD } = require('node-statsd');
    logger.info(`Using statsd host: ${customConfig.host}`);

    const client = new StatsD(customConfig);

    return {
        client
    };
}

export default {
    create,
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
