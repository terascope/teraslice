import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../../src';

const isMacAddressConfig = functionConfigRepository.isMACAddress;

describe('isMacAddressConfig', () => {
    it('has proper configuration', () => {
        expect(isMacAddressConfig).toBeDefined();
        expect(isMacAddressConfig).toHaveProperty('name', 'isMACAddress');
        expect(isMacAddressConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isMacAddressConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isMacAddressConfig).toHaveProperty('description');
        expect(isMacAddressConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(isMacAddressConfig).toHaveProperty('create');
        expect(isMacAddressConfig.create).toBeFunction();
        expect(isMacAddressConfig.validate_arguments).toBeFunction();
        expect(isMacAddressConfig).toHaveProperty('argument_schema');
    });

    it('can validate values with no delimiter', () => {
        const values = [
            '00:1f:f3:5b:2b:1f',
            '001ff35b2b1f',
            '00-1f-f3-5b-2b-1f'
        ];

        const isMacAddress = isMacAddressConfig.create({});

        values.forEach((val) => {
            expect(isMacAddress(val)).toEqual(true);
        });
    });

    it('can validate values with delimiter', () => {
        const values = [
            ['00:1f:f3:5b:2b:1f', 'colon'],
            ['00-1f-f3-5b-2b-1f', ['dash', 'colon']],
            ['001f.f35b.2b1f', 'dot'],
            ['001ff35b2b1f', 'none'],
            ['001ff35b2b1f', 'any']
        ];

        values.forEach(([val, delimiter]) => {
            const isMacAddress = isMacAddressConfig.create({ delimiter });

            expect(isMacAddress(val)).toEqual(true);
        });
    });

    it('returns false for bad values or incorrect delimiter', () => {
        const values = [
            ['004231f3f325b12211'],
            ['00-1f-f3-5b-2b-1f', ['dot', 'colon']],
        ];

        values.forEach(([val, delimiter]) => {
            const isMacAddress = isMacAddressConfig.create({ delimiter });

            expect(isMacAddress(val)).toEqual(false);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isMacAddressConfig, { args: { delimiter: 'colon' } });

            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });

        it('should throw if args are wrong type', () => {
            expect(
                () => functionAdapter(isMacAddressConfig, { args: { delimiter: 1234 } } as any)
            ).toThrowError('Invalid mac address delimiter, must be a list of or one of space, colon, dash, dot, none and any');
        });

        it('should be able to call the fnDef validate_arguments', () => {
            expect(
                () => functionAdapter(isMacAddressConfig, { args: { delimiter: 'hello' } } as any)
            ).toThrowError('Invalid mac address delimiter, must be a list of or one of space, colon, dash, dot, none and any');
        });
    });
});
