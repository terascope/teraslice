import 'jest-extended';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../../src';

const isISDNConfig = functionConfigRepository.isISDN;

describe('isURLConfig', () => {
    it('has proper configuration', () => {
        expect(isISDNConfig).toBeDefined();
        expect(isISDNConfig).toHaveProperty('name', 'isISDN');
        expect(isISDNConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isISDNConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isISDNConfig).toHaveProperty('description');
        expect(isISDNConfig).toHaveProperty('accepts', []);
        expect(isISDNConfig).toHaveProperty('create');
        expect(isISDNConfig.create).toBeFunction();
    });

    it('can validate values', () => {
        const isISDN = isISDNConfig.create({});

        [
            ['46707123456', true],
            ['1 808 915 6800', true],
            ['1-808-915-6800', true],
            ['+18089156800', true],
            ['79525554602', true],
            [79525554602, true],
            ['4900000000000', false],
            ['22345', false]
        ].forEach(([input, expected]) => {
            expect(isISDN(input)).toEqual(expected);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isISDNConfig);
            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });
    });
});
