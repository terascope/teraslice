import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../../src';

const equalsConfig = functionConfigRepository.equals;

describe('equalsConfig', () => {
    it('has proper configuration', () => {
        expect(equalsConfig).toBeDefined();
        expect(equalsConfig).toHaveProperty('name', 'equals');
        expect(equalsConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(equalsConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(equalsConfig).toHaveProperty('description');
        expect(equalsConfig).toHaveProperty('accepts');
        expect(equalsConfig).toHaveProperty('create');
        expect(equalsConfig.create).toBeFunction();
        expect(equalsConfig).toHaveProperty('argument_schema');
        expect(equalsConfig?.argument_schema?.value.type).toEqual(FieldType.Any);
    });

    it('can validate values', () => {
        const values = [
            ['thisisastring', 'thisisastring', true],
            [['an', 'array', 'of', 'values'], ['an', 'array', 'of', 'values'], true],
            [{ foo: 'bar' }, { foo: 'bar' }, true],
            [{ foo: 'bar', deep: { value: 'kitty' } }, { foo: 'bar', deep: { value: 'kitty' } }, true],
            [true, true, true],
            [undefined, undefined, true],
            [12345, 12345, true],
            ['thisisastring', 'somethingelse', false],
            [1234, 12345, false],
            [false, true, false],
            [null, undefined, false],
            [{ foo: 'bar' }, { foo: 'bin' }, false],
            [{ deep: { value: 'kitty' } }, { deep: { value: 'lion' } }, false],
            [[1, 2, 3, 4], [1, 2, 3, 5], false]
        ];

        values.forEach(([input, value, result]) => {
            const equals = equalsConfig.create({ value: value as any });

            expect(equals(input)).toEqual(result);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(equalsConfig, { args: { value: 'foo' } });

            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });
    });
});
