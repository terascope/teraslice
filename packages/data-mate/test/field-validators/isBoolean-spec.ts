import 'jest-extended';
import {
    isEmpty, isNotNil, withoutNil
} from '@terascope/utils';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../src';

const isBooleanConfig = functionConfigRepository.isBoolean;
interface ColumnTests {
    column: any[],
    result: any[]
}

interface RowsTests {
    rows: Record<string, unknown>[]
    result: Record<string, unknown>[]
}

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
        const isBoolean = isBooleanConfig.create();

        values.forEach((val, ind) => {
            expect(isBoolean(val)).toEqual(expected[ind]);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        const field = 'test_field';

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
            }
        ];

        describe.each(columnTests)('when running columns', ({ column, result }) => {
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
            it(`should validate ${JSON.stringify(rows)} with preserveNull set to true`, () => {
                const api = functionAdapter(isBooleanConfig, { field, preserveNulls: true });
                expect(api.rows(rows)).toEqual(result);
            });

            it(`should validate ${JSON.stringify(rows)} with preserveNull set to false`, () => {
                const api = functionAdapter(isBooleanConfig, { field, preserveNulls: false });
                const results = result.map((obj) => withoutNil(obj));
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
                        if (!isEmpty(obj)) {
                            accum.push(obj);
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

    // TODO: put data-mate function adapter tests here
});
