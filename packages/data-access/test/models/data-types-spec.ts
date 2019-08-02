import 'jest-extended';
import { LATEST_VERSION } from '@terascope/data-types';
import { makeClient, cleanupIndex } from '../helpers/elasticsearch';
import { DataTypes, DataType } from '../../src/models/data-types';
import { TEST_INDEX_PREFIX } from '../helpers/config';

describe('DataTypes', () => {
    const client = makeClient();
    const dataTypes = new DataTypes(client, {
        namespace: `${TEST_INDEX_PREFIX}da`,
    });

    beforeAll(async () => {
        await cleanupIndex(dataTypes);
        return dataTypes.initialize();
    });

    afterAll(async () => {
        await cleanupIndex(dataTypes);
        return dataTypes.shutdown();
    });

    describe('when using a basic type config', () => {
        let created: DataType;
        beforeAll(async () => {
            created = await dataTypes.create({
                client_id: 1,
                name: 'hello',
                config: {
                    version: LATEST_VERSION,
                    fields: {
                        location: { type: 'Geo' },
                        some_date: { type: 'Date' },
                        'foo.bar': { type: 'IP' },
                    },
                },
            });
        });

        it('should be able to apply a full update', async () => {
            await dataTypes.update({
                id: created.id,
                config: {
                    version: LATEST_VERSION,
                    fields: {
                        location: { type: 'Geo' },
                        // make sure a dot notated field can be set
                        'foo.bar': { type: 'IP' },
                    },
                },
            });

            const fetched = await dataTypes.resolveDataType(created.id);

            // ignore the updated timestamp and type config
            const { updated: __, config: ___, ..._created } = created;
            const { updated: ____, config: _____, ..._fetched } = fetched;
            expect(_created).toEqual(_fetched);

            // ensure the type config was created/updated corectly
            expect(created.config.fields).toHaveProperty('location', { type: 'Geo' });
            expect(fetched.config.fields).toHaveProperty('location', { type: 'Geo' });
            expect(created.config.fields).toHaveProperty('some_date', { type: 'Date' });
            expect(fetched.config.fields).not.toHaveProperty('some_date', { type: 'Date' });
            expect(created.config.fields).toContainEntry(['foo.bar', { type: 'IP' }]);
            expect(fetched.config.fields).toContainEntry(['foo.bar', { type: 'IP' }]);
        });
    });

    describe('when inheriting from another data type', () => {
        let inheritFrom: DataType;
        let inherited: DataType;
        let resolved: DataType;

        beforeAll(async () => {
            inheritFrom = await dataTypes.create({
                client_id: 1,
                name: 'inherit-from-a',
                config: {
                    version: LATEST_VERSION,
                    fields: {
                        foo: { type: 'Keyword' },
                    },
                },
            });

            inherited = await dataTypes.create({
                client_id: 1,
                name: 'inherited',
                inherit_from: [inheritFrom.id],
                config: {
                    version: LATEST_VERSION,
                    fields: {
                        bar: { type: 'Float' },
                    },
                },
            });

            resolved = await dataTypes.resolveDataType(inherited.id);
        });

        it('should be able to get the resolved type config', () => {
            expect(resolved.config).toEqual({
                version: LATEST_VERSION,
                fields: {
                    foo: { type: 'Keyword' },
                    bar: { type: 'Float' },
                },
            });
        });
    });

    describe('when inheriting from mutliple data types', () => {
        let inheritFromC: DataType;
        let inheritFromB: DataType;
        let inheritFromA: DataType;
        let inherited: DataType;
        let resolved: DataType;

        beforeAll(async () => {
            inheritFromC = await dataTypes.create({
                client_id: 1,
                name: 'multi-inherit-from-c',
                config: {
                    version: LATEST_VERSION,
                    fields: {
                        common: { type: 'Date' },
                        c_common: { type: 'Byte' },
                        c: { type: 'Text' },
                    },
                },
            });

            inheritFromB = await dataTypes.create({
                client_id: 1,
                name: 'multi-inherit-from-b',
                config: {
                    version: LATEST_VERSION,
                    fields: {
                        common: { type: 'Geo' },
                        c_common: { type: 'Byte' },
                        c: { type: 'Keyword' },
                    },
                },
            });

            inheritFromA = await dataTypes.create({
                client_id: 1,
                name: 'multi-inherit-from-a',
                inherit_from: [inheritFromB.id, inheritFromC.id],
                config: {
                    version: LATEST_VERSION,
                    fields: {
                        common: { type: 'IP' },
                        a_common: { type: 'Hostname' },
                        a: { type: 'Boolean' },
                    },
                },
            });

            inherited = await dataTypes.create({
                client_id: 1,
                name: 'multi-inherit',
                inherit_from: [inheritFromA.id],
                config: {
                    version: LATEST_VERSION,
                    fields: {
                        common: { type: 'NgramTokens' },
                        top_level: { type: 'Short' },
                    },
                },
            });

            resolved = await dataTypes.resolveDataType(inherited.id);
        });

        it('should be able to get the resolved type config', () => {
            expect(resolved.config).toEqual({
                version: LATEST_VERSION,
                fields: {
                    common: { type: 'NgramTokens' },
                    a_common: { type: 'Hostname' },
                    a: { type: 'Boolean' },
                    c_common: { type: 'Byte' },
                    c: { type: 'Keyword' },
                    top_level: { type: 'Short' },
                },
            });
        });
    });

    describe('when creating a circular reference', () => {
        let circularA: DataType;
        let circularB: DataType;

        beforeAll(async () => {
            circularA = await dataTypes.create({
                client_id: 1,
                name: 'circular-a',
                config: {
                    version: LATEST_VERSION,
                    fields: {
                        foo: {
                            type: 'Boolean',
                        },
                    },
                },
            });

            circularB = await dataTypes.create({
                client_id: 1,
                name: 'circular-b',
                inherit_from: [circularA.id],
                config: {
                    version: LATEST_VERSION,
                    fields: {},
                },
            });

            await dataTypes.update({
                ...circularA,
                inherit_from: [circularB.id],
            });
        });

        describe('when validate is set to true', () => {
            it('should throw an error when resolving the record A', async () => {
                expect.hasAssertions();

                try {
                    const result = await dataTypes.resolveDataType(circularA.id);
                    expect(result).toThrowError();
                } catch (err) {
                    expect(err.message).toStartWith('Circular reference to Data Type');
                    expect(err.statusCode).toEqual(422);
                }
            });

            it('should throw an error when resolving record B', async () => {
                expect.hasAssertions();

                try {
                    const result = await dataTypes.resolveDataType(circularB.id, {
                        validate: true,
                    });
                    expect(result).toThrowError();
                } catch (err) {
                    expect(err.message).toStartWith('Circular reference to Data Type');
                    expect(err.statusCode).toEqual(422);
                }
            });
        });

        describe('when validate is set to false', () => {
            it('should not include that data type', async () => {
                const result = await dataTypes.resolveDataType(circularA.id, {
                    validate: false,
                });
                expect(result.config).toHaveProperty('fields.foo', {
                    type: 'Boolean',
                });
            });
        });
    });

    describe('when there is a version mismatch', () => {
        let dtA: DataType;
        let dtB: DataType;

        beforeAll(async () => {
            dtA = await dataTypes.create({
                client_id: 1,
                name: 'mismatch-dt-a',
                config: {
                    version: 2 as any,
                    fields: {},
                },
            });

            dtB = await dataTypes.create({
                client_id: 1,
                name: 'mismatch-dt-b',
                inherit_from: [dtA.id],
                config: {
                    version: LATEST_VERSION,
                    fields: {},
                },
            });
        });

        describe('when validate is set to true', () => {
            it('should throw an error when the version are wrong', async () => {
                expect.hasAssertions();

                try {
                    const result = await dataTypes.resolveDataType(dtB.id, {
                        validate: true,
                    });
                    expect(result).toThrowError();
                } catch (err) {
                    expect(err.message).toEndWith('has a mismatched version, expected version 2');
                    expect(err.statusCode).toEqual(417);
                }
            });
        });

        describe('when validate is set to false', () => {
            it('should throw an error when the version are wrong', async () => {
                const dataType = await dataTypes.resolveDataType(dtB.id, {
                    validate: false,
                });
                expect(dataType.config.version).toEqual(dtA.config.version);
            });
        });
    });
});
