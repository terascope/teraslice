/* eslint-disable @stylistic/max-len */
// import {
//     TSError, type Logger, toNumber, get,
//     isTest, parseError, isEmpty, cloneDeep,
//     pRetry, debugLogger
// } from '@terascope/utils';
// import type {
//     ClientParams, ClientResponse, ClientMetadata, ESMapping
// } from '@terascope/types';
// import {
//     type Client, getClientMetadata, isElasticsearch6, isValidClient,
//     fixMappingRequest, getFlattenedNamesAndTypes
// } from '@terascope/opensearch-client';
// import * as utils from './utils/index.js';
// import type { IndexConfig, MigrateIndexOptions } from './interfaces.js';

// const _loggers = new WeakMap<IndexConfig<any>, Logger>();

// /**
//  * Manage Elasticsearch Indices
//  */
// export class IndexManager {
//     readonly client: Client;
//     readonly clientMetadata: ClientMetadata;

//     enableIndexMutations: boolean;

//     constructor(client: Client, enableIndexMutations = isTest) {
//         if (!isValidClient(client)) {
//             throw new TSError('IndexManager requires elasticsearch client', {
//                 fatalError: true,
//             });
//         }

//         this.enableIndexMutations = enableIndexMutations;
//         const { version, distribution } = getClientMetadata(client);

//         const [majorVersion = 6, minorVersion = 8] = version.split('.').map(toNumber);
//         this.clientMetadata = {
//             version,
//             distribution,
//             majorVersion,
//             minorVersion
//         };

//         this.client = client;
//     }

//     /** Verify the index exists */
//     async exists(index: string): Promise<ClientResponse.IndicesExistsResponse> {
//         return this.client.indices.exists({
//             index,
//         });
//     }

//     /**
//      * Format the current index name.
//      *
//      * @param useWildcard if true a wildcard is added to the end of the end the index name
//     */
//     formatIndexName<T extends Record<string, any>>(
//         config: IndexConfig<T>,
//         useWildcard = true
//     ): string {
//         utils.validateIndexConfig(config);

//         const { name, namespace } = config;
//         const dataVersion = utils.getDataVersionStr(config);
//         const schemaVersion = utils.getSchemaVersionStr(config);

//         const indexName = utils.formatIndexName([namespace, name, dataVersion, schemaVersion]);

//         if (utils.isTimeSeriesIndex(config.index_schema) && !useWildcard) {
//             const timeSeriesFormat = utils.getRolloverFrequency(config);
//             return utils.timeSeriesIndex(indexName, timeSeriesFormat);
//         }

//         if (utils.isTemplatedIndex(config.index_schema) && useWildcard) {
//             return `${indexName}-*`;
//         }

//         return indexName;
//     }

//     /**
//      * Format the template name, similar to formatIndexName except it excludes
//      * template wildcards and the time series parts of the index name.
//     */
//     formatTemplateName<T extends Record<string, any>>(config: IndexConfig<T>): string {
//         utils.validateIndexConfig(config);

//         const { name, namespace } = config;

//         const indexName = utils.formatIndexName([
//             namespace, name, utils.getDataVersionStr(config)
//         ]);

//         return indexName;
//     }

//     /**
//      * Safely setup a versioned Index, its template and any other required resources
//      *
//      * @returns a boolean that indicates whether the index was created or not
//      */
//     async indexSetup<T extends Record<string, any>>(config: IndexConfig<T>): Promise<boolean> {
//         utils.validateIndexConfig(config);

//         const indexName = this.formatIndexName(config, false);
//         const logger = this._logger(config);

//         const settings = Object.assign({}, config.index_settings);

//         logger.trace(`Using ${this.clientMetadata.distribution} version ${this.clientMetadata.version}`);

//         const body = config.data_type.toESMapping({
//             typeName: config.name,
//             overrides: { settings },
//             ...this.clientMetadata,
//             ...config._meta && { _meta: config._meta }
//         });

//         const enableMutations = (
//             this.enableIndexMutations || utils.isTimeSeriesIndex(config.index_schema)
//         );

//         const addOrUpdateTemplate = async (allowNewFields = false) => {
//             if (enableMutations && utils.isTemplatedIndex(config.index_schema)) {
//                 const templateName = this.formatTemplateName(config);
//                 const schemaVersion = utils.getSchemaVersion(config);

//                 body.template = templateName;

