import {
    debugLogger, get, toNumber, Logger
} from '@terascope/core-utils';
import * as opensearch1 from 'opensearch1';
import * as opensearch2 from 'opensearch2';
import * as opensearch3 from 'opensearch3';
import { ElasticsearchDistribution, ClientMetadata } from '@terascope/types';
import { Client } from './client.js';
import { logWrapper } from './log-wrapper.js';
import { ClientConfig } from './interfaces.js';

const clientList = [
    opensearch2, opensearch3, opensearch1
];

/** creates an opensearch or elasticsearch client depending on the configuration */
export async function createClient(
    config: ClientConfig,
    logger = debugLogger('opensearch-client')
): Promise<{ log: () => Logger; client: Client }> {
    const finalConfig = formatClientConfig(config);

    const distributionMetadata = await getDBMetadata(finalConfig, logger);

    const baseClient = await getBaseClient(
        distributionMetadata,
        finalConfig,
        logger
    );

    return {
        client: new Client(baseClient, distributionMetadata),
        log: logWrapper(logger)
    };
}

/**
 * Validates and formats the client configuration.
 *
 * Ensures that:
 * - Both `username` and `password` are set if defined
 * - If `caCertificate` is set, `config.node` must use `https`.
 *
 * @param config - The original client configuration.
 * @returns A normalized and validated `ClientConfig`.
 * @throws An error if configuration validation fails.
 */
function formatClientConfig(config: ClientConfig): ClientConfig {
    const updatedConfig = { ...config };

    // Ensure authentication credentials are both set or neither is set
    if (updatedConfig.username || updatedConfig.password) {
        if (!updatedConfig.username || !updatedConfig.password) {
            throw new Error(
                'Both "username" and "password" must be provided when one is set'
            );
        }
        updatedConfig.auth = {
            username: updatedConfig.username,
            password: updatedConfig.password
        };
    }

    // Ensure ssl settings if `caCertificate` is provided
    if (updatedConfig.caCertificate) {
        updatedConfig.ssl = { ca: updatedConfig.caCertificate };

        // Validate that the node urls use `https` if ssl is enabled
        if (updatedConfig.node) {
            if (typeof updatedConfig.node === 'string') {
                if (!updatedConfig.node.startsWith('https://')) {
                    throw new Error(
                        'Invalid configuration: "node" must use "https" when "caCertificate" is provided.'
                    );
                }
            } else if (Array.isArray(updatedConfig.node)) {
                const invalidNode = updatedConfig.node.find((node) => typeof node === 'string' && !node.startsWith('https://')
                );
                if (invalidNode) {
                    throw new Error(
                        `Invalid configuration: node "${invalidNode}" must use "https" when "caCertificate" is provided.`
                    );
                }
            }
        }
    }

    return updatedConfig;
}

async function getDBMetadata(
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
                const responseDistribution = get(info, 'version.distribution', 'opensearch');
                let distribution: ElasticsearchDistribution;

                if (logger.level() === 10) {
                    logger.trace(info);
                }

                if (version == null || responseDistribution == null) {
                    throw new Error(`Got invalid response from api: ${JSON.stringify(info)}`);
                }

                if (responseDistribution === 'opensearch') {
                    distribution = ElasticsearchDistribution.opensearch;
                } else {
                    throw new Error('Unsupported distribution');
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
    } = clientMetadata;

    try {
        if (distribution === ElasticsearchDistribution.opensearch) {
            const model = {
                1: opensearch1,
                2: opensearch2,
                3: opensearch3
            }[majorVersion];

            if (model) {
                logger.debug(`Creating an opensearch v${majorVersion} client`);
                return new model.Client(config as any);
            }
        }

        throw new Error('no valid client available');
    } catch (error) {
        throw new Error(`Could not create a client for config ${JSON.stringify(config, null, 4)}`);
    }
}
