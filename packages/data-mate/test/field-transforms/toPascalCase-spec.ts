import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, FunctionDefinitionType, ProcessMode,
} from '../../src';

const toPascalCaseConfig = functionConfigRepository.toPascalCase;

describe('toPascalCaseConfig', () => {
    it('has proper configuration', () => {
        expect(toPascalCaseConfig).toBeDefined();
        expect(toPascalCaseConfig).toHaveProperty('name', 'toPascalCase');
        expect(toPascalCaseConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(toPascalCaseConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(toPascalCaseConfig).toHaveProperty('description');
        expect(toPascalCaseConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(toPascalCaseConfig).toHaveProperty('create');
        expect(toPascalCaseConfig.create).toBeFunction();
    });

    it('can transform values', () => {
        const values = ['HELLO there', 'billy', 'Hey There'];
        const expected = ['HelloThere', 'Billy', 'HeyThere'];

        const toPascalCase = toPascalCaseConfig.create({});

        values.forEach((val, ind) => {
            expect(toPascalCase(val)).toEqual(expected[ind]);
        });
    });

    it('will throw if not given a string input', () => {
        const toPascalCase = toPascalCaseConfig.create({});

        expect(() => toPascalCase(3)).toThrowError('Expected string, got Number');
        expect(() => toPascalCase({})).toThrowError('Expected string, got Object');
        expect(() => toPascalCase(null)).toThrowError('Expected string, got null');
        expect(() => toPascalCase(undefined)).toThrowError('Expected string, got undefined');
    });
});
