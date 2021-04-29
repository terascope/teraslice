import 'jest-extended';
import { FieldType } from '@terascope/types';

import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../../src';

const isUUIDConfig = functionConfigRepository.isUUID;

describe('isUUIDConfig', () => {
    it('has proper configuration', () => {
        expect(isUUIDConfig).toBeDefined();
        expect(isUUIDConfig).toHaveProperty('name', 'isUUID');
        expect(isUUIDConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isUUIDConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isUUIDConfig).toHaveProperty('description');
        expect(isUUIDConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(isUUIDConfig).toHaveProperty('create');
        expect(isUUIDConfig.create).toBeFunction();
    });

    it('can validate values', () => {
        const isUUID = isUUIDConfig.create({});

        [
            ['95ecc380-afe9-11e4-9b6c-751b66dd541e', true],
            ['0668CF8B-27F8-2F4D-4F2D-763AC7C8F68B', true],
            ['123e4567-e89b-82d3-f456-426655440000', true],
            ['', false],
            ['95ecc380:afe9:11e4:9b6c:751b66dd541e', false],
            ['123e4567-e89b-x2d3-0456-426655440000', false],
            ['123e4567-e89b-12d3-a456-42600', false],
            [undefined, false],
            ['randomstring', false],
            [true, false],
            [{}, false]
        ].forEach(([input, expected]) => {
            expect(isUUID(input)).toEqual(expected);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isUUIDConfig);
            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });
    });
});
