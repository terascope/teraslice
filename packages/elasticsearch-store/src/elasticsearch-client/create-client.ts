import { debugLogger, get, toNumber } from '@terascope/utils';
import * as opensearch from '@opensearch-project/opensearch';
import * as elasticsearch6 from 'elasticsearch6';
import * as elasticsearch7 from 'elasticsearch7';
import * as elasticsearch8 from 'elasticsearch8';
import { ClientMetadata, ElasticsearchDistribution } from '@terascope/types';
import { logWrapper } from './log-wrapper';
import { ClientConfig } from './interfaces';

const clientList = [opensearch, elasticsearch8, elasticsearch7, elasticsearch6];

async function findDistribution(config: Record<string, any>): Promise<ClientMetadata> {
    for (let i = 0; i < clientList.length - 1; i++) {
        try {
            const client = new clientList[i].Client(config);
            // @ts-expect-error
            const response = await client.info();

            if (response) {
                const info = response.body || response;
                const version = get(info, 'version.number');
                const responseDistribution = get(info, 'version.distribution', 'elasticsearch');
                let distribution: ElasticsearchDistribution;

                if (version == null || responseDistribution == null) {
                    throw new Error(`Got invalid response from api: ${JSON.stringify(info)}`);
                }

                if (responseDistribution === 'elasticsearch') {
                    distribution = ElasticsearchDistribution.elasticsearch;
                } else {
                    distribution = ElasticsearchDistribution.opensearch;
                }

                return {
                    version,
                    distribution
                };
            }
        } catch (_err) {
            continue;
        }
    }

    throw new Error(`Could not create a client with config ${JSON.stringify(config)}`);
}

export async function createClient(config: ClientConfig, logger = debugLogger('elasticsearch-client')) {
    try {
        const serverMetadata = await findDistribution(config);

        if (serverMetadata.distribution === ElasticsearchDistribution.opensearch) {
            // TODO: clean this up
            const openConfig = {
                ...config,
            };
            const client = new opensearch.Client(openConfig as any);
            // @ts-expect-error
            client.__meta = serverMetadata;

            return {
                client,
                log: logWrapper(logger),
            };
        }

        const majorVersion = toNumber(serverMetadata.version.split('.', 1)[0]);

        if (majorVersion === 8) {
            const client = new elasticsearch8.Client(config as any);
            // @ts-expect-error
            client.__meta = serverMetadata;

            return {
                client,
                log: logWrapper(logger),
            };
        }

        if (majorVersion === 7) {
            const client = new elasticsearch7.Client(config as any);
            // @ts-expect-error
            client.__meta = serverMetadata;

            return {
                client,
                log: logWrapper(logger),
            };
        }

        if (majorVersion === 6) {
            const client = new elasticsearch6.Client(config as any);
            // @ts-expect-error
            client.__meta = serverMetadata;

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