//                 await this.upsertTemplate(
//                     {
//                         ...body,
//                         index_patterns: [this.formatIndexName(
//                             // only use wildcard for timeseries indices
//                             config, utils.isTimeSeriesIndex(config.index_schema)
//                         )],
//                         version: schemaVersion,
//                     },
//                     logger,
//                     allowNewFields
//                 );
//             }
//         };

//         if (await this.exists(indexName)) {
//             console.log('===indexExistYES', indexName);
//             if (!enableMutations) {
//                 logger.trace(`Index for config ${config.name} already exists`);
//                 return false;
//             }

//             logger.info(`Index for config ${config.name} already exists, updating the mappings`);
//             const updated = await this.updateMapping(indexName, config.name, body, logger);
//             if (updated) await addOrUpdateTemplate(true);
//             return false;
//         } else {
//             console.log('===indexExistNO', indexName);
//         }

//         await addOrUpdateTemplate();

//         if (!enableMutations) {
//             throw new Error(
//                 `Refusing to create index for config ${config.name} since mutations are disabled`
//             );
//         }

//         logger.info(`Creating index "${indexName}" for config ${config.name}...`);

//         try {
//             await this.client.indices.create(
//                 fixMappingRequest(
//                     this.client,
//                     {
//                         index: indexName,
//                         body,
//                     },
//                     false
//                 )
//             );
//         } catch (err) {
//             const errStr = parseError(err, true);
//             if (!errStr.includes('already_exists_exception')) {
//                 throw err;
//             }
//         }

//         logger.trace(`Checking index availability for "${indexName}"...`);

//         await this.waitForIndexAvailability(indexName);
//         const isActive = await this.isIndexActive(indexName);

//         if (!isActive) {
//             throw new Error(`Index "${indexName}" is not active`);
//         }

//         logger.trace(`Index "${indexName}" is ready for use`);

//         return true;
//     }

//     async isIndexActive(index: string): Promise<boolean> {
//         const stats = await this.client.indices.recovery({ index });

//         if (isEmpty(stats)) return false;

//         const getShardsPath = utils.shardsPath(index);
//         const shards = getShardsPath(stats);

//         return utils.verifyIndexShards(shards);
//     }

//     /**
//      * Perform an Index Migration
//      *
//      * **IMPORTANT** This is a potentially dangerous operation
//      * and should only when the cluster is properly shutdown.
//      *
//      * @todo add support for timeseries and templated indexes
//      * @todo add support for complicated re-indexing behaviors
//      */
//     async migrateIndex<T extends Record<string, any>>(
//         options: MigrateIndexOptions<T>
//     ): Promise<ClientResponse.ReindexResponse | boolean> {
//         const {
//             timeout, config, previousVersion, previousName, previousNamespace
//         } = options;

//         utils.validateIndexConfig(config);

//         const logger = this._logger(config);
//         let previousConfig = cloneDeep(config);

//         if (!config.index_schema || !previousConfig.index_schema) {
//             logger.warn('Missing index_schema on config, skipping migration');
//             return false;
//         }

//         if (config.index_schema.timeseries || config.index_schema.template) {
//             logger.warn('Migrating timeseries or template indexes are currently not supported');
//             return false;
//         }
//         const newIndexName = this.formatIndexName(config);

//         if (previousName) {
//             previousConfig.name = previousName;
//         }
//         if (previousNamespace) {
//             previousConfig.namespace = previousNamespace;
//         }
//         if (previousVersion) {
//             previousConfig.index_schema.version = previousVersion;
//         } else {
//             // try and decrement the to last version
//             const _previousConfig = cloneDeep(previousConfig);
//             _previousConfig.index_schema!.version!--;
//             if (_previousConfig.index_schema!.version! > 0) {
//                 const _indexName = this.formatIndexName(_previousConfig);
//                 const previousExists = await this.exists(_indexName);
//                 const newExists = await this.exists(newIndexName);

//                 if (previousExists && !newExists) {
//                     previousConfig = _previousConfig;
//                 }
//             }
//         }

//         const previousIndexName = this.formatIndexName(previousConfig);

//         await this.indexSetup(config);

//         if (newIndexName === previousIndexName) {
//             logger.warn(
//                 `No changes detected for index ${newIndexName},`,
//                 'if there are mapping changes make sure to bump index_schema.version'
//             );
//             return false;
//         }

//         logger.warn(`Reindexing the index ${previousIndexName} to ${newIndexName}`);

