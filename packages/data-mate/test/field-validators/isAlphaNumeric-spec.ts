import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../src';

const isAlphaNumeric = functionConfigRepository.isAlphaNumeric;

describe('isHashConfig', () => {
    it('has proper configuration', () => {
        expect(isAlphaNumeric).toBeDefined();
        expect(isAlphaNumeric).toHaveProperty('name', 'isAlphaNumeric');
        expect(isAlphaNumeric).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isAlphaNumeric).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isAlphaNumeric).toHaveProperty('description');
        expect(isAlphaNumeric).toHaveProperty('accepts', [FieldType.String]);
        expect(isAlphaNumeric).toHaveProperty('create');
        expect(isAlphaNumeric.create).toBeFunction();
        expect(isAlphaNumeric.validate_arguments).toBeFunction();
        expect(isAlphaNumeric).toHaveProperty('argument_schema');
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isAlphaNumeric);

            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });

        it('should throw if args are wrong type', () => {
            expect(
                () => functionAdapter(isAlphaNumeric, { args: { delimiter: 1234 } } as any)
            ).toThrowError('Invalid mac address delimiter, must be a list of or one of space, colon, dash, dot, none and any');
        });

        it('should be able to call the fnDef validate_arguments', () => {
            expect(
                () => functionAdapter(isAlphaNumeric, { args: { delimiter: 'hello' } } as any)
            ).toThrowError('Invalid mac address delimiter, must be a list of or one of space, colon, dash, dot, none and any');
        });
    });
});
