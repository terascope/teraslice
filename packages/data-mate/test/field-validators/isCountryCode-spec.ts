import 'jest-extended';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../src';

const isCountryCodeConfig = functionConfigRepository.isCountryCode;

describe('isCountryCode', () => {
    it('has proper configuration', () => {
        expect(isCountryCodeConfig).toBeDefined();
        expect(isCountryCodeConfig).toHaveProperty('name', 'isCountryCode');
        expect(isCountryCodeConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isCountryCodeConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isCountryCodeConfig).toHaveProperty('description');
        expect(isCountryCodeConfig).toHaveProperty('accepts', []);
        expect(isCountryCodeConfig).toHaveProperty('create');
        expect(isCountryCodeConfig.create).toBeFunction();
    });

    it('can validate values', () => {
        const isCountryCode = isCountryCodeConfig.create({});

        [
            ['US', true],
            ['ZM', true],
            ['IQ', true],
            ['GB', true],
            ['UK', false],
            ['undefined', false],
            [true, false],
            [12345, false],
            [undefined, false],
            [{}, false]
        ].forEach(([input, expected]) => {
            expect(isCountryCode(input)).toEqual(expected);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isCountryCodeConfig);
            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });
    });
});
