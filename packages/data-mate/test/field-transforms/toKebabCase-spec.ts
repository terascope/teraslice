import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, FunctionDefinitionType, ProcessMode,
} from '../../src';

const toKebabCaseConfig = functionConfigRepository.toKebabCase;

describe('toKebabCaseConfig', () => {
    it('has proper configuration', () => {
        expect(toKebabCaseConfig).toBeDefined();
        expect(toKebabCaseConfig).toHaveProperty('name', 'toKebabCase');
        expect(toKebabCaseConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(toKebabCaseConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(toKebabCaseConfig).toHaveProperty('description');
        expect(toKebabCaseConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(toKebabCaseConfig).toHaveProperty('create');
        expect(toKebabCaseConfig.create).toBeFunction();
    });

    it('can transform values', () => {
        const values = ['HELLO there', 'billy', 'Hey There'];
        const expected = ['hello-there', 'billy', 'hey-there'];

        const toKebabCase = toKebabCaseConfig.create({});

        values.forEach((val, ind) => {
            expect(toKebabCase(val)).toEqual(expected[ind]);
        });
    });

    it('will throw if not given a string input', () => {
        const toKebabCase = toKebabCaseConfig.create({});

        expect(() => toKebabCase(3)).toThrowError('Expected string, got Number');
        expect(() => toKebabCase({})).toThrowError('Expected string, got Object');
        expect(() => toKebabCase(null)).toThrowError('Expected string, got null');
        expect(() => toKebabCase(undefined)).toThrowError('Expected string, got undefined');
    });
});