//         return this.client.reindex({
//             timeout,
//             wait_for_active_shards: 'all',
//             wait_for_completion: true,
//             body: {
//                 source: {
//                     index: previousIndexName,
//                 },
//                 dest: {
//                     index: newIndexName,
//                 },
//             },
//         });
//     }

//     async getMapping(index: string): Promise<ClientResponse.IndicesGetMappingResponse> {
//         const params: ClientParams.IndicesGetMappingParams = { index };

//         return this.client.indices.getMapping(params);
//     }

//     async putMapping(
//         index: string, type: string, properties: Record<string, any>
//     ): Promise<ClientResponse.IndicesPutMappingResponse> {
//         const params: ClientParams.IndicesPutMappingParams = {
//             index,
//             type,
//             body: {
//                 properties,
//             },
//         };

//         return this.client.indices.putMapping(params);
//     }

//     /**
//      * Safely update a mapping
//      *
//      * **WARNING:** This only updates the mapping if it exists
//      *
//      * @returns a boolean that indicates whether the mapping was updated
//      */
//     async updateMapping(
//         index: string, type: string, mapping: Record<string, any>, logger: Logger
//     ): Promise<boolean> {
//         const result = await this.getMapping(index);

//         const propertiesPath = !isElasticsearch6(this.client)
//             ? [
//                 'mappings', 'properties'
//             ]
//             : ['mappings', type, 'properties'];

//         const existing = get(result[index], propertiesPath, {});
//         const current = get(mapping, propertiesPath, {});

//         let breakingChange = false;
//         let safeChange = false;

//         const cFlattened = getFlattenedNamesAndTypes(current);
//         const eFlattened = getFlattenedNamesAndTypes(existing);
//         console.log('===cF', cFlattened);
//         console.log('===cF', eFlattened);

//         logger.trace({
//             current: cFlattened,
//             existing: eFlattened
//         }, `flattened mapping changes for ${index}`);

//         const changes: [type: 'changed' | 'removed' | 'added', field: string][] = [];
//         for (const [field, [cType, cExtra]] of Object.entries(cFlattened)) {
//             const eConfig = eFlattened[field];
//             if (eConfig == null) {
//                 safeChange = true;
//                 changes.push(['added', field]);
//             } else {
//                 const [eType, eExtra] = eConfig;
//                 if (eType !== cType || eExtra !== cExtra) {
//                     breakingChange = true;
//                     changes.push(['changed', field]);
//                 }
//             }
//         }

//         for (const field of Object.keys(eFlattened)) {
//             if (cFlattened[field] == null) {
//                 changes.push(['removed', field]);
//             }
//         }

//         const changesList = changes.map(([changeType, field]) => `${changeType} field "${field}"`);
//         const changesInfo = changesList.length ? ` CHANGES: ${changesList.join(', ')}` : '';

//         if (breakingChange) {
//             throw new Error(`Index ${index} (${type}) has breaking change in the mapping, increment the schema version to fix this.${changesInfo}`);
//         }

//         if (safeChange) {
//             logger.info(`Detected mapping changes for ${index} (${type}).${changesInfo}`);
//             await this.putMapping(index, type, current);
//             return true;
//         }

//         if (changesInfo) {
//             logger.info(`No major changes for ${index} (${type}).${changesInfo}`);
//         } else {
//             logger.info(`No changes for ${index} (${type}).${changesInfo}`);
//         }

//         return false;
//     }

//     async getTemplate(
//         name: string, flat_settings: boolean
//     ): Promise<ClientResponse.IndicesGetTemplateResponse> {
//         const params: ClientParams.IndicesGetTemplateParams = {
//             name,
//             flat_settings
//         };

//         return this.client.indices.getTemplate(params);
//     }

//     /**
//      * Safely create or update a template -
//      *
//      * NOTE: if version is same it will NOT update template,
//      * pass overrideCurrentVersion to allow
//      */
//     async upsertTemplate(
//         template: ESMapping, logger?: Logger, overrideCurrentVersion = false
//     ): Promise<void> {
//         const { template: name, version } = template;

//         try {
//             const templates = await this.getTemplate(name || '', true);
//             const latestVersion = templates[name || ''].version;
//             if ((version === latestVersion) && !overrideCurrentVersion) return;
//         } catch (err) {
//             if (err.statusCode !== 404) {
//                 throw err;
//             }
//         }

//         const params = fixMappingRequest(
//             this.client,
//             {
//                 body: template,
//                 name,
//             },
//             true
//         );

