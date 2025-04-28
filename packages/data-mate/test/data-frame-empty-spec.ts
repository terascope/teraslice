import { LATEST_VERSION } from '@terascope/data-types';
import { DataTypeConfig, FieldType } from '@terascope/types';
import { Column, DataFrame } from '../src/index.js';

describe('DataFrame', () => {
    const config: DataTypeConfig = {
        version: LATEST_VERSION,
        fields: {
            _key: { type: FieldType.Keyword },
            num: { type: FieldType.Number },
            bool: { type: FieldType.Boolean }
        }
    };

    const data = [
        { _key: 'a', num: null, bool: true },
        { _key: 'b', num: null, bool: false },
        { _key: 'c', num: null, bool: true },
        { _key: 'd', num: null, bool: false },
        { _key: 'e', num: null, bool: null },
        { _key: 'f', num: null, bool: null },
        { _key: 'g', num: null, bool: null },
        { _key: 'h', num: null, bool: null },
        { _key: 'i', num: null, bool: true },
        { _key: 'j', num: null, bool: true },
    ];

    it('should convert to correct serialization format', () => {
        const df = DataFrame.fromJSON(config, data);

        const str = df.serialize();

        const dfData = str.split('\n').map((meta) => JSON.parse(meta));
        const [num] = dfData.filter((meta) => meta.name === 'num');

        expect(num.values).toEqual([]);
    });

    it('should be able to convert back with optimized serialization format', async () => {
        const df = DataFrame.fromJSON(config, data);
        const str = df.serialize();

        const newDF = await DataFrame.deserialize(str);

        const results = newDF.toJSON({ useNullForUndefined: true });
        const numCol = newDF.getColumn('num');

        expect(numCol?.size).toEqual(data.length);
        expect(results).toMatchObject(data);
    });
});
