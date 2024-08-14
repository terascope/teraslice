import 'jest-extended';
import { DataTypeConfig, FieldType } from '@terascope/types';
import { DataType, LATEST_VERSION, formatSchema } from '../src/index.js';

describe('DataType (graphql)', () => {
    describe('->toGraphQL', () => {
        it('should return graphql results', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: FieldType.Text, description: '## hello \n\n# test' },
                    location: { type: FieldType.GeoPoint, description: 'location test' },
                    date: { type: FieldType.Date },
                    ip: { type: FieldType.IP, description: 'ip test' },
                    example_obj: { type: FieldType.Object, description: 'example obj test' },
                    someNum: { type: FieldType.Long, description: 'some number test' },
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
                        someNum: Float
                    }
                `);

            expect(results).toEqual(schema);
        });

        it('should handle the case when the is a nested field', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    'example.foo': { type: FieldType.Keyword },
                    'example.bar': { type: FieldType.Keyword },
                    'example.a': { type: FieldType.Keyword },
                    example: { type: FieldType.Object },
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

                        input DTObjTypeExampleInputV1 {
                            a: String
                            bar: String
                            foo: String
                        }

                        # nested field test description
                        type ObjType {
                            example: DTObjTypeExampleV1
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
                    hello: { type: FieldType.Text },
                    location: { type: FieldType.GeoPoint },
                    date: { type: FieldType.Date },
                    ip: { type: FieldType.IP },
                    someNum: { type: FieldType.Long },
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
                        someNum: Float
                    }
                `);

            expect(results).toEqual(schema);
        });

        it('should throw when no name is provided with a toGraphQL call', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: FieldType.Text },
                    location: { type: FieldType.GeoPoint },
                    date: { type: FieldType.Date },
                    ip: { type: FieldType.IP },
                    someNum: { type: FieldType.Long },
                },
            };

            expect(() => {
                new DataType(typeConfig).toGraphQL();
            }).toThrowError('No typeName was specified to create the graphql type representing this data structure');
        });
    });

    describe('#mergeGraphQLSchemas', () => {
        it('can build a single graphql schema from multiple types', () => {
            const typeConfig1: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: FieldType.Text },
                    location: { type: FieldType.GeoPoint },
                    date: { type: FieldType.Date },
                    ip: { type: FieldType.IP },
                    someNum: { type: FieldType.Long },
                },
            };

            const typeConfig2: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: FieldType.Text },
                    location: { type: FieldType.GeoPoint },
                    otherLocation: { type: FieldType.Boundary, array: true },
                    bool: { type: FieldType.Boolean },
                },
            };

            const types = [new DataType(typeConfig1, 'firstType'), new DataType(typeConfig2, 'secondType')];

            const results = DataType.mergeGraphQLDataTypes(types, {
                customTypes: ['scalar FOOO'],
                removeScalars: true
            });

            const schema = formatSchema(`
                type DTGeoPointV1 {
                    lat: String!
                    lon: String!
                }

                type DTGeoBoundaryV1 {
                    lat: Float!
                    lon: Float!
                }

                type firstType {
                    date: String
                    hello: String
                    ip: String
                    location: DTGeoPointV1
                    someNum: Float
                }

                type secondType {
                    bool: Boolean
                    hello: String
                    location: DTGeoPointV1
                    otherLocation: [[DTGeoBoundaryV1]]
                }
            `);

            expect(results.trim()).toEqual(schema.trim());
        });

        it('can build use snake case when needed', () => {
            const typeConfig1: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: FieldType.Text },
                    location: { type: FieldType.GeoPoint },
                    date: { type: FieldType.Date },
                    ip: { type: FieldType.IP },
                    someNum: { type: FieldType.Long },
                },
            };

            const typeConfig2: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: FieldType.Text },
                    location: { type: FieldType.GeoPoint },
                    otherLocation: { type: FieldType.Boundary, array: true },
                    foo: { type: FieldType.Object },
                    'foo.bar': { type: FieldType.Keyword },
                    bool: { type: FieldType.Boolean },
                },
            };

            const types = [
                new DataType(typeConfig1, 'first_type'),
                new DataType(typeConfig2, 'second_type')
            ];

            const results = DataType.mergeGraphQLDataTypes(types, {
                customTypes: ['scalar FOOO'],
                createInputTypes: true,
                useSnakeCase: true,
                removeScalars: true
            });

            const schema = formatSchema(`
                type DTGeoPointV1 {
                    lat: String!
                    lon: String!
                }

                input DTGeoPointInputV1 {
                    lat: String!
                    lon: String!
                }

                type DT_second_type_foo_V1 {
                   bar: String
                }

                input DT_second_type_foo_input_V1 {
                   bar: String
                }

                type DTGeoBoundaryV1 {
                    lat: Float!
                    lon: Float!
                }

                input DTGeoBoundaryInputV1 {
                    lat: Float!
                    lon: Float!
                }

                type first_type {
                    date: String
                    hello: String
                    ip: String
                    location: DTGeoPointV1
                    someNum: Float
                }

                # Input for first_type
                input first_type_input {
                    date: String
                    hello: String
                    ip: String
                    location: DTGeoPointInputV1
                    someNum: Float
                }

                type second_type {
                    bool: Boolean
                    foo: DT_second_type_foo_V1
                    hello: String
                    location: DTGeoPointV1
                    otherLocation: [[DTGeoBoundaryV1]]
                }

                # Input for second_type
                input second_type_input {
                    bool: Boolean
                    foo: DT_second_type_foo_input_V1
                    hello: String
                    location: DTGeoPointInputV1
                    otherLocation: [[DTGeoBoundaryInputV1]]
                }
            `);

            expect(results.trim()).toEqual(schema.trim());
        });

        it('should be able to generate the input types', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    _created: { type: FieldType.Date },
                    _updated: { type: FieldType.Date },
                    _key: { type: FieldType.Keyword },
                    name: { type: FieldType.KeywordCaseInsensitive },
                    description: { type: FieldType.Text },
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
                    test_obj: { type: FieldType.Object },
                    test_geo: { type: FieldType.GeoJSON },
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
                    hello: { type: FieldType.Keyword },
                },
            };

            const typeConfig2: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: FieldType.Text },
                },
            };

            const typeConfig3: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: FieldType.Keyword },
                    hi: { type: FieldType.Keyword },
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
                    hello: { type: FieldType.Keyword },
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
                    id: { type: FieldType.Text },
                },
            };

            const childTypeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: FieldType.Text },
                    location: { type: FieldType.GeoPoint },
                    date: { type: FieldType.Date },
                    ip: { type: FieldType.IP },
                    long_number: { type: FieldType.Long },
                },
            };

            const parentTypeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    location: { type: FieldType.GeoPoint },
                    other_location: { type: FieldType.GeoPoint },
                    obj: { type: FieldType.Object },
                    some_date: { type: FieldType.Date },
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
                    type DTGeoPointV1 {
                        lat: String!
                        lon: String!
                    }

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
                        long_number: Float
                        # references and virtual fields
                        info(query: String): Info
                        num_parents: Int
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
