import 'jest-extended';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../src';

const isFQDNConfig = functionConfigRepository.isFQDN;

describe('isFQDNConfig', () => {
    it('has proper configuration', () => {
        expect(isFQDNConfig).toBeDefined();
        expect(isFQDNConfig).toHaveProperty('name', 'isBase64');
        expect(isFQDNConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isFQDNConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isFQDNConfig).toHaveProperty('description');
        expect(isFQDNConfig).toHaveProperty('accepts', []);
        expect(isFQDNConfig).toHaveProperty('create');
        expect(isFQDNConfig.create).toBeFunction();
    });

    it('can validate values', () => {
        const isBase64 = isFQDNConfig.create({});

        [
            ['ZnJpZW5kbHlOYW1lNw==', true],
            ['bW9kZWxVUkwx', true],
            ['manufacturerUrl7', false],
            ['undefined', false],
            [true, false],
            [12345, false],
            [undefined, false],
            ['randomstring', false],
            [{}, false]
        ].forEach(([input, expected]) => {
            expect(isBase64(input)).toEqual(expected);
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
