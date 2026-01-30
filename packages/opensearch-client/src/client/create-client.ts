import {
    debugLogger, get, toNumber, Logger
} from '@terascope/core-utils';
import * as opensearch1 from 'opensearch1';
import * as opensearch2 from 'opensearch2';
import * as opensearch3 from 'opensearch3';
import * as elasticsearch7 from 'elasticsearch7';
import * as elasticsearch8 from 'elasticsearch8';
import { ElasticsearchDistribution, ClientMetadata } from '@terascope/types';
import { Client } from './client.js';
import { logWrapper } from './log-wrapper.js';
import { OpenSearch } from '@terascope/types';

const clientList = [
    opensearch1, opensearch2, opensearch3, elasticsearch7, elasticsearch8
];

/** creates an opensearch or elasticsearch client depending on the configuration */
export async function createClient(
    config: OpenSearch.ClientConfig,
    logger = debugLogger('opensearch-client')
): Promise<{ log: () => Logger; client: Client }> {
    const finalConfig = formatClientConfig(config, logger);

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
 * @param logger - A Bunyan logger.
 * @returns A normalized and validated OpenSearch `ClientConfig`.
 * @throws An error if configuration validation fails.
 */
function formatClientConfig(
    config: OpenSearch.ClientConfig,
    logger: Logger
): OpenSearch.ClientConfig {
    const updatedConfig = { ...config };

    if (updatedConfig.auth && (updatedConfig.username || updatedConfig.password)) {
        throw new Error('"auth" can not be set at the same time as "username" or "password".');
    }

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

    if (updatedConfig.ssl && updatedConfig.caCertificate) {
        if (updatedConfig.ssl.ca) {
            // only throw if using different CAs
            if (updatedConfig.ssl?.ca !== updatedConfig.caCertificate) {
                throw new Error(
                    'Cannot set both "caCertificate" and "ssl.ca".'
                );
            }
        } else {
            // add CA cert to ssl if not already defined
            updatedConfig.ssl.ca = updatedConfig.caCertificate;
        }

        warnNonTLSNodeUrls(updatedConfig, ['ssl', 'caCerificate'], logger);
    } else if (updatedConfig.ssl) {
        warnNonTLSNodeUrls(updatedConfig, ['ssl'], logger);
    } else if (updatedConfig.caCertificate) {
        // Ensure ssl settings if `caCertificate` is provided
        updatedConfig.ssl = { ca: updatedConfig.caCertificate };

        warnNonTLSNodeUrls(updatedConfig, ['caCertificate'], logger);
    }

    return updatedConfig;
}

/**
 * Validate that the node urls use `https` if ssl is enabled
 * @param config - A client configuration
 * @param logger - A Bunyan logger.
 * @returns void
 * @throws An error if configuration validation fails.
 */
function warnNonTLSNodeUrls(config: OpenSearch.ClientConfig, keys: string[], logger: Logger) {
    if (config.node) {
        if (Array.isArray(config.node)) {
            const invalidNodes = config.node.filter((node) => {
                return (typeof node === 'string' && !node.startsWith('https://'))
                    || (typeof node === 'object' && !node.url.startsWith('https://'));
            });
            if (invalidNodes.length > 0) {
                logger.warn(
                    `"${keys.join('", "')}" provided, but not all "nodes" are https. TLS encryption will NOT be enabled for these nodes: ${invalidNodes.toString()}`
                );
            }
        } else if (typeof config.node === 'string') {
            if (!config.node.startsWith('https://')) {
                logger.warn(
                    `"${keys.join('", "')}" provided, but "node" is not https. TLS encryption will NOT be enabled.`
                );
            }
        } else {
            if (!config.node.url.startsWith('https://')) {
                logger.warn(
                    `"${keys.join('", "')}" provided, but "node.url" is not https. TLS encryption will NOT be enabled.`
                );
            }
        }
    }
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
    config: OpenSearch.ClientConfig,
    logger = debugLogger('elasticsearch-client')
) {
    const {
        distribution,
        majorVersion,
        minorVersion
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

        if (distribution === ElasticsearchDistribution.elasticsearch) {
            const model = {
                7: elasticsearch7,
                8: elasticsearch8
            }[majorVersion];

            // 7.13 & lower needs to use opensearch for now as it is backwards compatible,
            // past this version the newer client will throw if not their proprietary client
            if (majorVersion === 7 && minorVersion <= 13) {
                logger.debug('Creating an opensearch client for elasticsearch v7 for backwards compatibility');
                return new opensearch1.Client(config as any);
            }

            if (model) {
                logger.debug(`Creating an elasticsearch v${majorVersion} client`);
                return new model.Client(config as any);
            }
        }

        throw new Error('no valid client available');
    } catch (error) {
        throw new Error(`Could not create a client for config ${JSON.stringify(config, null, 4)}`);
    }
}
