import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../../src';

const isEmptyConfig = functionConfigRepository.isEmpty;

describe('isEmpty', () => {
    it('has proper configuration', () => {
        expect(isEmptyConfig).toBeDefined();
        expect(isEmptyConfig).toHaveProperty('name', 'isEmpty');
        expect(isEmptyConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isEmptyConfig).toHaveProperty('process_mode', ProcessMode.FULL_VALUES);
        expect(isEmptyConfig).toHaveProperty('description');
        expect(isEmptyConfig).toHaveProperty('accepts');
        expect(isEmptyConfig).toHaveProperty('create');
        expect(isEmptyConfig.create).toBeFunction();
        expect(isEmptyConfig).toHaveProperty('argument_schema');
        expect(isEmptyConfig?.argument_schema?.ignoreWhitespace.type).toEqual(FieldType.Boolean);
    });

    it('can validate values', () => {
        const args = { ignoreWhitespace: false };
        const values = [
            '85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33',
            '',
            'true',
            null,
            [],
            { some: 'thing' },
            [{}]
        ];
        const expected = [false, true, false, true, true, false, false];
        const isBoolean = isEmptyConfig.create(args);

        values.forEach((val, ind) => {
            expect(isBoolean(val)).toEqual(expected[ind]);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isEmptyConfig, { args: { ignoreWhitespace: true } });
            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });

        it('should not throw if no args are passed in', () => {
            expect(() => functionAdapter(isEmptyConfig)).not.toThrowError();
        });

        it('should process the whole input', () => {
            const api = functionAdapter(isEmptyConfig, { args: { ignoreWhitespace: true } });
            const fullColumnData = ['some', { other: 'stuff' }];
            const emptyColumnData: unknown[] = [];

            const results = api.column(fullColumnData);
            const results2 = api.column(emptyColumnData);

            expect(results).toEqual([null, null]);
            expect(results2).toEqual(emptyColumnData);
        });
    });
});
