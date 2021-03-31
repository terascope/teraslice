import 'jest-extended';
import { FieldType } from '@terascope/types';
import { cloneDeep, DataEntity } from '@terascope/utils';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType
} from '../../src';
import { RowsTests } from '../interfaces';

const requiredConfig = functionConfigRepository.required;

describe('requiredConfig', () => {
    it('has proper configuration', () => {
        expect(requiredConfig).toBeDefined();
        expect(requiredConfig).toHaveProperty('name', 'required');
        expect(requiredConfig).toHaveProperty('type', FunctionDefinitionType.RECORD_VALIDATION);
        expect(requiredConfig).toHaveProperty('description');
        expect(requiredConfig).toHaveProperty('accepts', [FieldType.Object]);
        expect(requiredConfig).toHaveProperty('create');
        expect(requiredConfig.create).toBeFunction();
        expect(requiredConfig).toHaveProperty('required_arguments', ['fields']);
        expect(requiredConfig).toHaveProperty('argument_schema');
        expect(requiredConfig?.argument_schema?.fields.type).toEqual(FieldType.String);
        expect(requiredConfig?.argument_schema?.fields.array).toBeTruthy();
    });

    it('can validate that records have fields', () => {
        const args = { fields: ['foo', 'bar'] };
        const values = [
            { foo: 'hello', bar: 'other' },
            { foo: { other: 'stuff' }, bar: 'stuff' },
            { foo: null, bar: 1234 },
            { other: 'stuff' },
            { bar: 1234 },

        ];
        const expected = [true, true, false, false, false];
        const required = requiredConfig.create(args);

        values.forEach((val, ind) => {
            expect(required(val)).toEqual(expected[ind]);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        const field = 'test_field';
        const time = new Date();

        it('should return a function to execute', () => {
            const api = functionAdapter(requiredConfig, { args: { fields: ['foo'] } });
            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api.rows).toBeFunction();
        });

        it('should throw if fields is empty', () => {
            expect(() => functionAdapter(requiredConfig, { args: { fields: [] } })).toThrowError('Invalid arguments, requires fields to be set to a non-empty value');
        });

        it('should throw if fields are mixed values', () => {
            expect(
                () => functionAdapter(requiredConfig as any, { args: { fields: ['foo', 1234] } })
            ).toThrowError('Invalid argument value set at key fields, expected foo,1234 to be compatible with type String[]');
        });

        const rowTests: RowsTests[] = [
            {
                rows: [
                    { [field]: 1234 },
                    { [field]: 'hello' },
                    { some: 'other' },
                    { [field]: null },
                    { [field]: undefined },
                    {}

                ],
                result: [
                    { [field]: 1234 },
                    { [field]: 'hello' },
                    null,
                    null,
                    null,
                    null
                ]
            },
            {
                rows: [
                    new DataEntity({ [field]: true }, { time }),

                ],
                result: [
                    new DataEntity({ [field]: true }, { time }),
                ]
            }
        ];

        describe.each(rowTests)('when running rows', ({ rows, result }) => {
            it('should not mutate record inputs', () => {
                const api = functionAdapter(
                    requiredConfig,
                    {
                        args: { fields: [field] },
                        preserveNulls: true
                    }
                );
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
                const api = functionAdapter(requiredConfig,
                    {
                        args: { fields: [field] },
                        preserveNulls: true
                    });
                expect(api.rows(rows)).toEqual(result);
            });

            it(`should validate ${JSON.stringify(rows)} with preserveNull set to false`, () => {
                const api = functionAdapter(requiredConfig, {
                    args: { fields: [field] },
                    preserveNulls: false
                });
                const results = result.filter(Boolean);
                expect(api.rows(rows)).toEqual(results);
            });
        });
    });
});
