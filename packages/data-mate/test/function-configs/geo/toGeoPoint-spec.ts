import 'jest-extended';
import {
    cloneDeep, DataEntity,
    isEmpty, isNotNil, withoutNil,
} from '@terascope/utils';
import {
    FieldType, Maybe, GeoPointInput
} from '@terascope/types';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType,
    ProcessMode, Column, dataFrameAdapter, FunctionContext
} from '../../../src';
import { ColumnTests, RowsTests } from '../interfaces';

const toGeoPointConfig = functionConfigRepository.toGeoPoint;

describe('toGeoPointConfig', () => {
    it('has proper configuration', () => {
        expect(toGeoPointConfig).toBeDefined();
        expect(toGeoPointConfig).toHaveProperty('name', 'toGeoPoint');
        expect(toGeoPointConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(toGeoPointConfig).toHaveProperty('process_mode', ProcessMode.FULL_VALUES);
        expect(toGeoPointConfig).toHaveProperty('description');
        expect(toGeoPointConfig).toHaveProperty('accepts', [
            FieldType.String,
            FieldType.Object,
            FieldType.GeoPoint,
            FieldType.Geo,
            FieldType.Number,
            FieldType.Float
        ]);
        expect(toGeoPointConfig).toHaveProperty('create');
        expect(toGeoPointConfig.create).toBeFunction();
    });

    it('can transform values', () => {
        const values = ['60, 40', null, { latitude: 40, longitude: 60 }, [50, 60]];
        const expected = [
            { lon: 40, lat: 60 },
            null,
            { lon: 60, lat: 40 },
            { lon: 50, lat: 60 }
        ];
        const config: FunctionContext<Record<string, unknown>> = {
            args: {},
            parent: values,
            fnDef: toGeoPointConfig,
            field_config: { type: FieldType.String, array: false },
        } as FunctionContext<Record<string, unknown>>;
        const toGeoPoint = toGeoPointConfig.create(config);

        values.forEach((val, ind) => {
            expect(toGeoPoint(val, ind)).toEqual(expected[ind]);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        const field = 'test_field';
        const time = new Date();

        it('should return a function to execute', () => {
            const api = functionAdapter(toGeoPointConfig);
            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });

        const columnTests: ColumnTests[] = [
            {
                column: ['60,40', null, undefined],
                result: [{ lon: 40, lat: 60 }, null, null]
            }
        ];

        const rowTests: RowsTests[] = [
            {
                rows: [
                    { [field]: { latitude: 40, longitude: 60 }, some: 'other' },
                    { [field]: '40, 60' },
                    { some: 'other' },
                    { [field]: null },
                    { [field]: undefined },
                    {}
                ],
                result: [
                    { [field]: { lat: 40, lon: 60 }, some: 'other' },
                    { [field]: { lat: 40, lon: 60 } },
                    { some: 'other', [field]: null },
                    { [field]: null },
                    { [field]: null },
                    { [field]: null }
                ]
            },

            {
                rows: [
                    new DataEntity({ [field]: '40, 60' }, { time }),
                    new DataEntity({ hello: 'bob' }, { time })

                ],
                result: [
                    new DataEntity({ [field]: { lat: 40, lon: 60 } }, { time }),
                    new DataEntity({ [field]: null, hello: 'bob' }, { time })
                ]
            }
        ];

        describe.each(columnTests)('when running columns', ({ column, result }) => {
            it('should not mutate input', () => {
                const api = functionAdapter(toGeoPointConfig, { preserveNulls: true });
                const clonedInput = cloneDeep(column);

                api.column(column);

                expect(column).toEqual(clonedInput);
            });

            it(`should validate ${JSON.stringify(column)} with preserveNull set to true`, () => {
                const api = functionAdapter(toGeoPointConfig, { preserveNulls: true });
                expect(api.column(column)).toEqual(result);
            });

            it(`should validate ${JSON.stringify(column)} with preserveNull set to false`, () => {
                const api = functionAdapter(toGeoPointConfig, { preserveNulls: false });
                expect(api.column(column)).toEqual(result.filter(isNotNil));
            });
        });

        describe('when given bad data or incorrectly configured api while executing columns', () => {
            it('should throw if input is not an array', () => {
                const api = functionAdapter(toGeoPointConfig, { field });

                expect(() => api.column({} as Array<any>)).toThrowError('Invalid input, expected an array of values');
                expect(() => api.column('hello' as unknown as Array<any>)).toThrowError('Invalid input, expected an array of values');
                expect(() => api.column(null as unknown as Array<any>)).toThrowError('Invalid input, expected an array of values');
            });
        });

        describe.each(rowTests)('when running rows', ({ rows, result }) => {
            it('should not mutate record inputs', () => {
                const api = functionAdapter(toGeoPointConfig, { field, preserveNulls: true });
                const isDataEntityArray = DataEntity.isDataEntityArray(rows);
                const clonedInput = isDataEntityArray
                    ? rows.map((obj) => DataEntity.fork(obj as DataEntity))
                    : cloneDeep(rows);

                api.rows(rows);

                if (isDataEntityArray) {
                    if (rows.length === 0) throw new Error('Should have not have mutated data');
                    rows.forEach((record, ind) => {
                        expect(record).toMatchObject(clonedInput[ind]);
                        // @ts-expect-error
                        expect(record.getMetadata('time')).toEqual(clonedInput[ind].getMetadata('time'));
                    });
                } else {
                    expect(rows).toEqual(clonedInput);
                }
            });

            it(`should validate ${JSON.stringify(rows)} with preserveNull set to true`, () => {
                const api = functionAdapter(toGeoPointConfig, { field, preserveNulls: true });
                expect(api.rows(rows)).toEqual(result);
            });

            it(`should validate ${JSON.stringify(rows)} with preserveNull set to false`, () => {
                const api = functionAdapter(toGeoPointConfig, { field, preserveNulls: false });
                const results = result.map((obj) => withoutNil(obj));

                expect(api.rows(rows)).toEqual(results);
            });

            it(`should validate ${JSON.stringify(rows)} with preserveNull set to false and preserveEmptyObjects set to false`, () => {
                const api = functionAdapter(
                    toGeoPointConfig,
                    { field, preserveNulls: false, preserveEmptyObjects: false }
                );
                const results = result.reduce<Record<string, unknown>[]>(
                    (accum, curr) => {
                        const obj = withoutNil(curr);
                        if (obj && !isEmpty(obj)) {
                            accum.push(obj);
                        }

                        return accum;
                    },
                    []
                );
                expect(api.rows(rows)).toEqual(results);
            });
        });
    });

    describe('when paired with dataFrameAdapter', () => {
        let stringCol: Column<string>;
        let objCol: Column<GeoPointInput>;
        let tupleCol: Column<number[]>;

        const stringValues: Maybe<string>[] = [
            '60, 40',
        ];
        const objectValues: Maybe<GeoPointInput>[] = [
            { latitude: 40, longitude: 60 },
        ];
        const tupleValues: Maybe<number[]>[] = [
            [50, 60],
        ];
        const field = 'someField';

        beforeEach(() => {
            stringCol = Column.fromJSON<string>(field, {
                type: FieldType.String
            }, stringValues);

            objCol = Column.fromJSON<GeoPointInput>(field, {
                type: FieldType.Object
            }, objectValues);

            tupleCol = Column.fromJSON<number[]>(field, {
                type: FieldType.Number,
                array: true
            }, tupleValues);
        });

        it('should be able to transform using toGeoPoint', () => {
            const api = dataFrameAdapter(toGeoPointConfig);

            const geoStringResults = api.column(stringCol);

            expect(geoStringResults.toJSON()).toEqual([
                { lon: 40, lat: 60 },
            ]);

            const geoObjectResults = api.column(objCol);

            expect(geoObjectResults.toJSON()).toEqual([
                { lon: 60, lat: 40 },
            ]);

            const geoTupleResults = api.column(tupleCol);

            expect(geoTupleResults.toJSON()).toEqual([
                { lon: 50, lat: 60 },
            ]);
        });
    });
});
