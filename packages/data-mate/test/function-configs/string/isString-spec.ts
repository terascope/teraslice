import 'jest-extended';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../../src';

const isStringConfig = functionConfigRepository.isString;

describe('isStringConfig', () => {
    it('has proper configuration', () => {
        expect(isStringConfig).toBeDefined();
        expect(isStringConfig).toHaveProperty('name', 'isString');
        expect(isStringConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isStringConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isStringConfig).toHaveProperty('description');
        expect(isStringConfig).toHaveProperty('accepts', []);
        expect(isStringConfig).toHaveProperty('create');
        expect(isStringConfig.create).toBeFunction();
    });

    it('can validate values', () => {
        const isString = isStringConfig.create({});

        [
            ['this is a string', true],
            ['12345', true],
            [['hello world'], false],
            [{ hello: 'there' }, false],
            [12345, false],
            [undefined, false],
            [null, false]
        ].forEach(([input, expected]) => {
            expect(isString(input)).toEqual(expected);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isStringConfig);
            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });
    });
});
