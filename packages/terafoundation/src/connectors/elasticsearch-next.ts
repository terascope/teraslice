import { createClient as esCreateClient } from 'elasticsearch-store';
import { Logger } from '@terascope/utils';
import { TerafoundationConnector } from '../interfaces.js';

const connector: TerafoundationConnector = {
    async createClient(customConfig: Record<string, any>, logger: Logger) {
        const { client, log } = await esCreateClient(customConfig, logger);
        return { client, logger: log() };
    },
    config_schema(): Record<string, any> {
        return {
            node: {
                doc: 'A list of hosts to connect to',
                default: ['http://127.0.0.1:9200']
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

export default connector;
