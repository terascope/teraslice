import 'jest-extended';
import { debugLogger, get } from '@terascope/utils';
import * as simple from './helpers/simple-index';
import * as template from './helpers/template-index';
import {
    IndexManager, timeseriesIndex, IndexConfig, getESVersion
} from '../src';
import { makeClient, cleanupIndex } from './helpers/elasticsearch';
import { TEST_INDEX_PREFIX } from './helpers/config';

describe('IndexManager->indexSetup()', () => {
    const logger = debugLogger('index-manager-setup');

    describe('using a mapped index', () => {
        const client = makeClient();
        const esVersion = getESVersion(client);

        const config: IndexConfig<any> = {
            name: `${TEST_INDEX_PREFIX}simple`,
            data_type: simple.dataType,
            index_schema: {
                version: 1,
                strict: true,
            },
            version: 1,
            index_settings: {
                'index.number_of_shards': 1,
                'index.number_of_replicas': 0,
            },
            logger,
        };

        const index = `${config.name}-v1-s1`;

        const indexManager = new IndexManager(client);
        let result = false;

        beforeAll(async () => {
            await cleanupIndex(client, index);

            result = await indexManager.indexSetup(config);
        });

        afterAll(async () => {
            await cleanupIndex(client, index);

            client.close();
        });

        it('should create the versioned index', async () => {
            const exists = await client.indices.exists({
                index,
            });

            expect(exists).toBeTrue();
            expect(result).toBeTrue();
        });

        it('should create the mapping', async () => {
            const mapping = await indexManager.getMapping(index);

            expect(mapping).toHaveProperty(index);
            if (esVersion < 7) {
                expect(mapping[index].mappings).toHaveProperty(config.name);
            }
        });

        it('should be able to call create again', async () => {
            const created = await indexManager.indexSetup(config);
            expect(created).toBeFalse();
        });
    });

    describe('using a templated index', () => {
        const client = makeClient();
        const esVersion = getESVersion(client);

        const config: IndexConfig<any> = {
            name: `${TEST_INDEX_PREFIX}template`,
            data_type: template.dataType,
            index_schema: {
                version: 1,
                template: true,
                strict: true,
            },
            version: 1,
            index_settings: {
                'index.number_of_shards': 1,
                'index.number_of_replicas': 0,
            },
            logger,
        };

        const index = `${config.name}-v1-s1`;
        const templateName = `${config.name}-v1`;

        const indexManager = new IndexManager(client);
        let result = false;

        async function cleanup() {
            await cleanupIndex(client, index);
            await client.indices.deleteTemplate({ name: templateName }).catch(() => {});
        }

        beforeAll(async () => {
            await cleanup();

            result = await indexManager.indexSetup(config);
        });

        afterAll(async () => {
            await cleanup();

            client.close();
        });

        it('should create the versioned index', async () => {
            const exists = await client.indices.exists({
                index,
            });

            expect(exists).toBeTrue();
            expect(result).toBeTrue();
        });

        it('should create the mapping', async () => {
            const mapping = await indexManager.getMapping(index);

            expect(mapping).toHaveProperty(index);
            if (esVersion < 7) {
                expect(mapping[index].mappings).toHaveProperty(config.name);
            }
        });

        it('should create the template', async () => {
            const temp = await indexManager.getTemplate(templateName, false);

            expect(temp).toHaveProperty(templateName);
            if (esVersion < 7) {
                expect(temp[templateName].mappings).toHaveProperty(config.name);
            }
            expect(temp[templateName]).toHaveProperty('version', 1);
        });

        it('should be able upsert the same template safely', async () => {
            const { version } = config.index_schema!;

            const { mappings } = config.data_type.toESMapping(esVersion < 7 ? {
                typeName: config.name,
                version: esVersion,
            } : {
                version: esVersion,
            });

            await indexManager.upsertTemplate({
                template: templateName,
                settings: config.index_settings,
                mappings,
                version,
            });

            const temp = await indexManager.getTemplate(templateName, false);

            expect(temp).toHaveProperty(templateName);
            expect(temp[templateName]).toHaveProperty('version', version);
        });

        it('should be able to upsert a newer template safely', async () => {
            const mapping = get(config, ['index_schema', 'mapping'], {});
            const version = get(config, ['index_schema', 'version'], 1);

            const mappings = esVersion >= 7 ? mapping : {
                [config.name]: mapping
            };

            const newVersion = version + 1;
            await indexManager.upsertTemplate({
                template: templateName,
                settings: config.index_settings,
                mappings,
                version: newVersion,
            });

            const temp = await indexManager.getTemplate(templateName, false);

            expect(temp).toHaveProperty(templateName);
            expect(temp[templateName]).toHaveProperty('version', newVersion);
        });

        it('should be able to call create again', async () => {
            const created = await indexManager.indexSetup(config);
            expect(created).toBeFalse();
        });
    });

    describe('using a timeseries index', () => {
        const client = makeClient();
        const esVersion = getESVersion(client);

        const config: IndexConfig<any> = {
            name: `${TEST_INDEX_PREFIX}timeseries`,
            data_type: template.dataType,
            index_schema: {
                version: 1,
                template: true,
                timeseries: true,
                rollover_frequency: 'daily',
                strict: true,
            },
            version: 1,
            index_settings: {
                'index.number_of_shards': 1,
                'index.number_of_replicas': 0,
            },
            logger,
        };

        const index = `${config.name}-v1-*`;
        const currentIndexName = timeseriesIndex(`${config.name}-v1-s1`, 'daily');
        const templateName = `${config.name}-v1`;

        const indexManager = new IndexManager(client);
        let result = false;

        beforeAll(async () => {
            await cleanupIndex(client, index, templateName);

            result = await indexManager.indexSetup(config);
        });

        afterAll(async () => {
            await cleanupIndex(client, index, templateName);

            client.close();
        });

        it('should create the timeseries index', async () => {
            const exists = await client.indices.exists({
                index: currentIndexName,
            });

            expect(exists).toBeTrue();
            expect(result).toBeTrue();
        });

        it('should create the mapping', async () => {
            const mapping = await indexManager.getMapping(index);

            if (esVersion < 7) {
                expect(mapping[currentIndexName].mappings).toHaveProperty(config.name);
            }
        });

        it('should create the template', async () => {
            const temp = await indexManager.getTemplate(templateName, false);

            expect(temp).toHaveProperty(templateName);
            if (esVersion < 7) {
                expect(temp[templateName].mappings).toHaveProperty(config.name);
            }
            expect(temp[templateName]).toHaveProperty('version', 1);
        });

        it('should be able to call create again', async () => {
            const created = await indexManager.indexSetup(config);
            expect(created).toBeFalse();
        });
    });
});
