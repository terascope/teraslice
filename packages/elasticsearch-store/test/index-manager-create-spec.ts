import 'jest-extended';
import es from 'elasticsearch';
import * as simple from './helpers/simple-index';
import * as template from './helpers/template-index';
import { ELASTICSEARCH_HOST } from './helpers/config';
import { IndexManager } from '../src';

describe('IndexManager->create()', () => {
    describe('using a mapped index', () => {
        const client = new es.Client({
            host: ELASTICSEARCH_HOST,
            log: 'error'
        });

        const config = {
            index: 'test__simple',
            indexSchema: {
                version: 'v1.0.0',
                mapping: simple.mapping,
                strict: true,
            },
            version: 'v1.0.0',
            indexSettings: {
                'index.number_of_shards': 1,
                'index.number_of_replicas': 1
            }
        };

        const index = `${config.index}-v1-s1`;

        const indexManager = new IndexManager(client);
        let result = false;

        beforeAll(async () => {
            await client.indices.delete({ index })
                    .catch(() => {});

            result = await indexManager.create(config);
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
            expect(mapping[index].mappings).toHaveProperty(config.index);
        });

        it('should be able to call create again', async () => {
            const created = await indexManager.create(config);
            expect(created).toBeFalse();
        });
    });

    describe('using a templated index', () => {
        const client = new es.Client({
            host: ELASTICSEARCH_HOST,
            log: 'error'
        });

        const config = {
            index: 'test__template',
            indexSchema: {
                version: 'v1.0.0',
                template: template.mapping,
                strict: true,
            },
            version: 'v1.0.0',
            indexSettings: {
                'index.number_of_shards': 1,
                'index.number_of_replicas': 1
            }
        };

        const index = `${config.index}-v1-s1`;
        const templateName = `${config.index}-v1-template`;

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

            result = await indexManager.create(config);
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
            expect(mapping[index].mappings).toHaveProperty(config.index);
        });

        it('should create the template', async () => {
            const template = await client.indices.getTemplate({
                name: templateName
            });

            expect(template).toHaveProperty(templateName);
            expect(template[templateName].mappings).toHaveProperty(config.index);
            expect(template[templateName]).toHaveProperty('version', 1);
        });

        it('should be able to call create again', async () => {
            const created = await indexManager.create(config);
            expect(created).toBeFalse();
        });
    });
});
