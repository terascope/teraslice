import 'jest-extended';
import {
    DataType, DataTypeConfig, LATEST_VERSION
} from '../src';

describe('DataType (xlucene)', () => {
    it('should return a valid xlucene type config', () => {
        const typeConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                hello: { type: 'Text' },
                location: { type: 'GeoPoint' },
                date: { type: 'Date' },
                ip: { type: 'IP' },
                someNum: { type: 'Long' },
            },
        };

        const xluceneConfig = new DataType(typeConfig).toXlucene();
        expect(xluceneConfig).toEqual({
            hello: 'string',
            location: 'geo-point',
            date: 'date',
            ip: 'ip',
            someNum: 'integer',
        });
    });
});
