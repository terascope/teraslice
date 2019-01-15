import get from 'lodash.get';
import * as es from 'elasticsearch';
import { pRetry, TSError } from '@terascope/utils';
import { IndexConfig } from './interfaces';
import {
    isSimpleIndex,
    isTemplatedIndex,
    isValidClient,
    validateIndexConfig,
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
            throw new TSError('IndexManager requires elasticsearch client', {
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
        validateIndexConfig(config);

        const { name } = config;
        const { dataVersion, schemaVersion } = this.getVersions(config);

        const indexName = `${name}-v${dataVersion}-s${schemaVersion}`;
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
        validateIndexConfig(config);

        const { name } = config;
        const { dataVersion } = this.getVersions(config);

        return `${name}-v${dataVersion}`;
    }

    getVersions(config: IndexConfig): { dataVersion: number, schemaVersion: number; } {
        validateIndexConfig(config);

        const {
            indexSchema = { version: 1 },
            version = 1
        } = config;

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
        validateIndexConfig(config);

        const indexName = this.formatIndexName(config, false);

        if (await this.exists(indexName)) return false;
        if (config.indexSchema == null) return false;

        const settings = Object.assign({}, config.indexSettings);

        const body: any = {
            settings,
            mappings: {}
        };

        body.mappings[config.name] = config.indexSchema.mapping;

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
