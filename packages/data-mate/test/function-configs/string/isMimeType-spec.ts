import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../../src';

const isMIMETypeConfig = functionConfigRepository.isMIMEType;

describe('isMIMETypeConfig', () => {
    it('has proper configuration', () => {
        expect(isMIMETypeConfig).toBeDefined();
        expect(isMIMETypeConfig).toHaveProperty('name', 'isMIMEType');
        expect(isMIMETypeConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isMIMETypeConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isMIMETypeConfig).toHaveProperty('description');
        expect(isMIMETypeConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(isMIMETypeConfig).toHaveProperty('create');
        expect(isMIMETypeConfig.create).toBeFunction();
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isMIMETypeConfig);

            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });
    });
});

describe('isMIMEType', () => {
    const isMIMEType = isMIMETypeConfig.create({});

    test.each([
        ['application/javascript', true],
        ['text/html', true],
        ['application', false],
        ['', false],
        [false, false],
    ])('should validate MIME types', (input, expected) => {
        expect(isMIMEType(input)).toEqual(expected);
    });
});
