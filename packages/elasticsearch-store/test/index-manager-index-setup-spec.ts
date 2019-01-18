import 'jest-extended';
import es from 'elasticsearch';
import { debugLogger } from '@terascope/utils';
import * as simple from './helpers/simple-index';
import * as template from './helpers/template-index';
import { ELASTICSEARCH_HOST } from './helpers/config';
import { IndexManager, timeseriesIndex, IndexConfig } from '../src';

describe('IndexManager->indexSetup()', () => {
    const logger = debugLogger('index-manager-setup');

    describe('using a mapped index', () => {
        const client = new es.Client({
            host: ELASTICSEARCH_HOST,
            log: 'error'
        });

        const config: IndexConfig = {
            name: 'test__simple',
            indexSchema: {
                version: 1,
                mapping: simple.mapping,
                strict: true,
            },
            version: 1,
            indexSettings: {
                'index.number_of_shards': 1,
                'index.number_of_replicas': 1
            },
            logger,
        };

        const index = `${config.name}-v1-s1`;

        const indexManager = new IndexManager(client);
        let result = false;

        beforeAll(async () => {
            await client.indices.delete({ index })
                    .catch(() => {});

            result = await indexManager.indexSetup(config);
        });

        afterAll(async () => {
            await client.indices.delete({ index })
                    .catch(() => {});

            client.close();
        });

        it('should create the versioned index', async () => {
            const exists = await client.indices.exists({
                index
            });

            expect(exists).toBeTrue();
            expect(result).toBeTrue();
        });

        it('should create the mapping', async () => {
            const mapping = await client.indices.getMapping({
                index
            });

            expect(mapping).toHaveProperty(index);
            expect(mapping[index].mappings).toHaveProperty(config.name);
        });

        it('should be able to call create again', async () => {
            const created = await indexManager.indexSetup(config);
            expect(created).toBeFalse();
        });
    });

    describe('using a templated index', () => {
        const client = new es.Client({
            host: ELASTICSEARCH_HOST,
            log: 'error'
        });

        const config: IndexConfig = {
            name: 'test__template',
            indexSchema: {
                version: 1,
                mapping: template.mapping,
                template: true,
                strict: true,
            },
            version: 1,
            indexSettings: {
                'index.number_of_shards': 1,
                'index.number_of_replicas': 1
            },
            logger,
        };

        const index = `${config.name}-v1-s1`;
        const templateName = `${config.name}-v1`;

        const indexManager = new IndexManager(client);
        let result = false;

        async function cleanup() {
            await client.indices.delete({ index })
                    .catch(() => {});
            await client.indices.deleteTemplate({ name: templateName })
                    .catch(() => {});
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
                index
            });

            expect(exists).toBeTrue();
            expect(result).toBeTrue();
        });

        it('should create the mapping', async () => {
            const mapping = await client.indices.getMapping({
                index
            });

            expect(mapping).toHaveProperty(index);
            expect(mapping[index].mappings).toHaveProperty(config.name);
        });

        it('should create the template', async () => {
            const template = await client.indices.getTemplate({
                name: templateName
            });

            expect(template).toHaveProperty(templateName);
            expect(template[templateName].mappings).toHaveProperty(config.name);
            expect(template[templateName]).toHaveProperty('version', 1);
        });

        it('should be able upsert the same template safely', async () => {
            // @ts-ignore
            const mapping = config.indexSchema.mapping;
            // @ts-ignore
            const version = config.indexSchema.version;

            const mappings = {};
            mappings[config.name] = mapping;

            await indexManager.upsertTemplate({
                template: templateName,
                settings: config.indexSettings,
                mappings,
                version,
            });

            const template = await client.indices.getTemplate({
                name: templateName
            });

            expect(template).toHaveProperty(templateName);
            expect(template[templateName]).toHaveProperty('version', version);
        });

        it('should be able to upsert a newer template safely', async () => {
            // @ts-ignore
            const mapping = config.indexSchema.mapping;
            // @ts-ignore
            const version = config.indexSchema.version;

            const mappings = {};
            mappings[config.name] = mapping;

            const newVersion = version + 1;
            await indexManager.upsertTemplate({
                template: templateName,
                settings: config.indexSettings,
                mappings,
                version: newVersion,
            });

            const template = await client.indices.getTemplate({
                name: templateName
            });

            expect(template).toHaveProperty(templateName);
            expect(template[templateName]).toHaveProperty('version', newVersion);
        });

        it('should be able to call create again', async () => {
            const created = await indexManager.indexSetup(config);
            expect(created).toBeFalse();
        });
    });

    describe('using a timeseries index', () => {
        const client = new es.Client({
            host: ELASTICSEARCH_HOST,
            log: 'error'
        });

        const config: IndexConfig = {
            name: 'test__timeseries',
            indexSchema: {
                version: 1,
                mapping: template.mapping,
                template: true,
                timeseries: true,
                rollover_frequency: 'daily',
                strict: true,
            },
            version: 1,
            indexSettings: {
                'index.number_of_shards': 1,
                'index.number_of_replicas': 1
            },
            logger,
        };

        const index = `${config.name}-v1-*`;
        const currentIndexName = timeseriesIndex(`${config.name}-v1-s1`, 'daily');
        const templateName = `${config.name}-v1`;

        const indexManager = new IndexManager(client);
        let result = false;

        async function cleanup() {
            await client.indices.delete({ index })
                    .catch(() => {});
            await client.indices.deleteTemplate({ name: templateName })
                    .catch(() => {});
        }

        beforeAll(async () => {
            await cleanup();

            result = await indexManager.indexSetup(config);
        });

        afterAll(async () => {
            await cleanup();

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
            const mapping = await client.indices.getMapping({
                index
            });

            expect(mapping[currentIndexName].mappings).toHaveProperty(config.name);
        });

        it('should create the template', async () => {
            const template = await client.indices.getTemplate({
                name: templateName
            });

            expect(template).toHaveProperty(templateName);
            expect(template[templateName].mappings).toHaveProperty(config.name);
            expect(template[templateName]).toHaveProperty('version', 1);
        });

        it('should be able to call create again', async () => {
            const created = await indexManager.indexSetup(config);
            expect(created).toBeFalse();
        });
    });
});
