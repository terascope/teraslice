import 'jest-extended';
import { get } from '@terascope/utils';

import {
    isBooleanConfig, fieldFunctionAdapter, FunctionDefinitionType, ProcessMode
} from '../../src';

describe('isBooleanConfig', () => {
    it('has proper configuration', () => {
        expect(isBooleanConfig).toBeDefined();
        expect(isBooleanConfig).toHaveProperty('name', 'isBoolean');
        expect(isBooleanConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isBooleanConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isBooleanConfig).toHaveProperty('description');
        expect(isBooleanConfig).toHaveProperty('accepts', []);
        expect(isBooleanConfig).toHaveProperty('create');
        expect(isBooleanConfig.create).toBeFunction();
    });

    describe('when paired with fieldFunctionAdapter', () => {
        const field = 'test_field';

        it('should return a function to execute', () => {
            const fn = fieldFunctionAdapter(isBooleanConfig, field);
            expect(fn).toBeFunction();
        });

        it('can check individual values', () => {
            
        });

        it('can check values', () => {
            const fn = fieldFunctionAdapter(isBooleanConfig, field);
            const data = [
                { [field]: true },
                { [field]: false },
                { [field]: undefined },
                { [field]: 'true' }
            ];

            const results = fn(data);
            expect(results).toEqual([true, true, false, false]);
        });
    });
});
