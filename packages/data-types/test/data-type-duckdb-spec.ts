import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { DataType } from '../src/data-type.js';

/** The DuckDB type a single-field DataType produces. */
function duckTypeOf(
    type: FieldType,
    extra: Record<string, unknown> = {},
    siblings: Record<string, unknown> = {}
): string {
    const config = {
        version: 1,
        fields: { field: { type, ...extra }, ...siblings },
    } as DataTypeConfig;
    return new DataType(config).toDuckDB().field;
}

describe('DataType -> DuckDB', () => {
    describe('scalar field types', () => {
        // The numeric ladder maps to the width data-mate actually enforces, NOT the width
        // the type name suggests, and the reasons live on each type class.
        const cases: [FieldType, string][] = [
            [FieldType.Boolean, 'BOOLEAN'],
            [FieldType.Byte, 'TINYINT'],
            [FieldType.Short, 'SMALLINT'],
            [FieldType.Integer, 'BIGINT'],
            [FieldType.Long, 'HUGEINT'],
            [FieldType.Float, 'DOUBLE'],
            [FieldType.Double, 'DOUBLE'],
            [FieldType.Number, 'DOUBLE'],
            [FieldType.Vector, 'DOUBLE'],
            [FieldType.Keyword, 'VARCHAR'],
            [FieldType.KeywordCaseInsensitive, 'VARCHAR'],
            [FieldType.KeywordTokens, 'VARCHAR'],
            [FieldType.KeywordTokensCaseInsensitive, 'VARCHAR'],
            [FieldType.KeywordPathAnalyzer, 'VARCHAR'],
            [FieldType.NgramTokens, 'VARCHAR'],
            [FieldType.Text, 'VARCHAR'],
            [FieldType.String, 'VARCHAR'],
            [FieldType.Domain, 'VARCHAR'],
            [FieldType.Hostname, 'VARCHAR'],
            [FieldType.IP, 'VARCHAR'],
            [FieldType.IPRange, 'VARCHAR'],
            [FieldType.Date, 'TIMESTAMP'],
            [FieldType.Binary, 'VARCHAR'],
            [FieldType.GeoPoint, 'STRUCT(lat DOUBLE, lon DOUBLE)'],
            [FieldType.Geo, 'STRUCT(lat DOUBLE, lon DOUBLE)'],
            [FieldType.Boundary, 'STRUCT(lat DOUBLE, lon DOUBLE)[]'],
            [FieldType.GeoJSON, 'JSON'],
            [FieldType.Any, 'JSON'],
        ];

        describe.each(cases)('%s', (type, expected) => {
            it(`maps to ${expected}`, () => {
                expect(duckTypeOf(type)).toEqual(expected);
            });
        });

        it('covers every field type that has a v1 class', () => {
            // a guard against adding a FieldType and forgetting toDuckDB
            expect(cases).toHaveLength(28);
        });
    });

    describe('arrays', () => {
        it('wraps a scalar as a DuckDB list', () => {
            expect(duckTypeOf(FieldType.Keyword, { array: true })).toEqual('VARCHAR[]');
            expect(duckTypeOf(FieldType.Integer, { array: true })).toEqual('BIGINT[]');
        });

        it('wraps a struct type as a list', () => {
            expect(duckTypeOf(FieldType.GeoPoint, { array: true }))
                .toEqual('STRUCT(lat DOUBLE, lon DOUBLE)[]');
        });
    });

    describe('Object fields', () => {
        it('builds a STRUCT from its declared children', () => {
            expect(duckTypeOf(FieldType.Object, {}, {
                'field.region': { type: FieldType.Keyword },
                'field.tier': { type: FieldType.Integer },
            })).toEqual('STRUCT(region VARCHAR, tier BIGINT)');
        });

        // NOTE this recursion is specific to toDuckDB. getGroupedFields splits on the first
        // dot only (getTypes: "@todo support multiple levels deep nesting"), so toESMapping
        // and toGraphQL do not nest this deeply.
        it('nests a STRUCT inside a STRUCT for a grandchild', () => {
            expect(duckTypeOf(FieldType.Object, {}, {
                'field.inner': { type: FieldType.Object },
                'field.inner.leaf': { type: FieldType.Keyword },
            })).toEqual('STRUCT(inner STRUCT(leaf VARCHAR))');
        });

        it('stays JSON with no children, because the shape is unknowable', () => {
            expect(duckTypeOf(FieldType.Object)).toEqual('JSON');
        });

        it('quotes a child name that is not a bare identifier', () => {
            expect(duckTypeOf(FieldType.Object, {}, {
                'field.with-dash': { type: FieldType.Keyword },
            })).toEqual('STRUCT("with-dash" VARCHAR)');
        });
    });

    describe('Tuple fields', () => {
        it('builds a STRUCT with quoted positional keys', () => {
            expect(duckTypeOf(FieldType.Tuple, {}, {
                'field.0': { type: FieldType.Keyword },
                'field.1': { type: FieldType.Integer },
            })).toEqual('STRUCT("0" VARCHAR, "1" BIGINT)');
        });
    });

    describe('DataType.toDuckDB', () => {
        it('returns the real column set, folding children into their parent', () => {
            const config: DataTypeConfig = {
                version: 1,
                fields: {
                    name: { type: FieldType.Keyword },
                    count: { type: FieldType.Integer },
                    meta: { type: FieldType.Object },
                    'meta.tier': { type: FieldType.Short },
                },
            };

            // `meta.tier` is NOT a column of its own - unlike toXlucene, which flattens
            expect(new DataType(config).toDuckDB()).toEqual({
                name: 'VARCHAR',
                count: 'BIGINT',
                meta: 'STRUCT(tier SMALLINT)',
            });
        });

        it('sits alongside the other conversions on the same DataType', () => {
            const dataType = new DataType({
                version: 1,
                fields: { id: { type: FieldType.Keyword } },
            });

            expect(dataType.toDuckDB()).toEqual({ id: 'VARCHAR' });
            // the other conversions still work on the same instance
            expect(Object.keys(dataType.toXlucene())).toEqual(['id']);
            expect(dataType.toESMapping({ distribution: 'elasticsearch' } as any).mappings)
                .toBeDefined();
        });
    });
});
