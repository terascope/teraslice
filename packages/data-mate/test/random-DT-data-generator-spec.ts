import 'jest-extended';
import { type DataTypeFields, FieldType, GeoShapeType } from '@terascope/types';
import { makeRandomDataSet } from '../src';

describe('random data type data generator', () => {
    const fields: DataTypeFields = {
        textField: { type: FieldType.Text },
        numberArrayField: { type: FieldType.Integer, array: true },
        geoPointField: { type: FieldType.GeoPoint },
        geoJsonField: { type: FieldType.GeoJSON },
        obj: { type: FieldType.Object },
        'obj.a': { type: FieldType.String },
        'obj.b': { type: FieldType.Object },
        'obj.b.nested': { type: FieldType.Object },
        tup: { type: FieldType.Tuple },
        'tup.0': { type: FieldType.String },
        'tup.1': { type: FieldType.Number },
        badField: { } as any

    };

    it('should generate the correct data', () => {
        const records = makeRandomDataSet(fields, 5) || [];
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
                obj: {
                    a: expect.any(String),
                    b: { nested: expect.any(Object) }
                },
                'obj.a': expect.any(String),
                'obj.b': expect.any(Object),
                'obj.b.nested': expect.any(Object),
                tup: [expect.any(String), expect.any(Number)],
                'tup.0': expect.any(String),
                'tup.1': expect.any(Number),
                badField: 'UNKNOWN'
            });
        }
    });
});
