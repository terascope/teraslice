import 'jest-extended';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../../src';

const isPortConfig = functionConfigRepository.isPort;

describe('isURLConfig', () => {
    it('has proper configuration', () => {
        expect(isPortConfig).toBeDefined();
        expect(isPortConfig).toHaveProperty('name', 'isPort');
        expect(isPortConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isPortConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isPortConfig).toHaveProperty('description');
        expect(isPortConfig).toHaveProperty('accepts', []);
        expect(isPortConfig).toHaveProperty('create');
        expect(isPortConfig.create).toBeFunction();
    });

    it('can validate values', () => {
        const isPort = isPortConfig.create({});

        [
            ['49151', true],
            [8080, true],
            ['65536', false],
            ['-110', false],
            ['not a port', false],
            [false, false],
            [null, false],
        ].forEach(([input, expected]) => {
            expect(isPort(input)).toEqual(expected);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isPortConfig);
            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });
    });
});
