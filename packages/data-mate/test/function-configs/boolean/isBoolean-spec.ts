import 'jest-extended';
import {
    cloneDeep, DataEntity,
    isEmpty, isNotNil, withoutNil
} from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType,
    ProcessMode, InitialFunctionArgs
} from '../../../src';
import { ColumnTests, RowsTests } from '../interfaces';

const isBooleanConfig = functionConfigRepository.isBoolean;

describe('isBooleanConfig', () => {
    it('has proper configuration', () => {
        expect(isBooleanConfig).toBeDefined();
        expect(isBooleanConfig).toHaveProperty('name', 'isBoolean');
        expect(isBooleanConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isBooleanConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isBooleanConfig).toHaveProperty('description');
        expect(isBooleanConfig).toHaveProperty('accepts', []);
        expect(isBooleanConfig).toHaveProperty('create');
        expect(isBooleanConfig.create).toBeFunction();
    });

    it('can validate values', () => {
        const values = [true, false, 'true', null, 1, 0, [true, false], { some: 'thing' }];
        const expected = [true, true, false, false, false, false, false, false];
        const config: InitialFunctionArgs<Record<string, unknown>> = {
            args: {},
            ctx: values,
            fnDef: isBooleanConfig,
            field_config: { type: FieldType.Boolean },
        } as InitialFunctionArgs<Record<string, unknown>>;
        const isBoolean = isBooleanConfig.create(config);

        values.forEach((val, ind) => {
            expect(isBoolean(val, ind)).toEqual(expected[ind]);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        const field = 'test_field';
        const time = new Date();

        it('should return a function to execute', () => {
            const api = functionAdapter(isBooleanConfig);
            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });

        const columnTests: ColumnTests[] = [
            {
                column: [true, false],
                result: [true, false]
            },
            {
                column: ['true', 'false'],
                result: [null, null]
            },
            {
                column: [null, undefined],
                result: [null, null]
            },
            {
                column: [true, 'false', 'blah', 'true'],
                result: [true, null, null, null]
            }
        ];

        const rowTests: RowsTests[] = [
            {
                rows: [
                    { [field]: true },
                    { [field]: false }
                ],
                result: [
                    { [field]: true },
                    { [field]: false }
                ]
            },
            {
                rows: [
                    { [field]: 'true', some: 'other' },
                    { [field]: 'false', some: 'other' }
                ],
                result: [
                    { [field]: null, some: 'other' },
                    { [field]: null, some: 'other' }
                ]
            },
            {
                rows: [
                    { [field]: null },
                    { [field]: undefined }
                ],
                result: [
                    { [field]: null },
                    { [field]: null }
                ]
            },
            {
                rows: [
                    { [field]: 'blah', other: 'stuff' },
                    { [field]: false }
                ],
                result: [
                    { [field]: null, other: 'stuff' },
                    { [field]: false }
                ]
            },
            {
                rows: [
                    { other: 'stuff' },
                    {}
                ],
                result: [
                    { [field]: null, other: 'stuff' },
                    { [field]: null }
                ]
            },
            {
                rows: [
                    new DataEntity({ [field]: true }, { time }),
                    new DataEntity({ hello: true }, { time })

                ],
                result: [
                    new DataEntity({ [field]: true }, { time }),
                    new DataEntity({ [field]: null, hello: true }, { time })
                ]
            },
            {
                rows: [
                    {
                        [field]: [true, null, false, 'other']
                    },
                    {
                        [field]: ['other']
                    },
                    {
                        some: 'stuff',
                        [field]: ['other']
                    }
                ],
                result: [
                    {
                        [field]: [true, null, false, null]
                    },
                    {
                        [field]: [null]
                    },
                    {
                        some: 'stuff',
                        [field]: [null]
                    },
                ]
            },
        ];

        describe.each(columnTests)('when running columns', ({ column, result }) => {
            it('should not mutate input', () => {
                const api = functionAdapter(isBooleanConfig, { preserveNulls: true });
                const clonedInput = cloneDeep(column);

                api.column(column);

                expect(column).toEqual(clonedInput);
            });

            it(`should validate ${JSON.stringify(column)} with preserveNull set to true`, () => {
                const api = functionAdapter(isBooleanConfig, { preserveNulls: true });
                expect(api.column(column)).toEqual(result);
            });

            it(`should validate ${JSON.stringify(column)} with preserveNull set to false`, () => {
                const api = functionAdapter(isBooleanConfig, { preserveNulls: false });
                expect(api.column(column)).toEqual(result.filter(isNotNil));
            });
        });

        describe('when given bad data or incorrectly configured api while executing columns', () => {
            it('should throw if input is not an array', () => {
                const api = functionAdapter(isBooleanConfig, { field });

                expect(() => api.column({} as Array<any>)).toThrowError('Invalid input, expected an array of values');
                expect(() => api.column('hello' as unknown as Array<any>)).toThrowError('Invalid input, expected an array of values');
                expect(() => api.column(null as unknown as Array<any>)).toThrowError('Invalid input, expected an array of values');
            });
        });

        describe.each(rowTests)('when running rows', ({ rows, result }) => {
            it('should not mutate record inputs', () => {
                const api = functionAdapter(isBooleanConfig, { field, preserveNulls: true });
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
                const api = functionAdapter(isBooleanConfig, { field, preserveNulls: true });
                expect(api.rows(rows)).toEqual(result);
            });

            it(`should validate ${JSON.stringify(rows)} with preserveNull set to false`, () => {
                const api = functionAdapter(isBooleanConfig, { field, preserveNulls: false });
                const results = result.map((obj) => {
                    if (obj && Array.isArray(obj[field])) {
                        // @ts-expect-error
                        const filtered = obj[field].filter(isNotNil);

                        if (filtered.length > 0) {
                            obj[field] = filtered;
                        } else {
                            obj[field] = null;
                        }
                    }
                    return withoutNil(obj);
                });

                expect(api.rows(rows)).toEqual(results);
            });

            it(`should validate ${JSON.stringify(rows)} with preserveNull set to false and preserveEmptyObjects set to false`, () => {
                const api = functionAdapter(
                    isBooleanConfig,
                    { field, preserveNulls: false, preserveEmptyObjects: false }
                );
                const results = result.reduce<Record<string, unknown>[]>(
                    (accum, curr) => {
                        const obj = withoutNil(curr);

                        if (obj) {
                            if (Array.isArray(obj[field])) {
                                // @ts-expect-error
                                const filtered = obj[field].filter(isNotNil);

                                if (filtered.length > 0) {
                                    obj[field] = filtered;
                                } else {
                                    obj[field] = null;
                                }
                            }

                            if (!isEmpty(withoutNil(obj))) {
                                accum.push(obj);
                            }
                        }

                        return accum;
                    },
                    []
                );
                expect(api.rows(rows)).toEqual(results);
            });
        });

        describe('when given bad data or incorrectly configured api while executing rows', () => {
            it('should throw if field is not supplied', () => {
                const api = functionAdapter(isBooleanConfig);
                const correctApi = functionAdapter(isBooleanConfig, { field });

                expect(() => api.rows([{ [field]: 'data' }])).toThrowError('Must provide a field option when running a row');
                expect(() => correctApi.rows([{ [field]: 'data' }])).not.toThrowError();
            });

            it('should throw if input is not an array', () => {
                const api = functionAdapter(isBooleanConfig, { field });

                expect(() => api.rows({} as Array<any>)).toThrowError('Invalid input, expected an array of objects');
                expect(() => api.rows('hello' as unknown as Array<any>)).toThrowError('Invalid input, expected an array of objects');
                expect(() => api.rows(null as unknown as Array<any>)).toThrowError('Invalid input, expected an array of objects');
            });

            it('should throw if input is mixed data', () => {
                const api = functionAdapter(isBooleanConfig, { field });
                const data = [{ [field]: true }, 'hello'] as Record<string, unknown>[];
                const data2 = [{ [field]: true }, null] as Record<string, unknown>[];

                expect(() => api.rows(data)).toThrowError('Invalid record "hello", expected an array of simple objects or data-entities');
                expect(() => api.rows(data2)).toThrowError('Invalid record null, expected an array of simple objects or data-entities');
            });
        });
    });
});
