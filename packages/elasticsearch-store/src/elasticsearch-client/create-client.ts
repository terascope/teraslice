import {
    debugLogger, get, toNumber, Logger
} from '@terascope/utils';
import * as opensearch1 from 'opensearch1';
import * as opensearch2 from 'opensearch2';
import * as elasticsearch6 from 'elasticsearch6';
import * as elasticsearch7 from 'elasticsearch7';
import * as elasticsearch8 from 'elasticsearch8';
import { ElasticsearchDistribution, ClientMetadata } from '@terascope/types';
import { Client } from './client';
import { logWrapper } from './log-wrapper';
import { ClientConfig } from './interfaces';

const clientList = [opensearch1, elasticsearch7, elasticsearch6, elasticsearch8];

export async function createClient(
    config: ClientConfig,
    logger = debugLogger('elasticsearch-client')
): Promise<{ log: () => Logger, client: Client }> {
    const distributionMetadata = await getClientMetadata(config, logger);

    const baseClient = await getBaseClient(
        distributionMetadata,
        config,
        logger
    );

    return {
        client: new Client(baseClient, distributionMetadata),
        log: logWrapper(logger)
    };
}

async function getClientMetadata(
    config: Record<string, any>,
    logger: Logger
): Promise<ClientMetadata> {
    for (let i = 0; i <= clientList.length - 1; i++) {
        try {
            const client = new clientList[i].Client(config) as any;

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
                } as any;
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

export async function getBaseClient(
    clientMetadata: ClientMetadata,
    config: ClientConfig,
    logger = debugLogger('elasticsearch-client')
) {
    const {
        distribution,
        majorVersion,
        minorVersion
    } = clientMetadata as any;

    try {
        if (distribution === ElasticsearchDistribution.opensearch) {
            if (majorVersion === 1) {
                const client = new opensearch1.Client(config as any);

                logger.debug('Creating an opensearch client v1');

                return client;
            }

            if (majorVersion === 2) {
                const client = new opensearch2.Client(config as any);

                logger.debug('Creating an opensearch client v2');

                return client;
            }
        }

        if (distribution === ElasticsearchDistribution.elasticsearch) {
            if (majorVersion === 8) {
                const client = new elasticsearch8.Client(config as any);

                logger.debug('Creating an elasticsearch v8 client');

                return client;
            }

            if (majorVersion === 7) {
                // 7.13 and lower needs to use opensearch for now as its backwards
                // compatible, anything past this version the newer client will
                // throw if not their proprietary client
                if (minorVersion <= 13) {
                    const client = new opensearch1.Client(config as any);

                    logger.debug('Creating an opensearch client for elasticsearch v7 for backwards compatibility');

                    return client;
                }

                const client = new elasticsearch7.Client(config as any);

                logger.debug('Creating an elasticsearch v7 client');

                return client;
            }

            if (majorVersion === 6) {
                const client = new elasticsearch6.Client(config as any);

                logger.debug('Creating an elasticsearch v6 client');

                return client;
            }
        }

        throw new Error('no valid client available');
    } catch (error) {
        throw new Error(`Could not create a client for config ${JSON.stringify(config, null, 4)}`);
    }
}
