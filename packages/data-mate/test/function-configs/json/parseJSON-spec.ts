import 'jest-extended';
import {
    FieldType, Maybe, DataTypeFields
} from '@terascope/types'; import {
    functionConfigRepository, FunctionDefinitionType, ProcessMode,
    Column, dataFrameAdapter, FunctionContext
} from '../../../src';

const parseJSONConfig = functionConfigRepository.parseJSON;

describe('parseJSON', () => {
    it('has proper configuration', () => {
        expect(parseJSONConfig).toBeDefined();
        expect(parseJSONConfig).toHaveProperty('name', 'parseJSON');
        expect(parseJSONConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(parseJSONConfig).toHaveProperty('process_mode', ProcessMode.FULL_VALUES);
        expect(parseJSONConfig).toHaveProperty('description');
        expect(parseJSONConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(parseJSONConfig).toHaveProperty('create');
        expect(parseJSONConfig.create).toBeFunction();
    });

    it('can transform values', () => {
        const values = ['true', '{"some": "stuff"}'];
        const expected = [true, { some: 'stuff' }];

        const config: FunctionContext<Record<string, unknown>> = {
            args: {},
            parent: values,
            fnDef: parseJSONConfig,
            field_config: { type: FieldType.String, array: false },
        } as FunctionContext<Record<string, unknown>>;

        const parseJSON = parseJSONConfig.create(config);

        values.forEach((val, ind) => {
            expect(parseJSON(val, ind)).toEqual(expected[ind]);
        });
    });

    describe('can work with dataFrameAdapter', () => {
        it('should be able to parse a column of strings into numbers', () => {
            const values: Maybe<string>[] = [
                '4917600000000',
                undefined,
                '49187484'
            ];

            const col = Column.fromJSON<string>('field', {
                type: FieldType.String,
            }, values);

            const api = dataFrameAdapter(parseJSONConfig);
            const newCol = api.column(col);

            const { type } = newCol.config;

            expect(type).toEqual(FieldType.Any);

            expect(newCol.toJSON()).toEqual([
                4917600000000,
                undefined,
                49187484
            ]);
        });
    });
});
