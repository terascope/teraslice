import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../../src';

const isPostalCodeConfig = functionConfigRepository.isPostalCode;

describe('isHashConfig', () => {
    it('has proper configuration', () => {
        expect(isPostalCodeConfig).toBeDefined();
        expect(isPostalCodeConfig).toHaveProperty('name', 'isPostalCode');
        expect(isPostalCodeConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isPostalCodeConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isPostalCodeConfig).toHaveProperty('description');
        expect(isPostalCodeConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(isPostalCodeConfig).toHaveProperty('create');
        expect(isPostalCodeConfig.create).toBeFunction();
        expect(isPostalCodeConfig.validate_arguments).toBeFunction();
        expect(isPostalCodeConfig).toHaveProperty('argument_schema');
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isPostalCodeConfig);

            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });

        it('should throw if locale is the wrong type', () => {
            expect(
                () => functionAdapter(isPostalCodeConfig, { args: { locale: 1234 } } as any)
            ).toThrowError();
        });

        it('should throw is locale is not a correct value', () => {
            expect(
                () => functionAdapter(isPostalCodeConfig, { args: { locale: 'hello' } } as any)
            ).toThrowError();
        });
    });

    describe('should validate alpha-numeric strings', () => {
        const isPostalCode = isPostalCodeConfig.create({});

        test.each([
            [85249, true],
            ['75008', true],
            [12345689, false],
            [false, false],
            ['bobsyouruncle', false],
        ])('should return true for valid alphanumeric inputs and no locale', (input, expected) => {
            expect(isPostalCode(input)).toEqual(expected);
        });
    });

    describe('should validate alpha-numeric strings with args', () => {
        test.each([
            ['85249', 'US', true],
            ['191123', 'RU', true],
            ['8524933', 'US', false],
            ['this is not a postal code', 'CN', false],
        ])('should return true for valid postal codes with locale', (input, locale, expected) => {
            const isPostalCode = isPostalCodeConfig.create({ locale });
            expect(isPostalCode(input)).toEqual(expected);
        });
    });
});
