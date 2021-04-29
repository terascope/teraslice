import 'jest-extended';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../../src';

const isMimeTypeConfig = functionConfigRepository.isMimeType;

describe('isMimeTypeConfig', () => {
    it('has proper configuration', () => {
        expect(isMimeTypeConfig).toBeDefined();
        expect(isMimeTypeConfig).toHaveProperty('name', 'isMimeType');
        expect(isMimeTypeConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isMimeTypeConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isMimeTypeConfig).toHaveProperty('description');
        expect(isMimeTypeConfig).toHaveProperty('accepts', []);
        expect(isMimeTypeConfig).toHaveProperty('create');
        expect(isMimeTypeConfig.create).toBeFunction();
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isMimeTypeConfig);

            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });
    });
});

describe('isMimeType', () => {
    const isMimeType = isMimeTypeConfig.create({});

    test.each([
        ['application/javascript', true],
        ['text/html', true],
        ['application', false],
        ['', false],
        [false, false],
    ])('should validate MIME types', (input, expected) => {
        expect(isMimeType(input)).toEqual(expected);
    });
});
