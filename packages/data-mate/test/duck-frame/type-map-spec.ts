import 'jest-extended';
import { FieldType, DataTypeConfig, DataTypeFields } from '@terascope/types';
import { getDuckDBType, buildColumnTypes } from '../../src/duck-frame/type-map.js';

describe('duck-frame type-map', () => {
    describe('getDuckDBType', () => {
        // The numeric ladder must map to the width data-mate actually enforces,
        // NOT the width the type name suggests. data-mate bounds Integer by
        // Number.MAX_SAFE_INTEGER, not int32, so it is BIGINT.
        const scalarCases: [FieldType, string][] = [
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
            [FieldType.Text, 'VARCHAR'],
            [FieldType.String, 'VARCHAR'],
            [FieldType.Domain, 'VARCHAR'],
            [FieldType.Hostname, 'VARCHAR'],
            [FieldType.KeywordCaseInsensitive, 'VARCHAR'],
            [FieldType.KeywordTokens, 'VARCHAR'],
            [FieldType.KeywordTokensCaseInsensitive, 'VARCHAR'],
            [FieldType.KeywordPathAnalyzer, 'VARCHAR'],
            [FieldType.NgramTokens, 'VARCHAR'],
            [FieldType.Date, 'TIMESTAMP'],
            [FieldType.Binary, 'VARCHAR'],
            [FieldType.GeoPoint, 'STRUCT(lat DOUBLE, lon DOUBLE)'],
            [FieldType.Geo, 'STRUCT(lat DOUBLE, lon DOUBLE)'],
            [FieldType.Boundary, 'STRUCT(lat DOUBLE, lon DOUBLE)[]'],
            [FieldType.GeoJSON, 'JSON'],
            [FieldType.Any, 'JSON'],
        ];

        describe.each(scalarCases)('when given field type %s', (type, expected) => {
            it(`should map to ${expected}`, () => {
                expect(getDuckDBType({ type })).toEqual(expected);
            });
        });

        // IP and IPRange stay VARCHAR deliberately: INET needs a runtime-installed
        // extension, and data-mate is stricter than DuckDB anyway (it rejects
        // 01.02.03.04 where DuckDB reads it as 1.2.3.4).
        it('should map IP to VARCHAR, not INET', () => {
            expect(getDuckDBType({ type: FieldType.IP })).toEqual('VARCHAR');
        });

        it('should map IPRange to VARCHAR', () => {
            expect(getDuckDBType({ type: FieldType.IPRange })).toEqual('VARCHAR');
        });

        it('should wrap an array field in list syntax', () => {
            expect(getDuckDBType({ type: FieldType.Keyword, array: true })).toEqual('VARCHAR[]');
        });

        it('should wrap an array of a struct type', () => {
            expect(getDuckDBType({ type: FieldType.GeoPoint, array: true }))
                .toEqual('STRUCT(lat DOUBLE, lon DOUBLE)[]');
        });

        it('should build a STRUCT for an Object field from its child config', () => {
            const childConfig: DataTypeFields = {
                region: { type: FieldType.Keyword },
                tier: { type: FieldType.Integer },
            };
            expect(getDuckDBType({ type: FieldType.Object }, childConfig))
                .toEqual('STRUCT(region VARCHAR, tier BIGINT)');
        });

        it('should fall back to JSON for an Object with no child config', () => {
            expect(getDuckDBType({ type: FieldType.Object })).toEqual('JSON');
        });

        it('should build a STRUCT with quoted positional keys for a Tuple', () => {
            const childConfig: DataTypeFields = {
                0: { type: FieldType.Keyword },
                1: { type: FieldType.Integer },
            };
            expect(getDuckDBType({ type: FieldType.Tuple }, childConfig))
                .toEqual('STRUCT("0" VARCHAR, "1" BIGINT)');
        });

        it('should quote a child field name that needs it', () => {
            const childConfig: DataTypeFields = {
                'odd name': { type: FieldType.Keyword },
            };
            expect(getDuckDBType({ type: FieldType.Object }, childConfig))
                .toEqual('STRUCT("odd name" VARCHAR)');
        });

        it('should nest a struct inside a struct', () => {
            const childConfig: DataTypeFields = {
                inner: { type: FieldType.Object },
                'inner.leaf': { type: FieldType.Byte },
            };
            expect(getDuckDBType({ type: FieldType.Object }, childConfig))
                .toEqual('STRUCT(inner STRUCT(leaf TINYINT))');
        });

        it('should throw on an unknown field type rather than guess', () => {
            expect(() => getDuckDBType({ type: 'NopeNotAType' as FieldType }))
                .toThrow(/unsupported field type/i);
        });
    });

    describe('buildColumnTypes', () => {
        it('should fold dot-notation children into their parent struct', () => {
            const config: DataTypeConfig = {
                version: 1,
                fields: {
                    _key: { type: FieldType.Keyword },
                    level: { type: FieldType.Byte },
                    meta: { type: FieldType.Object },
                    'meta.region': { type: FieldType.Keyword },
                    'meta.tier': { type: FieldType.Integer },
                },
            };
            expect(buildColumnTypes(config)).toEqual({
                _key: 'VARCHAR',
                level: 'TINYINT',
                meta: 'STRUCT(region VARCHAR, tier BIGINT)',
            });
        });

        it('should not emit a top-level column for a nested child', () => {
            const config: DataTypeConfig = {
                version: 1,
                fields: {
                    meta: { type: FieldType.Object },
                    'meta.region': { type: FieldType.Keyword },
                },
            };
            expect(Object.keys(buildColumnTypes(config))).toEqual(['meta']);
        });

        it('should handle a config with no nested fields', () => {
            const config: DataTypeConfig = {
                version: 1,
                fields: {
                    a: { type: FieldType.Keyword },
                    b: { type: FieldType.Double },
                },
            };
            expect(buildColumnTypes(config)).toEqual({ a: 'VARCHAR', b: 'DOUBLE' });
        });

        it('should preserve array-ness on a nested child', () => {
            const config: DataTypeConfig = {
                version: 1,
                fields: {
                    meta: { type: FieldType.Object },
                    'meta.tags': { type: FieldType.Keyword, array: true },
                },
            };
            expect(buildColumnTypes(config)).toEqual({ meta: 'STRUCT(tags VARCHAR[])' });
        });

        it('should throw when a config has no fields', () => {
            expect(() => buildColumnTypes({ version: 1, fields: {} }))
                .toThrow(/at least one field/i);
        });
    });
});
