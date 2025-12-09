import 'jest-extended';
import { debugLogger, get, toBoolean } from '@terascope/core-utils';
import { getClientVersion, ElasticsearchTestHelpers, Client } from '@terascope/opensearch-client';
import * as simple from './helpers/simple-index.js';
import * as template from './helpers/template-index.js';
import {
    IndexManager, timeSeriesIndex, IndexConfig,
    __timeSeriesTest
} from '../src/index.js';

const {
    makeClient, cleanupIndex, getTestENVClientInfo, envConfig
} = ElasticsearchTestHelpers;

const { TEST_INDEX_PREFIX } = envConfig;

const { host, ...clientMetadata } = getTestENVClientInfo();

describe('IndexManager->indexSetup()', () => {
    const logger = debugLogger('index-manager-setup');

    describe('using a mapped index', () => {
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
            _meta: { foo: 'foo' }
        };

        const index = `${config.name}-v1-s1`;
        let indexManager: IndexManager;
        let client: Client;
        let result = false;

        beforeAll(async () => {
            client = await makeClient();
            indexManager = new IndexManager(client);

            await cleanupIndex(client, index);

            result = await indexManager.indexSetup(config);
        });

        afterAll(async () => {
            await cleanupIndex(client, index);
        });

        it('should create the versioned index', async () => {
            const response = await client.indices.exists({
                index,
            });
            const exists = get(response, 'body', response);

            expect(exists).toBeTrue();
            expect(result).toBeTrue();
        });

        it('should create the mapping', async () => {
            const mapping = await indexManager.getMapping(index);

            expect(mapping).toHaveProperty(index);
            expect(mapping[index].mappings).toHaveProperty('_meta', { foo: 'foo' });
        });

        it('should be able to call create again', async () => {
            const created = await indexManager.indexSetup(config);
            expect(created).toBeFalse();
        });

        it('should NOT create a template', async () => {
            expect.hasAssertions();
            try {
                const templateName = indexManager.formatTemplateName(config);
                await indexManager.getTemplate(templateName, false);
            } catch (error) {
                expect(error.statusCode).toBe(404);
            }
        });

        describe('when changing the data type', () => {
            const configV2: IndexConfig<any> = {
                ...config,
                data_type: simple.dataTypeV2,
            };

            beforeAll(async () => {
                result = await indexManager.indexSetup(configV2);
            });

            it('should return false since the index was already created', () => {
                expect(result).toBeFalse();
            });

            it('should have updated the index mapping', async () => {
                const mapping = await indexManager.getMapping(index);

                let properties = undefined;
                const { mappings } = mapping[index];

                properties = mappings.properties;

                expect(properties).toMatchObject({
                    test_object: {
                        properties: {
                            example: {
                                type: 'keyword',
                            },
                            added: {
                                type: 'keyword'
                            }
                        }
                    },
                });

                expect(mapping[index].mappings).toHaveProperty('_meta', { foo: 'foo' });
            });

            describe('when making a breaking change to the data type', () => {
                const configV3: IndexConfig<any> = {
                    ...config,
                    data_type: simple.dataTypeV3,
                };
                it('should throw attempting to change the index', async () => {
                    const changes = 'CHANGES: changed field "test_keyword", changed field "test_number", removed field "test_object.added"';
                    await expect(indexManager.indexSetup(configV3)).rejects.toThrow(
                        `Index ${index} has breaking change in the mapping, increment the schema version to fix this. ${changes}`
                    );
                });
            });

            describe('when changing the back data type', () => {
                beforeAll(async () => {
                    result = await indexManager.indexSetup(config);
                });

                it('should return false since the index was already created', () => {
                    expect(result).toBeFalse();
                });

                it('should NOT remove the added fields since removed fields shouldn\'t break', async () => {
                    const mapping = await indexManager.getMapping(index);

                    let properties = undefined;
                    const { mappings } = mapping[index];

                    properties = mappings.properties;

                    expect(properties).toMatchObject({
                        test_object: {
                            properties: {
                                example: {
                                    type: 'keyword',
                                },
                                added: {
                                    type: 'keyword'
                                }
                            }
                        },
                    });

                    expect(mapping[index].mappings).toHaveProperty('_meta', { foo: 'foo' });
                });
            });
        });
    });

    describe('using a templated index', () => {
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
            _meta: { bar: 'bar' }
        };

        const index = `${config.name}-v1-s1`;
        const templateName = `${config.name}-v1`;

        let indexManager: IndexManager;
        let client: Client;
        let version: number;
        let result = false;

        async function cleanup() {
            await cleanupIndex(client, index);
        }

        beforeAll(async () => {
            client = await makeClient();
            await cleanup();
            version = getClientVersion(client);
            indexManager = new IndexManager(client);

            result = await indexManager.indexSetup(config);
        });

        afterAll(async () => {
            await cleanup();
        });

        it('should create the versioned index', async () => {
            const response = await client.indices.exists({ index });
            const exists = get(response, 'body', response);

            expect(exists).toBeTrue();
            expect(result).toBeTrue();
        });

        it('should create the mapping', async () => {
            const mapping = await indexManager.getMapping(index);

            expect(mapping).toHaveProperty(index);
            expect(mapping[index].mappings).toHaveProperty('_meta', { bar: 'bar' });
        });

        it('should create the template', async () => {
            const temp = await indexManager.getTemplate(templateName, false);

            expect(temp).toHaveProperty(templateName);
            expect(temp[templateName]).toHaveProperty('version', 1);
            expect(temp[templateName].mappings).toHaveProperty('_meta', { bar: 'bar' });
        });

        it('should be able upsert the same template safely', async () => {
            const { version: schemaVersion } = config.index_schema!;

            const { mappings } = config.data_type.toESMapping({
                ...clientMetadata
            });

            await indexManager.upsertTemplate({
                template: templateName,
                settings: config.index_settings,
                mappings,
                version: schemaVersion,
            });

            const temp = await indexManager.getTemplate(templateName, false);

            expect(temp).toHaveProperty(templateName);
            expect(temp[templateName]).toHaveProperty('version', schemaVersion);
            expect(temp[templateName].mappings).toHaveProperty('_meta', { bar: 'bar' });
        });

        it('should be able to upsert a newer version template safely', async () => {
            const mapping = get(config, ['index_schema', 'mapping'], {});
            const schemaVersion = get(config, ['index_schema', 'version'], 1);

            const mappings = version !== 6
                ? mapping
                : {
                    [config.name]: mapping
                };

            const newVersion = schemaVersion + 1;
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

        it('should apply _meta to new indices', async () => {
            const mapping = get(config, ['index_schema', 'mapping'], {});
            const schemaVersion = get(config, ['index_schema', 'version'], 1);
            mapping._meta = { baz: 'baz' };

            const mappings = version !== 6
                ? mapping
                : {
                    [config.name]: mapping
                };
            await indexManager.upsertTemplate({
                template: 'foo',
                settings: config.index_settings,
                index_patterns: ['foo*'],
                mappings,
                version: schemaVersion
            });

            await indexManager.client.indices.create({ index: 'foobar' });

            const newIdxMapping = await indexManager.getMapping('foobar');

            expect(newIdxMapping.foobar.mappings).toHaveProperty('_meta', { baz: 'baz' });
        });

        it('should be able to call create again', async () => {
            const created = await indexManager.indexSetup(config);
            expect(created).toBeFalse();
        });
    });

    describe('using a timeseries index', () => {
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
        const currentIndexName = timeSeriesIndex(`${config.name}-v1-s1`, 'daily');
        const templateName = `${config.name}-v1`;

        let indexManager: IndexManager;
        let client: Client;
        let result = false;

        beforeAll(async () => {
            client = await makeClient();
            indexManager = new IndexManager(client);
            await cleanupIndex(client, index, templateName);

            result = await indexManager.indexSetup(config);
        });

        afterAll(async () => {
            await cleanupIndex(client, index, templateName);
        });

        it('should create the timeseries index', async () => {
            const response = await client.indices.exists({ index });
            const exists = get(response, 'body', response);

            expect(exists).toBeTrue();
            expect(result).toBeTrue();
        });

        it('should create the mapping', async () => {
            const mapping = await indexManager.getMapping(index);

            expect(mapping[currentIndexName].mappings).not.toHaveProperty(config.name);
            expect(mapping[currentIndexName].mappings).toHaveProperty('properties');
            expect(mapping[currentIndexName].mappings).toHaveProperty('dynamic');
        });

        it('should create the template', async () => {
            const temp = await indexManager.getTemplate(templateName, false);

            expect(temp).toHaveProperty(templateName);
            expect(temp[templateName]).toHaveProperty('version', 1);

            const mapping = config.data_type.toESMapping();
            const fixed = mapping.mappings?._doc?.properties || mapping.mappings.properties;
            expect(temp[templateName]?.mappings?.properties).toMatchObject(fixed);
        });

        it('should be able to call create again', async () => {
            const created = await indexManager.indexSetup(config);
            expect(created).toBeFalse();
        });

        it('should update the mapping & template if new fields detected', async () => {
            const manager = new IndexManager(client, false);

            // verify mapping/template don't have new field yet
            const oldTemp = (await indexManager.getTemplate(templateName, false))[templateName];
            const oldMapping = (await indexManager.getMapping(index))[currentIndexName].mappings;
            const _expectedOld = template.dataType.toESMapping();
            const expectedOld = _expectedOld?.mappings?._doc || _expectedOld?.mappings;
            expect(oldTemp.mappings?.properties).toMatchObject(expectedOld.properties);
            expect(oldMapping?.properties).toMatchObject(expectedOld.properties);

            await manager.indexSetup({
                ...config,
                data_type: template.dataTypeV2,
                enable_index_mutations: false,
            });

            const tempMapping = (await indexManager.getTemplate(templateName, false))[templateName];
            expect(tempMapping.version).toBe(1);

            const mapping = (await indexManager.getMapping(index))[currentIndexName].mappings;

            const _expected = template.dataTypeV2.toESMapping();
            const expected = _expected?.mappings?._doc || _expected?.mappings;

            // verify properties in template and mapping have new data type field
            expect(mapping.properties).toMatchObject(expected.properties);
            expect(tempMapping.mappings?.properties).toMatchObject(expected.properties);

            // verify dynamic hasn't changed
            expect(mapping.dynamic).toBeDefined();
            expect(toBoolean(mapping.dynamic)).toBeFalse();

            expect(tempMapping?.mappings?.dynamic).toBeDefined();
            expect(tempMapping?.mappings?.dynamic).toBeFalse();

            expect(expected.dynamic).toBeDefined();
            expect(expected.dynamic).toBeFalse();
        });

        it('should add mapping & template if version changed', async () => {
            const manager = new IndexManager(client, false);

            // verify mapping/template have the new field added above
            const oldTemp = (await indexManager.getTemplate(templateName, false))[templateName];
            const oldMapping = (await indexManager.getMapping(index))[currentIndexName].mappings;
            const _expectedOld = template.dataTypeV2.toESMapping();
            const expectedOld = _expectedOld?.mappings?._doc || _expectedOld?.mappings;
            expect(oldTemp.mappings?.properties).toMatchObject(expectedOld.properties);
            expect(oldMapping?.properties).toMatchObject(expectedOld.properties);

            const newVersionConfig = {
                ...config,
                index_schema: {
                    ...config.index_schema,
                    version: 2
                },
                enable_index_mutations: false,
            };

            await manager.indexSetup(newVersionConfig);

            const tempMapping = (await indexManager.getTemplate(templateName, false))[templateName];
            expect(tempMapping?.version).toBe(2);

            const indexName = indexManager.formatIndexName(newVersionConfig, false);
            const { mappings } = (await indexManager.getMapping(index))[indexName];

            // won't have new field added in previous test since new version
            const _expected = template.dataType.toESMapping();
            const expected = _expected?.mappings?._doc || _expected?.mappings;

            // verify properties in template and mapping
            expect(mappings.properties).toMatchObject(expected.properties);
            expect(tempMapping.mappings?.properties).toMatchObject(expected.properties);
            expect(mappings.properties).not.toHaveProperty(template.newField);
            expect(tempMapping.mappings?.properties).not.toHaveProperty(template.newField);

            // verify dynamic hasn't changed
            expect(mappings.dynamic).toBeDefined();
            expect(toBoolean(mappings.dynamic)).toBeFalse();

            expect(tempMapping?.mappings?.dynamic).toBeDefined();
            expect(tempMapping?.mappings?.dynamic).toBeFalse();

            expect(expected.dynamic).toBeDefined();
            expect(expected.dynamic).toBeFalse();
        });

        it('should be able to call create a new index if a day has passed', async () => {
            // disable index mutations
            const noIndexMutations = new IndexManager(client, false);
            const originalIndex = indexManager.formatIndexName(config, false);

            const ONE_HOUR = 60 * 60 * 1000;
            const ONE_DAY = 24 * ONE_HOUR;

            __timeSeriesTest.date = new Date(Date.now() + ONE_DAY + ONE_HOUR);
            const newIndex = noIndexMutations.formatIndexName(config, false);

            const created = await noIndexMutations.indexSetup({
                ...config,
                enable_index_mutations: false,
            });

            expect(created).toBeTrue();
            expect(await noIndexMutations.exists(newIndex)).toBeTrue();
            expect(newIndex).not.toBe(originalIndex);
        });
    });
});
