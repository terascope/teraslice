import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, FunctionDefinitionType, ProcessMode,
} from '../../src';

const toLowerCaseConfig = functionConfigRepository.toLowerCase;

describe('toLowerCaseConfig', () => {
    it('has proper configuration', () => {
        expect(toLowerCaseConfig).toBeDefined();
        expect(toLowerCaseConfig).toHaveProperty('name', 'toLowerCase');
        expect(toLowerCaseConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(toLowerCaseConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(toLowerCaseConfig).toHaveProperty('description');
        expect(toLowerCaseConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(toLowerCaseConfig).toHaveProperty('create');
        expect(toLowerCaseConfig.create).toBeFunction();
    });

    it('can transform values', () => {
        const values = ['HELLO', 'biLLy', 'Hey There'];
        const expected = ['hello', 'billy', 'hey there'];

        const toUpperCase = toLowerCaseConfig.create();

        values.forEach((val, ind) => {
            expect(toUpperCase(val)).toEqual(expected[ind]);
        });
    });

    it('will throw if not given a string input', () => {
        const toLowerCase = toLowerCaseConfig.create();

        expect(() => toLowerCase(3)).toThrowError('Invalid input 3, expected string got Number');
        expect(() => toLowerCase({})).toThrowError('Invalid input {}, expected string got Object');
        expect(() => toLowerCase(null)).toThrowError('Invalid input null, expected string got null');
        expect(() => toLowerCase(undefined)).toThrowError('Invalid input undefined, expected string got undefined');
    });
});
