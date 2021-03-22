import 'jest-extended';
import { isNotNil, withoutNil } from '@terascope/utils';
import {
    isBooleanConfig, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../src';

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

        describe.each(rowTests)('when running rows', ({ rows, result }) => {
            it(`should validate ${JSON.stringify(rows)} with preserveNull set to true`, () => {
                const api = functionAdapter(isBooleanConfig, { field, preserveNulls: true });
                expect(api.rows(rows)).toEqual(result);
            });

            it(`should validate ${JSON.stringify(rows)} with preserveNull set to false`, () => {
                const api = functionAdapter(isBooleanConfig, { field, preserveNulls: false });
                expect(api.rows(rows)).toEqual(result.map((obj) => withoutNil(obj)));
            });
        });
    });
});
