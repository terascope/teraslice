import 'jest-extended';
import { xLuceneTypeConfig, xLuceneFieldType, FieldType } from '@terascope/types';
import {
    DataType, DataTypeConfig, LATEST_VERSION
} from '../src';

describe('DataType (xlucene)', () => {
    describe('->toXlucene', () => {
        it('should return a valid xlucene type config', () => {
            const typeConfig: DataTypeConfig = {
                version: LATEST_VERSION,
                fields: {
                    hello: { type: FieldType.Text },
                    location: { type: FieldType.GeoPoint },
                    date: { type: FieldType.Date },
                    ip: { type: FieldType.IP },
                    someNum: { type: FieldType.Long },
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

        it('should be able to work with nested field', () => {
            const expected: xLuceneTypeConfig = {
                hello: xLuceneFieldType.Object,
                'hello.there': xLuceneFieldType.String
            };

            expect(new DataType({
                version: LATEST_VERSION,
                fields: {
                    hello: { type: FieldType.Object },
                    'hello.there': { type: FieldType.Text },
                },
            }).toXlucene()).toEqual(expected);

            expect(new DataType({
                version: LATEST_VERSION,
                fields: {
                    'hello.there': { type: FieldType.Text },
                },
            }).toXlucene()).toEqual(expected);
        });
    });
});
