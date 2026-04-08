import 'jest-extended';
import { type DataTypeFields, FieldType, GeoShapeType } from '@terascope/types';
import { DataTypeTestHelpers } from '../src/index.js';

describe('random data generator', () => {
    const fields: DataTypeFields = {
        textField: { type: FieldType.Text },
        numberArrayField: { type: FieldType.Integer, array: true },
        geoPointField: { type: FieldType.GeoPoint },
        geoJsonField: { type: FieldType.GeoJSON },
        badField: { } as any
    };

    it('should generate the correct data', () => {
        const records = DataTypeTestHelpers.makeRandomDataSet(fields, 5) || [];
        expect(records).toBeArrayOfSize(5);

        for (const record of records) {
            expect(record).toEqual({
                textField: expect.any(String),
                numberArrayField: expect.arrayContaining([expect.any(Number)]),
                geoPointField: expect.objectContaining({
                    latitude: expect.any(Number),
                    longitude: expect.any(Number)
                }),
                geoJsonField: expect.objectContaining({
                    coordinates: expect.toBeArray(),
                    type: expect.toBeOneOf(Object.keys(GeoShapeType))
                }),
                badField: 'UNKNOWN'
            });
        }
    });
});
