import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, FunctionDefinitionType, ProcessMode,
} from '../../src';

const toTitleCaseConfig = functionConfigRepository.toTitleCase;

describe('toTitleCaseConfig', () => {
    it('has proper configuration', () => {
        expect(toTitleCaseConfig).toBeDefined();
        expect(toTitleCaseConfig).toHaveProperty('name', 'toTitleCase');
        expect(toTitleCaseConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(toTitleCaseConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(toTitleCaseConfig).toHaveProperty('description');
        expect(toTitleCaseConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(toTitleCaseConfig).toHaveProperty('create');
        expect(toTitleCaseConfig.create).toBeFunction();
    });

    it('can transform values', () => {
        const values = ['HELLO there', 'billy', 'Hey There'];
        const expected = ['Hello There', 'Billy', 'Hey There'];

        const toTitleCase = toTitleCaseConfig.create();

        values.forEach((val, ind) => {
            expect(toTitleCase(val)).toEqual(expected[ind]);
        });
    });

    it('will throw if not given a string input', () => {
        const toTitleCase = toTitleCaseConfig.create();

        expect(() => toTitleCase(3)).toThrowError('Expected string, got Number');
        expect(() => toTitleCase({})).toThrowError('Expected string, got Object');
        expect(() => toTitleCase(null)).toThrowError('Expected string, got null');
        expect(() => toTitleCase(undefined)).toThrowError('Expected string, got undefined');
    });
});
