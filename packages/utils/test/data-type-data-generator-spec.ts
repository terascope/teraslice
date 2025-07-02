import 'jest-extended';
import { DataTypeFields, FieldType } from '@terascope/types';
import { makeRandomDataSet } from '../src/data-type-data-generator.js';

describe('random data generation', () => {
    const fields: DataTypeFields = {
        textField: { type: FieldType.Text },
        numberArrayField: { type: FieldType.Integer, array: true },
        geoField: { type: FieldType.GeoPoint },
        badField: { } as any
    };

    it('should generate the correct data', () => {
        const records = makeRandomDataSet(fields, 5) || [];
        expect(records).toBeArrayOfSize(5);

        for (const record of records) {
            expect(record).toEqual({
                textField: expect.any(String),
                numberArrayField: expect.any(Array),
                geoField: expect.any(Object),
                badField: 'UNKNOWN'
            });
        }
    });
});
