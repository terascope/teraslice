import { createClient } from 'elasticsearch-store';
import { Logger } from '@terascope/utils';

export default {
    create() {
        throw new Error('elasticsearch-next does not support the deprecated "create" method');
    },
    async createClient(customConfig: Record<string, any>, logger: Logger) {
        return createClient(customConfig, logger);
    },
    config_schema(): Record<string, any> {
        return {
            node: {
                doc: 'A list of hosts to connect to',
                default: ['127.0.0.1:9200']
            },
            sniffOnStart: {
                doc: 'Sniff hosts on start up',
                default: false
            },
            sniffOnConnectionFault: {
                doc: 'Sniff hosts on connection failure',
                default: false
            },
            requestTimeout: {
                doc: 'Request timeout',
                default: 120000,
                format: 'duration'
            },
            maxRetries: {
                doc: 'Maximum retries for a failed request',
                default: 3
            }
        };
    }
};
