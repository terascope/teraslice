import 'jest-extended';
import {
    FieldType, Maybe
} from '@terascope/types'; import {
    functionConfigRepository, FunctionDefinitionType, ProcessMode,
    Column, dateFrameAdapter
} from '../../src';

const toISDNConfig = functionConfigRepository.toISDN;

describe('toISDN', () => {
    it('has proper configuration', () => {
        expect(toISDNConfig).toBeDefined();
        expect(toISDNConfig).toHaveProperty('name', 'toISDN');
        expect(toISDNConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(toISDNConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(toISDNConfig).toHaveProperty('description');
        expect(toISDNConfig).toHaveProperty('accepts', [
            FieldType.String,
            FieldType.Number,
            FieldType.Byte,
            FieldType.Short,
            FieldType.Integer,
            FieldType.Float,
            FieldType.Long,
            FieldType.Double
        ]);
        expect(toISDNConfig).toHaveProperty('create');
        expect(toISDNConfig.create).toBeFunction();
    });

    it('can transform values', () => {
        const values = ['+33-1-22-33-44-55', '1(800)FloWErs'];
        const expected = ['33122334455', '18003569377'];

        const toKebabCase = toISDNConfig.create({});

        values.forEach((val, ind) => {
            expect(toKebabCase(val)).toEqual(expected[ind]);
        });
    });

    describe('can work with dataFrameAdapter', () => {
        it('should be able to transform a column of numbers to phone numbers', () => {
            const values: Maybe<number>[] = [
                4917600000000,
                undefined,
                49187484
            ];

            const col = Column.fromJSON<number>('myPhoneNumber', {
                type: FieldType.Number,
            }, values);

            const api = dateFrameAdapter(toISDNConfig);
            const newCol = api.column(col);

            const { type, array } = newCol.config;

            expect(type).toEqual(FieldType.String);
            expect(array).toBeFalsy();

            expect(newCol.toJSON()).toEqual([
                '4917600000000',
                undefined,
                '49187484'
            ]);
        });
    });
});
