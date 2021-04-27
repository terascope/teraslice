import 'jest-extended';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../../src';

const isFQDNConfig = functionConfigRepository.isFQDN;

describe('isFQDNConfig', () => {
    it('has proper configuration', () => {
        expect(isFQDNConfig).toBeDefined();
        expect(isFQDNConfig).toHaveProperty('name', 'isFQDN');
        expect(isFQDNConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isFQDNConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isFQDNConfig).toHaveProperty('description');
        expect(isFQDNConfig).toHaveProperty('accepts', []);
        expect(isFQDNConfig).toHaveProperty('create');
        expect(isFQDNConfig.create).toBeFunction();
    });

    it('can validate values', () => {
        const isFQDN = isFQDNConfig.create({});

        [
            ['example.com', true],
            ['international-example.com.br', true],
            ['some.other.domain.uk', true],
            ['1234.com', true],
            ['no_underscores.com', false],
            ['undefined', false],
            [true, false],
            [12345, false],
            [undefined, false],
            ['**.bad.domain.com', false],
            ['example.0', false],
            [{}, false]
        ].forEach(([input, expected]) => {
            expect(isFQDN(input)).toEqual(expected);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isFQDNConfig);
            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });
    });
});
