import 'jest-extended';
import { TSError } from '@terascope/utils';
import {
    DataType, DataTypeConfig, LATEST_VERSION, formatSchema
} from '../src';

describe('DataType (graphql)', () => {
    describe('->toGraphQL', () => {
        it('should return graphql results', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Text', description: '## hello \n\n# test' },
                    location: { type: 'GeoPoint', description: 'location test' },
                    date: { type: 'Date' },
                    ip: { type: 'IP', description: 'ip test' },
                    example_obj: { type: 'Object', description: 'example obj test' },
                    someNum: { type: 'Long', description: 'some number test' },
                },
            };

            const dataType = new DataType(typeConfig, 'myType', 'default description');
            const results = dataType.toGraphQL({
                description: 'My test data type\nsome extra desc \n '
            });

            const schema = formatSchema(`
                    scalar JSONObject

                    type DTGeoPointV1 {
                        lat: String!
                        lon: String!
                    }

                    # My test data type
                    # some extra desc
                    type myType {
                        date: String
                        # example obj test
                        example_obj: JSONObject
                        # # hello
                        # test
                        hello: String
                        # ip test
                        ip: String
                        # location test
                        location: DTGeoPointV1
                        # some number test
                        someNum: Int
                    }
                `);

            expect(results).toEqual(schema);
        });

        it('should handle the case when the is a nested field', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    'example.foo': { type: 'Keyword' },
                    'example.bar': { type: 'Keyword' },
                    'example.a': { type: 'Keyword' },
                    example: { type: 'Object' },
                },
            };

            const dataType = new DataType(typeConfig, 'ObjType', 'nested field test description');
            expect(dataType.toGraphQL({ createInputType: true })).toEqual(
                formatSchema(`
                        type DTObjTypeExampleV1 {
                            a: String
                            bar: String
                            foo: String
                        }

                        # nested field test description
                        type ObjType {
                            example: DTObjTypeExampleV1
                        }

                        input DTObjTypeExampleInputV1 {
                            a: String
                            bar: String
                            foo: String
                        }

                        # Input for ObjType - nested field test description
                        input ObjTypeInput {
                            example: DTObjTypeExampleInputV1
                        }
                    `)
            );
        });

        it('should add type name at toGraphQL call', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Text' },
                    location: { type: 'GeoPoint' },
                    date: { type: 'Date' },
                    ip: { type: 'IP' },
                    someNum: { type: 'Long' },
                },
            };

            const results = new DataType(typeConfig, 'myType').toGraphQL({ typeName: 'otherType' });
            const schema = formatSchema(`
                    type DTGeoPointV1 {
                        lat: String!
                        lon: String!
                    }

                    type otherType {
                        date: String
                        hello: String
                        ip: String
                        location: DTGeoPointV1
                        someNum: Int
                    }
                `);

            expect(results).toEqual(schema);
        });

        it('should throw when no name is provided with a toGraphQL call', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Text' },
                    location: { type: 'GeoPoint' },
                    date: { type: 'Date' },
                    ip: { type: 'IP' },
                    someNum: { type: 'Long' },
                },
            };

            try {
                new DataType(typeConfig).toGraphQL();
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('No typeName was specified to create the graphql type representing this data structure');
            }
        });
    });

    describe('#mergeGraphQLSchemas', () => {
        it('can build a single graphql schema from multiple types', () => {
            const typeConfig1: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Text' },
                    location: { type: 'GeoPoint' },
                    date: { type: 'Date' },
                    ip: { type: 'IP' },
                    someNum: { type: 'Long' },
                },
            };

            const typeConfig2: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Text' },
                    location: { type: 'GeoPoint' },
                    otherLocation: { type: 'GeoPoint' },
                    bool: { type: 'Boolean' },
                },
            };

            const types = [new DataType(typeConfig1, 'firstType'), new DataType(typeConfig2, 'secondType')];

            const results = DataType.mergeGraphQLDataTypes(types, {
                customTypes: ['scalar FOOO'],
                removeScalars: true
            });
            const schema = formatSchema(`
                    type firstType {
                        date: String
                        hello: String
                        ip: String
                        location: DTGeoPointV1
                        someNum: Int
                    }

                    type DTGeoPointV1 {
                        lat: String!
                        lon: String!
                    }

                    type secondType {
                        bool: Boolean
                        hello: String
                        location: DTGeoPointV1
                        otherLocation: DTGeoPointV1
                    }
                `);

            expect(results).toEqual(schema);
        });

        it('should be able to generate the input types', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    _created: { type: 'Date' },
                    _updated: { type: 'Date' },
                    _key: { type: 'Keyword' },
                    name: { type: 'KeywordCaseInsensitive' },
                    description: { type: 'Text' },
                },
            };

            const types = [
                new DataType(typeConfig, 'TestRecord'),
            ];

            const result = DataType.mergeGraphQLDataTypes(types, {
                createInputTypes: true,
            });
            const schema = formatSchema(`
                    type TestRecord {
                        _created: String
                        _key: ID
                        _updated: String
                        description: String
                        name: String
                    }

                    # Input for TestRecord
                    input TestRecordInput {
                        description: String
                        name: String
                    }
                `);
            expect(result).toEqual(schema);
        });

        it('can merge schema without the result scalars', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    test_obj: { type: 'Object' },
                    test_geo: { type: 'GeoJSON' },
                },
            };

            const types = [new DataType(typeConfig, 'Test')];

            const result = DataType.mergeGraphQLDataTypes(types, { removeScalars: true });
            const schema = formatSchema(`
                    scalar JSONObject
                    scalar GeoJSON

                    type Test {
                        test_geo: GeoJSON
                        test_obj: JSONObject
                    }
                `, true);

            expect(result).toEqual(schema);
            expect(result).not.toInclude('scalar');
            expect(schema).not.toInclude('scalar');
        });

        it('should throw when given duplicte type names', () => {
            const typeConfig1: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Keyword' },
                },
            };

            const typeConfig2: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Text' },
                },
            };

            const typeConfig3: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Keyword' },
                    hi: { type: 'Keyword' },
                },
            };

            const types = [
                new DataType(typeConfig1, 'Hello'),
                new DataType(typeConfig2, 'Hello'),
                new DataType(typeConfig3, 'Hello'),
            ];

            expect(() => {
                DataType.mergeGraphQLDataTypes(types, { removeScalars: true });
            }).toThrowError(/Unable to process duplicate DataType "Hello"/);
        });

        it('should throw when given a type without a type name', () => {
            const typeConfig1: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Keyword' },
                },
            };

            const types = [
                new DataType(typeConfig1),
            ];

            expect(() => {
                DataType.mergeGraphQLDataTypes(types);
            }).toThrowError(/Unable to process DataType with missing type name/);
        });

        it('should be able to combine mulitple types together with references', () => {
            const infoTypeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    id: { type: 'Text' },
                },
            };

            const childTypeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: 'Text' },
                    location: { type: 'GeoPoint' },
                    date: { type: 'Date' },
                    ip: { type: 'IP' },
                    long_number: { type: 'Long' },
                },
            };

            const parentTypeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    location: { type: 'GeoPoint' },
                    other_location: { type: 'GeoPoint' },
                    obj: { type: 'Object' },
                    some_date: { type: 'Date' },
                },
            };
            const types = [
                new DataType(infoTypeConfig, 'Info'),
                new DataType(childTypeConfig, 'ChildType'),
                new DataType(parentTypeConfig, 'ParentType'),
            ];

            const results = DataType.mergeGraphQLDataTypes(types, {
                references: {
                    __all: ['info(query: String): Info'],
                    ChildType: ['num_parents: Int'],
                    ParentType: ['children: ChildType'],
                }
            });

            const schema = formatSchema(`
                    scalar JSONObject

                    type Info {
                        id: String
                        # references and virtual fields
                        info(query: String): Info
                    }

                    type ChildType {
                        date: String
                        hello: String
                        ip: String
                        location: DTGeoPointV1
                        long_number: Int
                        # references and virtual fields
                        info(query: String): Info
                        num_parents: Int
                    }

                    type DTGeoPointV1 {
                        lat: String!
                        lon: String!
                    }

                    type ParentType {
                        location: DTGeoPointV1
                        obj: JSONObject
                        other_location: DTGeoPointV1
                        some_date: String
                        # references and virtual fields
                        info(query: String): Info
                        children: ChildType
                    }
                `);

            expect(results).toEqual(schema);
        });
    });
});
