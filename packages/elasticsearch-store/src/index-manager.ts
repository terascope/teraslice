import get from 'lodash.get';
import * as es from 'elasticsearch';
import { isInteger, getTypeOf, pRetry } from '@terascope/utils';
import { IndexConfig, ESError } from './interfaces';
import {
    isSimpleIndex,
    isTemplatedIndex,
    isValidClient,
    isValidConfig,
    isTimeSeriesIndex,
    timeseriesIndex
} from './utils';

const isTest = process.env.NODE_ENV === 'test';
const AVAILABILITY_RETRIES = isTest ? 3 : 100;

/** Manage ElasticSearch Indicies */
export default class IndexManager {
    readonly client: es.Client;

    constructor(client: es.Client) {
        if (!isValidClient(client)) {
            throw new Error('IndexManager requires elasticsearch client');
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

        await this.waitForIndexAvailability(indexName);
        const isActive = await this.isIndexActive(indexName);

        if (!isActive) {
            throw new Error(`Index "${indexName}" is not active`);
        }

        return true;
    }

    async isIndexActive(index: string): Promise<boolean> {
        const stats = await this.client.indices.recovery({ index });
        if (stats == null || !Object.keys(stats).length) return false;

        type Shard = { primary: boolean, stage: string };
        const shards: Shard[] = get(stats, [index, 'shards'], []);

        return shards
            .filter((shard) => {
                return shard.primary === true;
            }).every((shard) => {
                return shard.stage === 'DONE';
            });
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
    async upsertTemplate(template: any, name: string) {
        const exists = await this.client.indices.existsTemplate({ name });
        if (exists) return;

        await this.client.indices.putTemplate({
            body: template,
            name,
        });
    }

    protected async waitForIndexAvailability(index: string) {
        const query = { index, q: '*', size: 1 };
        await pRetry(() => this.client.search(query), AVAILABILITY_RETRIES);
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
