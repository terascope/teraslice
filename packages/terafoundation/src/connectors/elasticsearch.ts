import { Logger, pDefer } from '@terascope/utils';
import type { Client } from 'elasticsearch';

function logWrapper(logger: Logger) {
    return function _logger() {
        return {
            error: logger.error.bind(logger),
            warning: logger.warn.bind(logger),
            info: logger.info.bind(logger),
            debug: logger.debug.bind(logger),
            trace(
                method: any,
                requestUrl: any,
                body: any,
                responseBody: any,
                responseStatus: any
            ) {
                logger.trace({
                    method,
                    requestUrl,
                    body,
                    responseBody,
                    responseStatus
                });
            },
            close() {}
        };
    };
}

function create(customConfig: Record<string, any>, logger: Logger): {
    client: Client,
    log: any;
} {
    const elasticsearch = require('elasticsearch');

    logger.info(`using elasticsearch hosts: ${customConfig.host}`);

    customConfig.defer = pDefer;

    const client = new elasticsearch.Client(customConfig);

    return {
        client,
        log: logWrapper(logger)
    };
}

export default {
    create,
    config_schema(): Record<string, any> {
        return {
            host: {
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
            apiVersion: {
                describe: 'The API version, currently we only support 5.6, 6.5 and 7.0',
                default: '6.5'
            },
            requestTimeout: {
                doc: 'Request timeout',
                default: 120000,
                format: 'duration'
            },
            deadTimeout: {
                doc: 'Timeout before marking a connection as "dead"',
                default: 30000,
                format: 'duration'
            },
            maxRetries: {
                doc: 'Maximum retries for a failed request',
                default: 3
            }
        };
    }
};