//         if (logger) {
//             logger.debug(`Upserting template "${name}"...`, params);
//         }

//         await this.client.indices.putTemplate(params);
//     }

//     protected async waitForIndexAvailability(index: string): Promise<void> {
//         const query: ClientParams.SearchParams = {
//             index,
//             q: '',
//             size: 0,
//             terminate_after: 1,
//         };

//         await pRetry(() => this.client.search(query), utils.getRetryConfig());
//     }

//     private _logger<T extends Record<string, any>>(config: IndexConfig<T>): Logger {
//         if (config.logger) return config.logger;

//         const logger = _loggers.get(config);
//         if (logger) return logger;

//         const debugLoggerName = `elasticsearch-store:index-manager:${config.name}`;
//         const newLogger = debugLogger(debugLoggerName);

//         _loggers.set(config, newLogger);
//         return newLogger;
//     }
// }

import {
    TSError, type Logger, toNumber, get,
    isTest, parseError, isEmpty, cloneDeep,
    pRetry, debugLogger
} from '@terascope/utils';
import type {
    ClientParams, ClientResponse, ClientMetadata, ESMapping
} from '@terascope/types';
import {
    type Client, getClientMetadata, isElasticsearch6, isValidClient,
    fixMappingRequest, getFlattenedNamesAndTypes
} from '@terascope/opensearch-client';
import * as utils from './utils/index.js';
import type { IndexConfig, MigrateIndexOptions } from './interfaces.js';

const _loggers = new WeakMap<IndexConfig<any>, Logger>();

/**
 * Manage Elasticsearch Indices
 */
export class IndexManager {
    readonly client: Client;
    readonly clientMetadata: ClientMetadata;

    enableIndexMutations: boolean;

    constructor(client: Client, enableIndexMutations = isTest) {
        if (!isValidClient(client)) {
            throw new TSError('IndexManager requires elasticsearch client', {
                fatalError: true,
            });
        }

        this.enableIndexMutations = enableIndexMutations;
        const { version, distribution } = getClientMetadata(client);

        const [majorVersion = 6, minorVersion = 8] = version.split('.').map(toNumber);
        this.clientMetadata = {
            version,
            distribution,
            majorVersion,
            minorVersion
        };

        this.client = client;
    }

    /** Verify the index exists */
    async exists(index: string): Promise<ClientResponse.IndicesExistsResponse> {
        return this.client.indices.exists({
            index,
        });
    }

    /**
     * Format the current index name.
     *
     * @param useWildcard if true a wildcard is added to the end of the end the index name
    */
    formatIndexName<T extends Record<string, any>>(
        config: IndexConfig<T>,
        useWildcard = true
    ): string {
        utils.validateIndexConfig(config);

        const { name, namespace } = config;
        const dataVersion = utils.getDataVersionStr(config);
        const schemaVersion = utils.getSchemaVersionStr(config);

        const indexName = utils.formatIndexName([namespace, name, dataVersion, schemaVersion]);

        if (utils.isTimeSeriesIndex(config.index_schema) && !useWildcard) {
            const timeSeriesFormat = utils.getRolloverFrequency(config);
            return utils.timeSeriesIndex(indexName, timeSeriesFormat);
        }

        if (utils.isTemplatedIndex(config.index_schema) && useWildcard) {
            return `${indexName}-*`;
        }

        return indexName;
    }

    /**
     * Format the template name, similar to formatIndexName except it excludes
     * template wildcards and the time series parts of the index name.
    */
    formatTemplateName<T extends Record<string, any>>(config: IndexConfig<T>): string {
        utils.validateIndexConfig(config);

        const { name, namespace } = config;

        const indexName = utils.formatIndexName([
            namespace, name, utils.getDataVersionStr(config)
        ]);

        return indexName;
    }

