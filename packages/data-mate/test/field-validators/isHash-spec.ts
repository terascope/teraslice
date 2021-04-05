import 'jest-extended';
import { FieldType, Maybe } from '@terascope/types';
import {
    functionConfigRepository, functionAdapter,
    FunctionDefinitionType, ProcessMode,
    dateFrameAdapter, Column
} from '../../src';

const isHashConfig = functionConfigRepository.isHash;

describe('isHashConfig', () => {
    it('has proper configuration', () => {
        expect(isHashConfig).toBeDefined();
        expect(isHashConfig).toHaveProperty('name', 'isHash');
        expect(isHashConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isHashConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isHashConfig).toHaveProperty('description');
        expect(isHashConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(isHashConfig).toHaveProperty('create');
        expect(isHashConfig.create).toBeFunction();
        expect(isHashConfig).toHaveProperty('required_arguments', ['algo']);
        expect(isHashConfig.validate_arguments).toBeFunction();
        expect(isHashConfig).toHaveProperty('argument_schema');
        expect(isHashConfig?.argument_schema?.algo.type).toEqual(FieldType.String);
    });

    it('can validate values', () => {
        const args = { algo: 'sha256' };
        const values = [
            '85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33',
            '98fc121ea4c749f2b06e4a768b92ef1c740625a0',
            'true',
            null, 1, 0, [true, false], { some: 'thing' }];
        const expected = [true, false, false, false, false, false, false, false];
        const isBoolean = isHashConfig.create(args);

        values.forEach((val, ind) => {
            expect(isBoolean(val)).toEqual(expected[ind]);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isHashConfig, { args: { algo: 'sha256' } });
            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });

        it('should throw if no args are passed in', () => {
            expect(() => functionAdapter(isHashConfig)).toThrowError('No arguments were provided but isHash requires algo to be set');
        });

        it('should throw if required field is not given', () => {
            expect(() => functionAdapter(isHashConfig, { args: { stuff: 'hello ' } } as any)).toThrowError('Invalid arguments, requires algo to be set to a non-empty value');
        });

        it('should throw if args are wrong type', () => {
            expect(
                () => functionAdapter(isHashConfig, { args: { algo: 1234 } } as any)
            ).toThrowError('Invalid argument value set at key algo, expected Number to be compatible with type String');
        });

        it('should throw if args are empty string', () => {
            expect(
                () => functionAdapter(isHashConfig, { args: { algo: '' } } as any)
            ).toThrowError('Invalid arguments, requires algo to be set to a non-empty value');
        });

        it('should be able to call the fnDef validate_arguments', () => {
            expect(
                () => functionAdapter(isHashConfig, { args: { algo: 'hello' } } as any)
            ).toThrowError('Invalid algorithm hello, must be set to one of md4, md5, sha1, sha256, sha384, sha512, ripemd128, ripemd160, tiger128, tiger160, tiger192, crc32 and crc32b');
        });
    });

    describe('when paired with dateFrameAdapter', () => {
        let col: Column<string>;
        const values: Maybe<string>[] = [
            '85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33',
            '6201b3d18157e00963fcf008c1e',
            '98fc121easdfasdfasdfads749f2b06e4a768b92ef1c740625a0',
            null,
            'SpiderMan',
        ];
        const field = 'someField';
        const algo = 'sha256';

        beforeEach(() => {
            col = Column.fromJSON<string>(field, {
                type: FieldType.String
            }, values);
        });

        it('should be able to validate using isHash', () => {
            const validator = dateFrameAdapter(isHashConfig, { args: { algo } });
            const newCol = col.validate(validator);

            expect(newCol.toJSON()).toEqual([
                '85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33',
                undefined,
                undefined,
                undefined,
                undefined,
            ]);
        });
    });
});
