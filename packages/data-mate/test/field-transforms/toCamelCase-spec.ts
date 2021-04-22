import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, FunctionDefinitionType, ProcessMode,
} from '../../src';

const toCamelCaseConfig = functionConfigRepository.toCamelCase;

describe('toCamelCaseConfig', () => {
    it('has proper configuration', () => {
        expect(toCamelCaseConfig).toBeDefined();
        expect(toCamelCaseConfig).toHaveProperty('name', 'toCamelCase');
        expect(toCamelCaseConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(toCamelCaseConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(toCamelCaseConfig).toHaveProperty('description');
        expect(toCamelCaseConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(toCamelCaseConfig).toHaveProperty('create');
        expect(toCamelCaseConfig.create).toBeFunction();
    });

    it('can transform values', () => {
        const values = ['HELLO there', 'billy', 'Hey There'];
        const expected = ['helloThere', 'billy', 'heyThere'];

        const toCamelCase = toCamelCaseConfig.create({});

        values.forEach((val, ind) => {
            expect(toCamelCase(val)).toEqual(expected[ind]);
        });
    });

    it('will throw if not given a string input', () => {
        const toCamelCase = toCamelCaseConfig.create({});

        expect(() => toCamelCase(3)).toThrowError('Expected string, got Number');
        expect(() => toCamelCase({})).toThrowError('Expected string, got Object');
        expect(() => toCamelCase(null)).toThrowError('Expected string, got null');
        expect(() => toCamelCase(undefined)).toThrowError('Expected string, got undefined');
    });
});
