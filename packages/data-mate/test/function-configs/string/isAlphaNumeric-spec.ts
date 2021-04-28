import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../../src';

const isAlphaNumericConfig = functionConfigRepository.isAlphaNumeric;

describe('isHashConfig', () => {
    it('has proper configuration', () => {
        expect(isAlphaNumericConfig).toBeDefined();
        expect(isAlphaNumericConfig).toHaveProperty('name', 'isAlphaNumeric');
        expect(isAlphaNumericConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isAlphaNumericConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isAlphaNumericConfig).toHaveProperty('description');
        expect(isAlphaNumericConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(isAlphaNumericConfig).toHaveProperty('create');
        expect(isAlphaNumericConfig.create).toBeFunction();
        expect(isAlphaNumericConfig.validate_arguments).toBeFunction();
        expect(isAlphaNumericConfig).toHaveProperty('argument_schema');
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isAlphaNumericConfig);

            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });

        it('should throw if locale is the wrong type', () => {
            expect(
                () => functionAdapter(isAlphaNumericConfig, { args: { locale: 1234 } } as any)
            ).toThrowError();
        });

        it('should throw is locale is not a correct value', () => {
            expect(
                () => functionAdapter(isAlphaNumericConfig, { args: { locale: 'hello' } } as any)
            ).toThrowError();
        });
    });

    describe('should validate alpha-numeric strings', () => {
        const isAlphaNumeric = isAlphaNumericConfig.create({});
    
        test.each([
            ['example123456', true],
            ['no_underscores.com', false],
            [true, false]
        ])('should return true for valid alphanumeric inputs and no locale', (input, expected) => {
           expect(isAlphaNumeric(input)).toEqual(expected);
        });
    });

    describe('should validate alpha-numeric strings with args', () => {
        const isAlphaNumeric = isAlphaNumericConfig.create({ locale: 'pl-Pl' });
    
        test.each([
            ['ThisiZĄĆĘŚŁ1234', true]
        ])('should return true for valid alphanumeric inputs with a locale', (input, expected) => {
           expect(isAlphaNumeric(input)).toEqual(expected);
        });
    });
});