    /**
     * Safely setup a versioned Index, its template and any other required resources
     *
     * @returns a boolean that indicates whether the index was created or not
     */
    async indexSetup<T extends Record<string, any>>(config: IndexConfig<T>): Promise<boolean> {
        utils.validateIndexConfig(config);

        const indexName = this.formatIndexName(config, false);
        const logger = this._logger(config);

        const settings = Object.assign({}, config.index_settings);

        logger.trace(`Using ${this.clientMetadata.distribution} version ${this.clientMetadata.version}`);

        const body = config.data_type.toESMapping({
            typeName: config.name,
            overrides: {
                settings,
            },
            ...this.clientMetadata,
            ...config._meta && { _meta: config._meta }
        });

        const enableMutations = (
            this.enableIndexMutations || utils.isTimeSeriesIndex(config.index_schema)
        );

        if (enableMutations && utils.isTemplatedIndex(config.index_schema)) {
            const templateName = this.formatTemplateName(config);
            const schemaVersion = utils.getSchemaVersion(config);

            body.template = templateName;

            await this.upsertTemplate(
                {
                    ...body,
                    index_patterns: [this.formatIndexName(
                        // only use wildcard for timeseries indices
                        config, utils.isTimeSeriesIndex(config.index_schema)
                    )],
                    version: schemaVersion,
                },
                logger
            );
        }

        if (await this.exists(indexName)) {
            if (!enableMutations) {
                logger.trace(`Index for config ${config.name} already exists`);
                return false;
            }

            logger.info(`Index for config ${config.name} already exists, updating the mappings`);
            await this.updateMapping(indexName, config.name, body, logger);
            return false;
        }

        if (!enableMutations) {
            throw new Error(
                `Refusing to create index for config ${config.name} since mutations are disabled`
            );
        }

        logger.info(`Creating index "${indexName}" for config ${config.name}...`);

        try {
            await this.client.indices.create(
                fixMappingRequest(
                    this.client,
                    {
                        index: indexName,
                        body,
                    },
                    false
                )
            );
        } catch (err) {
            const errStr = parseError(err, true);
            if (!errStr.includes('already_exists_exception')) {
                throw err;
            }
        }

        logger.trace(`Checking index availability for "${indexName}"...`);

        await this.waitForIndexAvailability(indexName);
        const isActive = await this.isIndexActive(indexName);

        if (!isActive) {
            throw new Error(`Index "${indexName}" is not active`);
        }

        logger.trace(`Index "${indexName}" is ready for use`);

        return true;
    }

    async isIndexActive(index: string): Promise<boolean> {
        const stats = await this.client.indices.recovery({ index });

        if (isEmpty(stats)) return false;

        const getShardsPath = utils.shardsPath(index);
        const shards = getShardsPath(stats);

        return utils.verifyIndexShards(shards);
    }

    /**
     * Perform an Index Migration
     *
     * **IMPORTANT** This is a potentially dangerous operation
     * and should only when the cluster is properly shutdown.
     *
     * @todo add support for timeseries and templated indexes
     * @todo add support for complicated re-indexing behaviors
     */
    async migrateIndex<T extends Record<string, any>>(
        options: MigrateIndexOptions<T>
    ): Promise<ClientResponse.ReindexResponse | boolean> {
        const {
            timeout, config, previousVersion, previousName, previousNamespace
        } = options;

        utils.validateIndexConfig(config);

        const logger = this._logger(config);
        let previousConfig = cloneDeep(config);

        if (!config.index_schema || !previousConfig.index_schema) {
            logger.warn('Missing index_schema on config, skipping migration');
            return false;
        }

        if (config.index_schema.timeseries || config.index_schema.template) {
            logger.warn('Migrating timeseries or template indexes are currently not supported');
            return false;
        }
        const newIndexName = this.formatIndexName(config);

        if (previousName) {
            previousConfig.name = previousName;
        }
        if (previousNamespace) {
            previousConfig.namespace = previousNamespace;
        }
        if (previousVersion) {
            previousConfig.index_schema.version = previousVersion;
        } else {
            // try and decrement the to last version
            const _previousConfig = cloneDeep(previousConfig);
            _previousConfig.index_schema!.version!--;
            if (_previousConfig.index_schema!.version! > 0) {
                const _indexName = this.formatIndexName(_previousConfig);
                const previousExists = await this.exists(_indexName);
                const newExists = await this.exists(newIndexName);

                if (previousExists && !newExists) {
                    previousConfig = _previousConfig;
                }
            }
        }

        const previousIndexName = this.formatIndexName(previousConfig);

        await this.indexSetup(config);

        if (newIndexName === previousIndexName) {
            logger.warn(
                `No changes detected for index ${newIndexName},`,
                'if there are mapping changes make sure to bump index_schema.version'
            );
            return false;
        }

        logger.warn(`Reindexing the index ${previousIndexName} to ${newIndexName}`);

        return this.client.reindex({
            timeout,
            wait_for_active_shards: 'all',
            wait_for_completion: true,
            body: {
                source: {
                    index: previousIndexName,
                },
                dest: {
                    index: newIndexName,
                },
            },
        });
    }

