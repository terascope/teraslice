import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../src';

const containsConfig = functionConfigRepository.contains;

describe('isHashConfig', () => {
    it('has proper configuration', () => {
        expect(containsConfig).toBeDefined();
        expect(containsConfig).toHaveProperty('name', 'includes');
        expect(containsConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(containsConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(containsConfig).toHaveProperty('description');
        expect(containsConfig).toHaveProperty('accepts');
        expect(containsConfig).toHaveProperty('create');
        expect(containsConfig.create).toBeFunction();
        expect(containsConfig).toHaveProperty('argument_schema');
        expect(containsConfig?.argument_schema?.substr.type).toEqual(FieldType.String);
    });

    it('can validate values', () => {
        const values = [
            ['thisisastring', 'string', true],
            ['thisisastring', 'foo', false],
            [['one', 'two', 'three'], 'one', false],
            [true, 'true', false]
        ];

        values.forEach(([input, substr, result]) => {
            const contains = containsConfig.create({ substr: substr as string });

            expect(contains(input)).toEqual(result);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(containsConfig, { args: { substr: 'foo' } });

            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });
    });
});
