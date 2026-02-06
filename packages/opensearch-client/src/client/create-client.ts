import {
    debugLogger, get, toNumber, Logger
} from '@terascope/core-utils';
import * as opensearch1 from 'opensearch1';
import * as opensearch2 from 'opensearch2';
import * as opensearch3 from 'opensearch3';
import { ElasticsearchDistribution, ClientMetadata } from '@terascope/types';
import { Client } from './client.js';
import { logWrapper } from './log-wrapper.js';
import { OpenSearch } from '@terascope/types';

const clientList = [
    opensearch2, opensearch3, opensearch1
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
 * - `auth` and `username`/`password` are not both set
 * - If `caCertificate` is set, warns if `config.node` is not `https`.
 *
 * @param config - The original client configuration.
 * @param logger - A Bunyan logger.
 * @returns A normalized and validated OpenSearch `ClientConfig`.
 * @throws An error if configuration validation fails.
 */
export function formatClientConfig(
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

    if (updatedConfig.caCertificate) {
        // Ensure ssl settings if `caCertificate` is provided
        // This allows for ssl overrides to be passed in on the client config, even
        // though the field is undocumented and not validated
        updatedConfig.ssl = { ...updatedConfig.ssl, ca: updatedConfig.caCertificate };

        warnNonTLSNodeUrls(updatedConfig, ['caCertificate'], logger);
    }

    return updatedConfig;
}

/**
 * Validate that the node urls use `https` if fields that modify ssl have been supplied
 * @param config - A client configuration.
 * @param keys - Any fields that are used to modify an encrypted connection.
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
    config: OpenSearch.ClientConfig,
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
