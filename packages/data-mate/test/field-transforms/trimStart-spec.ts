import 'jest-extended';
import {
    FieldType, Maybe, DataTypeConfig
} from '@terascope/types';
import { LATEST_VERSION } from '@terascope/data-types';
import {
    functionConfigRepository, FunctionDefinitionType,
    ProcessMode, Column, dateFrameAdapter, DataFrame, VectorType
} from '../../src';

const trimStartConfig = functionConfigRepository.trimStart;

describe('trimStartConfig', () => {
    it('has proper configuration', () => {
        expect(trimStartConfig).toBeDefined();
        expect(trimStartConfig).toHaveProperty('name', 'trimStart');
        expect(trimStartConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(trimStartConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(trimStartConfig).toHaveProperty('description');
        expect(trimStartConfig).toHaveProperty('accepts', [
            FieldType.String,
        ]);
        expect(trimStartConfig).toHaveProperty('create');
        expect(trimStartConfig.create).toBeFunction();
    });

    it('can trim whitespace from start of string', () => {
        const values = [' hello ', '   left', 'right   ', '    ', null];
        const expected = [
            'hello ',
            'left',
            'right   ',
            '',
            ''
        ];
        const toGeoPoint = trimStartConfig.create();

        values.forEach((val, ind) => {
            expect(toGeoPoint(val)).toEqual(expected[ind]);
        });
    });

    describe('can work with dataFrameAdapter', () => {
        let col: Column<string>;

        const values: Maybe<string>[] = [
            '   other_things         ',
            'Stuff        ',
            '      hello',
            null,
            'Spider Man',
        ];
        const field = 'someField';

        const frameTestConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                [field]: {
                    type: FieldType.String
                },
                num: {
                    type: FieldType.Number
                }
            }
        };

        const frameData = values.map((str, ind) => ({ [field]: str as string, num: ind }));

        it('should be able to transform a column using trim', () => {
            col = Column.fromJSON<string>(field, {
                type: FieldType.String
            }, values);
            const api = dateFrameAdapter(trimStartConfig);
            const newCol = api.column(col);

            expect(newCol.toJSON()).toEqual([
                'other_things         ',
                'Stuff        ',
                'hello',
                undefined,
                'Spider Man',
            ]);
        });

        it('should be able to transform a dataFrame using trim', () => {
            const frame = DataFrame.fromJSON(frameTestConfig, frameData);

            const api = dateFrameAdapter(trimStartConfig, { field });
            const newFrame = api.frame(frame);

            expect(newFrame.toJSON()).toEqual([
                { [field]: 'other_things         ', num: 0 },
                { [field]: 'Stuff        ', num: 1 },
                { [field]: 'hello', num: 2 },
                { num: 3 },
                { [field]: 'Spider Man', num: 4 },
            ]);

            const [type] = newFrame.columns
                .filter((column) => column.name === field)
                .map((column) => column.vector.type);

            expect(type).toEqual(VectorType.String);
        });
    });
});
