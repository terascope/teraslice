import 'jest-extended';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../../src';

const isBase64Config = functionConfigRepository.isBase64;

describe('isBase64Config', () => {
    it('has proper configuration', () => {
        expect(isBase64Config).toBeDefined();
        expect(isBase64Config).toHaveProperty('name', 'isBase64');
        expect(isBase64Config).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isBase64Config).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isBase64Config).toHaveProperty('description');
        expect(isBase64Config).toHaveProperty('accepts', []);
        expect(isBase64Config).toHaveProperty('create');
        expect(isBase64Config.create).toBeFunction();
    });

    it('can validate values', () => {
        const isBase64 = isBase64Config.create({});

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
            const api = functionAdapter(isBase64Config);
            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });
    });
});
