import get from 'lodash.get';
import * as es from 'elasticsearch';
import { isSimpleIndex, getMajorVersion } from './utils';
import { IndexConfig } from './interfaces';

/** Manage ElasticSearch Indicies */
export default class IndexManager {
    readonly client: es.Client;

    constructor(client: es.Client) {
        this.client = client;
    }

    /**
     * Create an index
     * @returns a boolean that indicates whether the index was created or not
    */
    async create(config: IndexConfig): Promise<boolean> {
        const indexName = this.formatIndexName(config);
        if (await this.exists(indexName)) return false;

        if (isSimpleIndex(config.indexSchema)) {
            const settings = config.indexSettings || {
                'index.number_of_shards': 5,
                'index.number_of_replicas': 1,
            };

            const mappings = {};
            mappings[indexName] = config.indexSchema.mapping;

            await this.client.indices.create({
                index: indexName,
                body: {
                    settings,
                    mappings,
                },
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

    formatIndexName(config: IndexConfig) {
        const { index } = config;
        const schemaVersion = getMajorVersion(get(config, 'indexSchema.version'));
        const dataVersion = getMajorVersion(get(config, 'version'));

        if (!index) {
            throw new Error('Invalid index name, must not be empty');
        }

        if (index.includes('-')) {
            throw new Error('Invalid index name, must not be include "-"');
        }

        return `${index}-v${dataVersion}-s${schemaVersion}`;
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
