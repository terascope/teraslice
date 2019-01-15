import get from 'lodash.get';
import { isInteger, getTypeOf } from '@terascope/utils';
import * as es from 'elasticsearch';
import { IndexConfig, ESError } from './interfaces';
import {
    isSimpleIndex,
    isTemplatedIndex,
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
     * Safely setup a versioned Index, its template and any other required resouces
     *
     * @returns a boolean that indicates whether the index was created or not
    */
    async indexSetup(config: IndexConfig): Promise<boolean> {
        const indexName = this.formatIndexName(config, false);

        if (await this.exists(indexName)) return false;
        if (config.indexSchema == null) return false;

        const settings = Object.assign({}, config.indexSettings);

        const body: any = {
            settings,
            mappings: {}
        };

        body.mappings[config.index] = config.indexSchema.mapping;

        if (isSimpleIndex(config.indexSchema)) {
            await this.client.indices.create({
                index: indexName,
                body,
            });
        }

        if (isTemplatedIndex(config.indexSchema)) {
            const templateName = this.formatTemplateName(config);
            const { schemaVersion } = this.getVersions(config);

            body.template = templateName;
            body.version = schemaVersion;

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
        const {
            indexSchema = { version: 1 },
            version = 1
        } = config || {};

        if (!isInteger(indexSchema.version)) {
            const error = new Error(`Index Version must a Integer, got "${getTypeOf(indexSchema.version)}"`) as ESError;
            error.statusCode = 422;
            throw error;
        }

        if (!isInteger(version)) {
            const error = new Error(`Data Version must a Integer, got "${getTypeOf(version)}"`) as ESError;
            error.statusCode = 422;
            throw error;
        }

        if (indexSchema.version < 1) {
            const error = new Error(`Index Version must be greater than 0, got "${indexSchema.version}"`) as ESError;
            error.statusCode = 422;
            throw error;
        }

        if (version < 1) {
            const error = new Error(`Data Version must be greater than 0, got "${version}"`) as ESError;
            error.statusCode = 422;
            throw error;
        }

        return {
            schemaVersion: indexSchema.version,
            dataVersion: version
        };
    }

    /**
     * Safely create or update a template
    */
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
