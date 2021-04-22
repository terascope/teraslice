import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, FunctionDefinitionType, ProcessMode,
} from '../../src';

const toSnakeCaseCaseConfig = functionConfigRepository.toSnakeCase;

describe('toSnakeCaseConfig', () => {
    it('has proper configuration', () => {
        expect(toSnakeCaseCaseConfig).toBeDefined();
        expect(toSnakeCaseCaseConfig).toHaveProperty('name', 'toSnakeCase');
        expect(toSnakeCaseCaseConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(toSnakeCaseCaseConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(toSnakeCaseCaseConfig).toHaveProperty('description');
        expect(toSnakeCaseCaseConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(toSnakeCaseCaseConfig).toHaveProperty('create');
        expect(toSnakeCaseCaseConfig.create).toBeFunction();
    });

    it('can transform values', () => {
        const values = ['HELLO there', 'billy', 'Hey There'];
        const expected = ['hello_there', 'billy', 'hey_there'];

        const toSnakeCase = toSnakeCaseCaseConfig.create({});

        values.forEach((val, ind) => {
            expect(toSnakeCase(val)).toEqual(expected[ind]);
        });
    });

    it('will throw if not given a string input', () => {
        const toSnakeCase = toSnakeCaseCaseConfig.create({});

        expect(() => toSnakeCase(3)).toThrowError('Expected string, got Number');
        expect(() => toSnakeCase({})).toThrowError('Expected string, got Object');
        expect(() => toSnakeCase(null)).toThrowError('Expected string, got null');
        expect(() => toSnakeCase(undefined)).toThrowError('Expected string, got undefined');
    });
});
