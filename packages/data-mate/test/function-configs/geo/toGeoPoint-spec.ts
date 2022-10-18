import 'jest-extended';
import {
    FieldType, Maybe, GeoPointInput
} from '@terascope/types';
import {
    functionConfigRepository, FunctionDefinitionType,
    ProcessMode, Column, dataFrameAdapter, FunctionContext
} from '../../../src/index.js';

const toGeoPointConfig = functionConfigRepository.toGeoPoint;

describe('toGeoPointConfig', () => {
    it('has proper configuration', () => {
        expect(toGeoPointConfig).toBeDefined();
        expect(toGeoPointConfig).toHaveProperty('name', 'toGeoPoint');
        expect(toGeoPointConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(toGeoPointConfig).toHaveProperty('process_mode', ProcessMode.FULL_VALUES);
        expect(toGeoPointConfig).toHaveProperty('description');
        expect(toGeoPointConfig).toHaveProperty('accepts', [
            FieldType.String,
            FieldType.Object,
            FieldType.GeoPoint,
            FieldType.Geo,
            FieldType.Number,
            FieldType.Float
        ]);
        expect(toGeoPointConfig).toHaveProperty('create');
        expect(toGeoPointConfig.create).toBeFunction();
    });

    it('can transform values', () => {
        const values = ['60, 40', null, { latitude: 40, longitude: 60 }, [50, 60]];
        const expected = [
            { lon: 40, lat: 60 },
            null,
            { lon: 60, lat: 40 },
            { lon: 50, lat: 60 }
        ];
        const config: FunctionContext<Record<string, unknown>> = {
            args: {},
            parent: values,
            fnDef: toGeoPointConfig,
            field_config: { type: FieldType.String, array: false },
        } as FunctionContext<Record<string, unknown>>;
        const toGeoPoint = toGeoPointConfig.create(config);

        values.forEach((val, ind) => {
            expect(toGeoPoint(val, ind)).toEqual(expected[ind]);
        });
    });

    describe('when paired with dataFrameAdapter', () => {
        let stringCol: Column<string>;
        let objCol: Column<GeoPointInput>;
        let tupleCol: Column<number[]>;

        const stringValues: Maybe<string>[] = [
            '60, 40',
        ];
        const objectValues: Maybe<GeoPointInput>[] = [
            { latitude: 40, longitude: 60 },
        ];
        const tupleValues: Maybe<number[]>[] = [
            [50, 60],
        ];
        const field = 'someField';

        beforeEach(() => {
            stringCol = Column.fromJSON<string>(field, {
                type: FieldType.String
            }, stringValues);

            objCol = Column.fromJSON<GeoPointInput>(field, {
                type: FieldType.Object
            }, objectValues);

            tupleCol = Column.fromJSON<number[]>(field, {
                type: FieldType.Number,
                array: true
            }, tupleValues);
        });

        it('should be able to transform using toGeoPoint', () => {
            const api = dataFrameAdapter(toGeoPointConfig);

            const geoStringResults = api.column(stringCol);

            expect(geoStringResults.toJSON()).toEqual([
                { lon: 40, lat: 60 },
            ]);

            const geoObjectResults = api.column(objCol);

            expect(geoObjectResults.toJSON()).toEqual([
                { lon: 60, lat: 40 },
            ]);

            const geoTupleResults = api.column(tupleCol);

            expect(geoTupleResults.toJSON()).toEqual([
                { lon: 50, lat: 60 },
            ]);
        });
    });
});
