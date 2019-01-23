import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import * as utils from './utils';
import { IndexConfig } from './interfaces';
import { getRetryConfig } from './config';

const _loggers = new WeakMap<IndexConfig, ts.Logger>();

/** Manage Elasticsearch Indicies */
export default class IndexManager {
    readonly client: es.Client;

    constructor(client: es.Client) {
        if (!utils.isValidClient(client)) {
            throw new ts.TSError('IndexManager requires elasticsearch client', {
                fatalError: true
            });
        }

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

        const indexName = utils.formatIndexName([
            namespace,
            name,
            dataVersion,
            schemaVersion,
        ]);

        if (utils.isTimeSeriesIndex(config.indexSchema) && !useWildcard) {
            const timeSeriesFormat = utils.getRolloverFrequency(config);
            return utils.timeseriesIndex(indexName, timeSeriesFormat);
        }

        if (utils.isTemplatedIndex(config.indexSchema) && useWildcard) {
            return `${indexName}*`;
        }

        return indexName;
    }

    formatTemplateName(config: IndexConfig) {
        utils.validateIndexConfig(config);

        const { name, namespace } = config;

        return utils.formatIndexName([
            namespace,
            name,
            utils.getDataVersionStr(config)
        ]);
    }

    /**
     * Safely setup a versioned Index, its template and any other required resouces
     *
     * @todo This should handle better index change detection
     *
     * @returns a boolean that indicates whether the index was created or not
    */
    async indexSetup(config: IndexConfig): Promise<boolean> {
        utils.validateIndexConfig(config);

        const indexName = this.formatIndexName(config, false);
        const logger = this._logger(config);

        if (await this.exists(indexName)) {
            logger.debug(`Index "${indexName}" already exists`);
            return false;
        }

        const settings = Object.assign({}, config.indexSettings);

        const body: any = {
            settings,
            mappings: {}
        };

        body.mappings[config.name] = utils.getIndexMapping(config);

        if (utils.isTemplatedIndex(config.indexSchema)) {
            const templateName = this.formatTemplateName(config);
            const schemaVersion = utils.getSchemaVersion(config);

            body.template = templateName;
            body.version = schemaVersion;

            logger.debug(`Upserting template "${templateName}"...`, body);
            await this.upsertTemplate(body);
        }

        logger.debug(`Creating "${indexName}"...`, body);

        await this.client.indices.create({
            index: indexName,
            body,
        });

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
    */
    async migrateIndex(config: MigrateIndexConfig): Promise<void> {
        return;
    }

    /**
     * Safely create or update a template
    */
    async upsertTemplate(template: any) {
        const { template: name, version } = template;
        try {
            const templates = await this.client.indices.getTemplate({
                name,
                flatSettings: true,
            });
            const latestVersion = templates[name].version;
            if (version === latestVersion) return;
        } catch (err) {
            if (err.statusCode !== 404) {
                throw err;
            }
        }

        await this.client.indices.putTemplate({
            body: template,
            name,
        });
    }

    protected async waitForIndexAvailability(index: string) {
        const query = { index, q: '*', size: 1 };

        await ts.pRetry(() => this.client.search(query), getRetryConfig());
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

export interface MigrateIndexConfig {
    to: IndexConfig;
    from: IndexConfig;
    /**
     * @default Infinity
     */
    timeout: number;
}