    async getMapping(index: string): Promise<ClientResponse.IndicesGetMappingResponse> {
        const params: ClientParams.IndicesGetMappingParams = { index };

        return this.client.indices.getMapping(params);
    }

    async putMapping(
        index: string, type: string, properties: Record<string, any>
    ): Promise<ClientResponse.IndicesPutMappingResponse> {
        const params: ClientParams.IndicesPutMappingParams = {
            index,
            type,
            body: {
                properties,
            },
        };

        return this.client.indices.putMapping(params);
    }

    /**
     * Safely update a mapping
     *
     * **WARNING:** This only updates the mapping if it exists
     */
    async updateMapping(
        index: string, type: string, mapping: Record<string, any>, logger: Logger
    ): Promise<void> {
        const result = await this.getMapping(index);

        const propertiesPath = !isElasticsearch6(this.client)
            ? [
                'mappings', 'properties'
            ]
            : ['mappings', type, 'properties'];

        const existing = get(result[index], propertiesPath, {});
        const current = get(mapping, propertiesPath, {});

        let breakingChange = false;
        let safeChange = false;

        const cFlattened = getFlattenedNamesAndTypes(current);
        const eFlattened = getFlattenedNamesAndTypes(existing);

        logger.trace({
            current: cFlattened,
            existing: eFlattened
        }, `flattened mapping changes for ${index}`);

        const changes: [type: 'changed' | 'removed' | 'added', field: string][] = [];
        for (const [field, [cType, cExtra]] of Object.entries(cFlattened)) {
            const eConfig = eFlattened[field];
            if (eConfig == null) {
                safeChange = true;
                changes.push(['added', field]);
            } else {
                const [eType, eExtra] = eConfig;
                if (eType !== cType || eExtra !== cExtra) {
                    breakingChange = true;
                    changes.push(['changed', field]);
                }
            }
        }

        for (const field of Object.keys(eFlattened)) {
            if (cFlattened[field] == null) {
                changes.push(['removed', field]);
            }
        }

        const changesList = changes.map(([changeType, field]) => `${changeType} field "${field}"`);
        const changesInfo = changesList.length ? ` CHANGES: ${changesList.join(', ')}` : '';

        if (breakingChange) {
            throw new Error(`Index ${index} (${type}) has breaking change in the mapping, increment the schema version to fix this.${changesInfo}`);
        }

        if (safeChange) {
            logger.info(`Detected mapping changes for ${index} (${type}).${changesInfo}`);
            await this.putMapping(index, type, current);
            return;
        }

        if (changesInfo) {
            logger.info(`No major changes for ${index} (${type}).${changesInfo}`);
        } else {
            logger.info(`No changes for ${index} (${type}).${changesInfo}`);
        }
    }

    async getTemplate(
        name: string, flat_settings: boolean
    ): Promise<ClientResponse.IndicesGetTemplateResponse> {
        const params: ClientParams.IndicesGetTemplateParams = {
            name,
            flat_settings
        };
        return this.client.indices.getTemplate(params);
    }

    /**
     * Safely create or update a template
     */
    async upsertTemplate(
        template: ESMapping, logger?: Logger
    ): Promise<void> {
        const { template: name, version } = template;

        try {
            const templates = await this.getTemplate(name || '', true);
            const latestVersion = templates[name || ''].version;
            if (version === latestVersion) return;
        } catch (err) {
            if (err.statusCode !== 404) {
                throw err;
            }
        }

        const params = fixMappingRequest(
            this.client,
            {
                body: template,
                name,
            },
            true
        );

        if (logger) {
            logger.debug(`Upserting template "${name}"...`, params);
        }

        await this.client.indices.putTemplate(params);
    }

    protected async waitForIndexAvailability(index: string): Promise<void> {
        const query: ClientParams.SearchParams = {
            index,
            q: '',
            size: 0,
            terminate_after: 1,
        };

        await pRetry(() => this.client.search(query), utils.getRetryConfig());
    }

    private _logger<T extends Record<string, any>>(config: IndexConfig<T>): Logger {
        if (config.logger) return config.logger;

        const logger = _loggers.get(config);
        if (logger) return logger;

        const debugLoggerName = `elasticsearch-store:index-manager:${config.name}`;
        const newLogger = debugLogger(debugLoggerName);

        _loggers.set(config, newLogger);
        return newLogger;
    }
}
