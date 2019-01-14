import get from 'lodash.get';
import * as es from 'elasticsearch';
import { IndexConfig } from './interfaces';
import {
    isSimpleIndex,
    isTemplatedIndex,
    getMajorVersion,
    isValidClient,
    isValidConfig,
    isTimeSeriesIndex,
    timeseriesIndex
} from './utils';

/** Manage ElasticSearch Indicies */
export default class IndexManager {
    readonly client: es.Client;

    constructor(client: es.Client) {
        if (!isValidClient(client)) {
            throw new Error('IndexManager requires elasticsearch client');
        }
        this.client = client;
    }

    /**
     * Create an index
     * @returns a boolean that indicates whether the index was created or not
    */
    async create(config: IndexConfig): Promise<boolean> {
        const indexName = this.formatIndexName(config, false);
        if (await this.exists(indexName)) return false;

        const settings = Object.assign({}, config.indexSettings);

        if (isSimpleIndex(config.indexSchema)) {
            const body = {
                settings,
                mappings: {}
            };

            body.mappings[config.index] = config.indexSchema.mapping;

            await this.client.indices.create({
                index: indexName,
                body,
            });
        }

        if (isTemplatedIndex(config.indexSchema)) {
            const templateName = this.formatTemplateName(config);
            const { schemaVersion } = this.getVersions(config);

            const body = {
                template: templateName,
                version: schemaVersion,
                settings,
                mappings: {}
            };

            body.mappings[config.index] = config.indexSchema.template;

            await this.upsertTemplate(body, templateName);

            await this.client.indices.create({
                index: indexName,
                body,
            });
        }

        return true;
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

    /** Verify the index exists */
    async exists(index: string): Promise<boolean> {
        return this.client.indices.exists({
            index,
        });
    }

    formatIndexName(config: IndexConfig, useWildcard = true) {
        if (!isValidConfig(config)) {
            throw new Error('Invalid config passed to formatIndexName');
        }

        const { index } = config;
        const { dataVersion, schemaVersion } = this.getVersions(config);

        if (index.includes('-')) {
            throw new Error('Invalid index name, must not be include "-"');
        }

        const indexName = `${index}-v${dataVersion}-s${schemaVersion}`;
        if (isTimeSeriesIndex(config.indexSchema) && !useWildcard) {
            const timeSeriesFormat = get(config, 'indexSchema.rollover_frequency');
            return timeseriesIndex(indexName, timeSeriesFormat);
        }

        if (isTemplatedIndex(config.indexSchema) && useWildcard) {
            return `${indexName}*`;
        }

        return indexName;
    }

    formatTemplateName(config: IndexConfig) {
        if (!isValidConfig(config)) {
            throw new Error('Invalid config passed to formatTemplateName');
        }

        const { index } = config;
        const { dataVersion } = this.getVersions(config);

        if (index.includes('-')) {
            throw new Error('Invalid index name, must not be include "-"');
        }

        return `${index}-v${dataVersion}_template`;
    }

    getVersions(config: IndexConfig): { dataVersion: number, schemaVersion: number; } {
        const schemaVersion = getMajorVersion(get(config, 'indexSchema.version'));
        const dataVersion = getMajorVersion(get(config, 'version'));
        return { schemaVersion, dataVersion };
    }

    async upsertTemplate(template: any, name: string) {
        const exists = await this.client.indices.existsTemplate({ name });
        if (exists) return;

        await this.client.indices.putTemplate({
            body: template,
            name,
        });
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
