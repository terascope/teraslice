import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import * as utils from './utils';
import { IndexConfig, MigrateIndexOptions } from './interfaces';

const _loggers = new WeakMap<IndexConfig, ts.Logger>();

/**
 * Manage Elasticsearch Indicies
 */
export default class IndexManager {
    readonly client: es.Client;
    readonly esVersion: number;
    enableIndexMutations: boolean;

    constructor(client: es.Client, enableIndexMutations = ts.isTest) {
        if (!utils.isValidClient(client)) {
            throw new ts.TSError('IndexManager requires elasticsearch client', {
                fatalError: true,
            });
        }

        this.enableIndexMutations = enableIndexMutations;
        this.esVersion = utils.getESVersion(client);
        this.client = client;
    }

    /** Verify the index exists */
    async exists(index: string): Promise<boolean> {
        return this.client.indices.exists({
            index,
        });
    }

    formatIndexName(config: IndexConfig, useWildcard = true) {
        utils.validateIndexConfig(config);

        const { name, namespace } = config;
        const dataVersion = utils.getDataVersionStr(config);
        const schemaVersion = utils.getSchemaVersionStr(config);

        const indexName = utils.formatIndexName([namespace, name, dataVersion, schemaVersion]);

        if (utils.isTimeSeriesIndex(config.index_schema) && !useWildcard) {
            const timeSeriesFormat = utils.getRolloverFrequency(config);
            return utils.timeseriesIndex(indexName, timeSeriesFormat);
        }

        if (utils.isTemplatedIndex(config.index_schema) && useWildcard) {
            return `${indexName}*`;
        }

        return indexName;
    }

    formatTemplateName(config: IndexConfig) {
        utils.validateIndexConfig(config);

        const { name, namespace } = config;

        return utils.formatIndexName([namespace, name, utils.getDataVersionStr(config)]);
    }

    /**
     * Safely setup a versioned Index, its template and any other required resouces
     *
     * @todo this should handle better index change detection
     *
     * @returns a boolean that indicates whether the index was created or not
     */
    async indexSetup(config: IndexConfig): Promise<boolean> {
        utils.validateIndexConfig(config);

        const indexName = this.formatIndexName(config, false);
        const logger = this._logger(config);

        const settings = Object.assign({}, config.index_settings);

        logger.trace(`Using elasticsearch version ${this.esVersion}`);

        const body: any = config.data_type.toESMapping({
            typeName: config.name,
            version: this.esVersion,
            overrides: {
                settings,
            }
        });

        if (this.enableIndexMutations && utils.isTemplatedIndex(config.index_schema)) {
            const templateName = this.formatTemplateName(config);
            const schemaVersion = utils.getSchemaVersion(config);

            body.template = templateName;

            await this.upsertTemplate(
                {
                    ...body,
                    version: schemaVersion,
                },
                logger
            );
        }

        if (await this.exists(indexName)) {
            if (!this.enableIndexMutations) {
                logger.trace(`Index for config ${config.name} already exists`);
                return false;
            }

            logger.info(`Index for config ${config.name} already exists, updating the mappings`);
            await this.updateMapping(indexName, config.name, body, logger);
            return false;
        }

        if (!this.enableIndexMutations) {
            throw new Error(
                `Refusing to create index for config ${config.name} since mutations are disabled`
            );
        }

        logger.info(`Creating index "${indexName}" for config ${config.name}...`);

        try {
            await this.client.indices.create(
                utils.fixMappingRequest(
                    this.client,
                    {
                        index: indexName,
                        body,
                    },
                    false
                )
            );
        } catch (err) {
            const errStr = ts.parseError(err, true);
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
        if (ts.isEmpty(stats)) return false;

        const getShardsPath = utils.shardsPath(index);
        const shards = getShardsPath(stats);

        return utils.verifyIndexShards(shards);
    }

    /**
     * Perform an Index Migration
     *
     * **IMPORTANT** This is a potentionally dangerous operation
     * and should only when the cluster is properly shutdown.
     *
     * @todo add support for timeseries and templated indexes
     * @todo add support for complicated reindexing behaviors
     */
    async migrateIndex(options: MigrateIndexOptions): Promise<any> {
        const {
            timeout, config, previousVersion, previousName, previousNamespace
        } = options;
        utils.validateIndexConfig(config);

        const logger = this._logger(config);
        let previousConfig = ts.cloneDeep(config);

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
            const _previousConfig = ts.cloneDeep(previousConfig);
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
            waitForActiveShards: 'all',
            waitForCompletion: true,
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

    async getMapping(index: string) {
        const params: any = { index };
        if (this.esVersion === 7) {
            params.includeTypeName = false;
        }
        return this.client.indices.getMapping(params);
    }

    async putMapping(index: string, type: string, properties: any) {
        const params: any = {
            index,
            type,
            body: {
                properties,
            },
        };
        if (this.esVersion >= 7) {
            delete params.type;
            params.includeTypeName = false;
        }
        return this.client.indices.putMapping(params);
    }

    /**
     * Safely update a mapping
     *
     * **WARNING:** This only updates the mapping if it exists
     */
    async updateMapping(index: string, type: string, mapping: any, logger: ts.Logger) {
        const result = await this.getMapping(index);

        const propertiesPath = this.esVersion >= 7 ? [
            'mappings', 'properties'
        ] : ['mappings', type, 'properties'];

        const existing = ts.get(result[index], propertiesPath, {});
        const current = ts.get(mapping, propertiesPath, {});

        let breakingChange = false;
        let safeChange = false;

        for (const field of Object.keys(current)) {
            if (existing[field] == null) {
                logger.warn(`Missing field "${field}" on index ${index} (${type})`);
                safeChange = true;
                continue;
            }
            const cType = ts.get(current, [field, 'type']);
            const eType = ts.get(existing, [field, 'type']);
            if (cType === 'object' && ts.get(existing, [field, 'properties'])) {
                continue;
            }

            if (eType !== cType) {
                logger.warn(`Field "${field}" changed on index ${index} (${type}) from type "${eType}" to "${cType}"`);
                breakingChange = true;
            }
        }

        if (breakingChange) {
            // FIXME should we crash
            logger.error(`Index ${index} (${type}) has breaking change in the index, evaulate the differences and migrate if needed`);
            return;
        }

        if (safeChange) {
            logger.info(`Detected a new field for ${index} (${type})`);
            await this.putMapping(index, type, current);
        }
    }

    async getTemplate(name: string, flatSettings: boolean) {
        const params: any = { name, flatSettings };
        if (this.esVersion === 7) {
            params.includeTypeName = false;
        }
        return this.client.indices.getTemplate(params);
    }

    /**
     * Safely create or update a template
     */
    async upsertTemplate(template: any, logger?: ts.Logger) {
        const { template: name, version } = template;
        try {
            const templates = await this.getTemplate(name, true);
            const latestVersion = templates[name].version;
            if (version === latestVersion) return;
        } catch (err) {
            if (err.statusCode !== 404) {
                throw err;
            }
        }

        const params = utils.fixMappingRequest(
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

    protected async waitForIndexAvailability(index: string) {
        const query = {
            index,
            q: '',
            size: 0,
            terminate_after: '1',
        };

        await ts.pRetry(() => this.client.search(query), utils.getRetryConfig());
    }

    private _logger(config: IndexConfig): ts.Logger {
        if (config.logger) return config.logger;

        const logger = _loggers.get(config);
        if (logger) return logger;

        const debugLoggerName = `elasticsearch-store:index-manager:${config.name}`;
        const newLogger = ts.debugLogger(debugLoggerName);

        _loggers.set(config, newLogger);
        return newLogger;
    }
}
