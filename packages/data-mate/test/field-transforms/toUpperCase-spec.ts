import 'jest-extended';
import {
    cloneDeep, DataEntity,
    isEmpty, isNotNil, withoutNil
} from '@terascope/utils';
import { LATEST_VERSION } from '@terascope/data-types';
import { DataTypeConfig, FieldType, Maybe } from '@terascope/types';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType,
    ProcessMode, Column, dateFrameAdapter, DataFrame, VectorType
} from '../../src';
import { ColumnTests, RowsTests } from '../interfaces';

const toUpperCaseConfig = functionConfigRepository.toUpperCase;

describe('toUpperCaseConfig', () => {
    it('has proper configuration', () => {
        expect(toUpperCaseConfig).toBeDefined();
        expect(toUpperCaseConfig).toHaveProperty('name', 'toUpperCase');
        expect(toUpperCaseConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(toUpperCaseConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(toUpperCaseConfig).toHaveProperty('description');
        expect(toUpperCaseConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(toUpperCaseConfig).toHaveProperty('create');
        expect(toUpperCaseConfig.create).toBeFunction();
    });

    it('can transform values', () => {
        const values = ['hello', 'billy', 'hey'];
        const expected = ['HELLO', 'BILLY', 'HEY'];
        const toUpperCase = toUpperCaseConfig.create({});

        values.forEach((val, ind) => {
            expect(toUpperCase(val)).toEqual(expected[ind]);
        });
    });

    it('will throw if not given a string input', () => {
        const toUpperCase = toUpperCaseConfig.create({});

        expect(() => toUpperCase(3)).toThrowError('Invalid input 3, expected string got Number');
        expect(() => toUpperCase({})).toThrowError('Invalid input {}, expected string got Object');
        expect(() => toUpperCase(null)).toThrowError('Invalid input null, expected string got null');
        expect(() => toUpperCase(undefined)).toThrowError('Invalid input undefined, expected string got undefined');
    });

    describe('when paired with fieldFunctionAdapter', () => {
        const field = 'test_field';
        const time = new Date();

        it('should return a function to execute', () => {
            const api = functionAdapter(toUpperCaseConfig);
            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });

        const columnTests: ColumnTests[] = [
            {
                column: [true, 'false', 'blah', 'true', null, undefined, 1234],
                result: [null, 'FALSE', 'BLAH', 'TRUE', null, null, null]
            }
        ];

        const rowTests: RowsTests[] = [
            {
                rows: [
                    { [field]: 'hello', some: 'other' },
                    { [field]: 'dave' },
                    { some: 'other' },
                    { [field]: null },
                    { [field]: undefined },
                    {}
                ],
                result: [
                    { [field]: 'HELLO', some: 'other' },
                    { [field]: 'DAVE' },
                    { some: 'other', [field]: null },
                    { [field]: null },
                    { [field]: null },
                    { [field]: null }
                ]
            },

            {
                rows: [
                    new DataEntity({ [field]: 'billy' }, { time }),
                    new DataEntity({ hello: 'bob' }, { time })

                ],
                result: [
                    new DataEntity({ [field]: 'BILLY' }, { time }),
                    new DataEntity({ [field]: null, hello: 'bob' }, { time })
                ]
            }
        ];

        describe.each(columnTests)('when running columns', ({ column, result }) => {
            it('should not mutate input', () => {
                const api = functionAdapter(toUpperCaseConfig, { preserveNulls: true });
                const clonedInput = cloneDeep(column);

                api.column(column);

                expect(column).toEqual(clonedInput);
            });

            it(`should validate ${JSON.stringify(column)} with preserveNull set to true`, () => {
                const api = functionAdapter(toUpperCaseConfig, { preserveNulls: true });
                expect(api.column(column)).toEqual(result);
            });

            it(`should validate ${JSON.stringify(column)} with preserveNull set to false`, () => {
                const api = functionAdapter(toUpperCaseConfig, { preserveNulls: false });
                expect(api.column(column)).toEqual(result.filter(isNotNil));
            });
        });

        describe('when given bad data or incorrectly configured api while executing columns', () => {
            it('should throw if input is not an array', () => {
                const api = functionAdapter(toUpperCaseConfig, { field });

                expect(() => api.column({} as Array<any>)).toThrowError('Invalid input, expected an array of values');
                expect(() => api.column('hello' as unknown as Array<any>)).toThrowError('Invalid input, expected an array of values');
                expect(() => api.column(null as unknown as Array<any>)).toThrowError('Invalid input, expected an array of values');
            });
        });

        describe.each(rowTests)('when running rows', ({ rows, result }) => {
            it('should not mutate record inputs', () => {
                const api = functionAdapter(toUpperCaseConfig, { field, preserveNulls: true });
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
                const api = functionAdapter(toUpperCaseConfig, { field, preserveNulls: true });
                expect(api.rows(rows)).toEqual(result);
            });

            it(`should validate ${JSON.stringify(rows)} with preserveNull set to false`, () => {
                const api = functionAdapter(toUpperCaseConfig, { field, preserveNulls: false });
                const results = result.map((obj) => withoutNil(obj));
                expect(api.rows(rows)).toEqual(results);
            });

            it(`should validate ${JSON.stringify(rows)} with preserveNull set to false and preserveEmptyObjects set to false`, () => {
                const api = functionAdapter(
                    toUpperCaseConfig,
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

        describe('when given bad data or incorrectly configured api while executing rows', () => {
            it('should throw if field is not supplied', () => {
                const api = functionAdapter(toUpperCaseConfig);
                const correctApi = functionAdapter(toUpperCaseConfig, { field });

                expect(() => api.rows([{ [field]: 'data' }])).toThrowError('Must provide a field option when running a row');
                expect(() => correctApi.rows([{ [field]: 'data' }])).not.toThrowError();
            });

            it('should throw if input is not an array', () => {
                const api = functionAdapter(toUpperCaseConfig, { field });

                expect(() => api.rows({} as Array<any>)).toThrowError('Invalid input, expected an array of objects');
                expect(() => api.rows('hello' as unknown as Array<any>)).toThrowError('Invalid input, expected an array of objects');
                expect(() => api.rows(null as unknown as Array<any>)).toThrowError('Invalid input, expected an array of objects');
            });

            it('should throw if input is mixed data', () => {
                const api = functionAdapter(toUpperCaseConfig, { field });
                const data = [{ [field]: true }, 'hello'] as Record<string, unknown>[];
                const data2 = [{ [field]: true }, null] as Record<string, unknown>[];

                expect(() => api.rows(data)).toThrowError('Invalid record "hello", expected an array of simple objects or data-entities');
                expect(() => api.rows(data2)).toThrowError('Invalid record null, expected an array of simple objects or data-entities');
            });
        });
    });

    describe('when paired with dateFrameAdapter', () => {
        let col: Column<string>;

        const values: Maybe<string>[] = [
            'other_things',
            'Stuff',
            'hello',
            null,
            'SpiderMan',
        ];
        const field = 'someField';

        const frameTestConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                [field]: {
                    type: FieldType.String
                },
                num: {
                    type: FieldType.Number
                }
            }
        };

        const frameData = values.map((str, ind) => ({ [field]: str as string, num: ind }));

        beforeEach(() => {
            col = Column.fromJSON<string>(field, {
                type: FieldType.String
            }, values);
        });

        it('should be able to transform a column using toUpperCase', () => {
            const api = dateFrameAdapter(toUpperCaseConfig);
            const newCol = api.column(col);

            expect(newCol.toJSON()).toEqual([
                'OTHER_THINGS',
                'STUFF',
                'HELLO',
                undefined,
                'SPIDERMAN',
            ]);
        });

        it('should be able to transform a dataFrame using toUpperCase', () => {
            const frame = DataFrame.fromJSON(frameTestConfig, frameData);

            const api = dateFrameAdapter(toUpperCaseConfig, { field });
            const newFrame = api.frame(frame);

            expect(newFrame.toJSON()).toEqual([
                { [field]: 'OTHER_THINGS', num: 0 },
                { [field]: 'STUFF', num: 1 },
                { [field]: 'HELLO', num: 2 },
                { num: 3 },
                { [field]: 'SPIDERMAN', num: 4 },
            ]);

            const [type] = newFrame.columns
                .filter((column) => column.name === field)
                .map((column) => column.vector.type);

            expect(type).toEqual(VectorType.String);
        });
    });
});
