import {
    debugLogger, get, toNumber, Logger
} from '@terascope/utils';
import * as opensearch from '@opensearch-project/opensearch';
import * as elasticsearch6 from 'elasticsearch6';
import * as elasticsearch7 from 'elasticsearch7';
import * as elasticsearch8 from 'elasticsearch8';
import { ElasticsearchDistribution } from '@terascope/types';
import { logWrapper } from './log-wrapper';
import { ClientConfig, ServerMetadata } from './interfaces';

// polyfill because opensearch has references to an api that won't exist
// on the client side, should be able to remove in the future
// @ts-expect-error
import('setimmediate');

const clientList = [opensearch, elasticsearch8, elasticsearch7, elasticsearch6];

async function findDistribution(
    config: Record<string, any>,
    logger: Logger
): Promise<ServerMetadata> {
    for (let i = 0; i < clientList.length - 1; i++) {
        try {
            const client = new clientList[i].Client(config);
            // @ts-expect-error
            const response = await client.info();

            if (response) {
                const info = response.body || response;
                const version: string = get(info, 'version.number');
                const responseDistribution = get(info, 'version.distribution', 'elasticsearch');
                let distribution: ElasticsearchDistribution;

                if (logger.level() === 10) {
                    logger.trace(info);
                }

                if (version == null || responseDistribution == null) {
                    throw new Error(`Got invalid response from api: ${JSON.stringify(info)}`);
                }

                if (responseDistribution === 'elasticsearch') {
                    distribution = ElasticsearchDistribution.elasticsearch;
                } else {
                    distribution = ElasticsearchDistribution.opensearch;
                }

                const [majorVersion, minorVersion] = version.split('.').map(toNumber);

                return {
                    version,
                    distribution,
                    majorVersion,
                    minorVersion
                };
            }
        } catch (err) {
            if (logger.level() === 10) {
                logger.error(err);
            }

            continue;
        }
    }

    throw new Error(`Could not create a client with config ${JSON.stringify(config)}`);
}

export async function createClient(config: ClientConfig, logger = debugLogger('elasticsearch-client')) {
    try {
        const distribution = await findDistribution(config, logger);

        const {
            minorVersion,
            majorVersion,
            ...serverMetadata
        } = distribution;

        if (serverMetadata.distribution === ElasticsearchDistribution.opensearch) {
            // TODO: clean this up
            const openConfig = {
                ...config,
            };
            const client = new opensearch.Client(openConfig as any);

            // @ts-expect-error
            client.__meta = serverMetadata;
            logger.debug('Creating an opensearch client');
            return {
                client,
                log: logWrapper(logger),
            };
        }

        if (majorVersion === 8) {
            const client = new elasticsearch8.Client(config as any);

            // @ts-expect-error
            client.__meta = serverMetadata;
            logger.debug('Creating an elasticsearch v8 client');
            return {
                client,
                log: logWrapper(logger),
            };
        }

        if (majorVersion === 7) {
            // 7.13 and lower needs to use opensearch for now as its backwards
            // compatible, anything past this version the newer client will
            // throw if not their proprietary client
            if (minorVersion <= 13) {
                const client = new opensearch.Client(config as any);
                // @ts-expect-error
                client.__meta = serverMetadata;
                logger.debug('Creating an opensearch client for elasticsearch v7 for backwards compatibility');

                return {
                    client,
                    log: logWrapper(logger),
                };
            }

            const client = new elasticsearch7.Client(config as any);

            // @ts-expect-error
            client.__meta = serverMetadata;
            logger.debug('Creating an elasticsearch v7 client');

            return {
                client,
                log: logWrapper(logger),
            };
        }

        if (majorVersion === 6) {
            const client = new elasticsearch6.Client(config as any);
            // @ts-expect-error
            client.__meta = serverMetadata;
            logger.debug('Creating an elasticsearch v6 client');

            return {
                client,
                log: logWrapper(logger),
            };
        }

        throw new Error('no valid client available');
    } catch (err) {
        throw new Error(`Could not create a client for config ${JSON.stringify(config, null, 4)}`);
    }
}
