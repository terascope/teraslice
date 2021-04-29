import 'jest-extended';

import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../../src';

const isPhoneNumberLikeConfig = functionConfigRepository.isPhoneNumberLike;

describe('isURLConfig', () => {
    it('has proper configuration', () => {
        expect(isPhoneNumberLikeConfig).toBeDefined();
        expect(isPhoneNumberLikeConfig).toHaveProperty('name', 'isPhoneNumberLike');
        expect(isPhoneNumberLikeConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isPhoneNumberLikeConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isPhoneNumberLikeConfig).toHaveProperty('description');
        expect(isPhoneNumberLikeConfig).toHaveProperty('accepts', [FieldType.String, FieldType.Number]);
        expect(isPhoneNumberLikeConfig).toHaveProperty('create');
        expect(isPhoneNumberLikeConfig.create).toBeFunction();
    });

    it('can validate values', () => {
        const isPhoneNumberLike = isPhoneNumberLikeConfig.create({});

        [
            ['46707123456', true],
            ['1-808-915-6800', true],
            ['+18089156800', true],
            ['+7-952-5554-602', true],
            [79525554602, true],
            ['4900000000000', true],
            ['2234578', true],
            ['223457823432432423324', false],
            ['unknown', false],
            ['123', false],
        ].forEach(([input, expected]) => {
            expect(isPhoneNumberLike(input)).toEqual(expected);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isPhoneNumberLikeConfig);
            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });
    });
});
