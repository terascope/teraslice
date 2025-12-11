import { Logger } from '@terascope/core-utils';
import type { Terafoundation } from '@terascope/types';
import { createClient as createSearchClient } from '@terascope/opensearch-client';

const connector: Terafoundation.Connector = {
    async createClient(customConfig: Record<string, any>, logger: Logger) {
        const { client, log } = await createSearchClient(customConfig, logger);
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
            caCertificate: {
                doc: 'A string containing a single or multiple ca certificates',
                default: undefined,
                format: String
            },
            username: {
                doc: 'Username for authenticating with cluster. Required if authentication is enabled.',
                default: undefined,
                format: String
            },
            password: {
                doc: 'Password for authenticating with cluster. Must be used in conjunction with the username.',
                default: undefined,
                format: String
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
