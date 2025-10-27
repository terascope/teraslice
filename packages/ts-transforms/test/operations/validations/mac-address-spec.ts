import { cloneDeep, DataEntity } from '@terascope/core-utils';
import { MacAddress } from '../../../src/operations';

describe('MacAddress validation', () => {
    it('can instantiate', () => {
        const opConfig = {
            follow: 'someId', source: 'someField', target: 'someField', __id: 'someId'
        };
        expect(() => new MacAddress(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source: 1324 };
        const badConfig2 = { source: '' };
        const badConfig3 = { source: {} };
        const badConfig4 = {};
        // @ts-expect-error
        expect(() => new MacAddress(badConfig1)).toThrow();
        // @ts-expect-error
        expect(() => new MacAddress(badConfig2)).toThrow();
        // @ts-expect-error
        expect(() => new MacAddress(badConfig3)).toThrow();
        // @ts-expect-error
        expect(() => new MacAddress(badConfig4)).toThrow();
    });

    it('can validate MacAddress fields', () => {
        const opConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = new MacAddress(opConfig);

        const opConfig2 = {
            follow: 'someId',
            source: 'field',
            target: 'field',
            preserve_colons: true,
            case: 'uppercase',
            __id: 'someId'
        };
        const test2 = new MacAddress(opConfig2 as any);

        const metaData = { selectors: { 'some:query': true } };

        const data1 = new DataEntity({ field: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ field: 123423 }, metaData);
        const data3 = new DataEntity({ field: 'some data here' });
        const data4 = new DataEntity({ field: [1324] });
        const data5 = new DataEntity({ field: { some: 'data' } });
        const data6 = new DataEntity({ field: true }, metaData);
        const data7 = new DataEntity({});
        const data8 = new DataEntity({ field: 'EC:1A:59:22:00:D4' });
        const data9 = new DataEntity({ field: 'ec1a592200d4' });
        const data10 = new DataEntity({ field: ['ec1a592200d4', 1234, 'pter:rugss'] });

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));
        const results5 = test.run(cloneDeep(data5));
        const results6 = test.run(cloneDeep(data6));
        const results7 = test.run(cloneDeep(data7));
        const results8 = test2.run(cloneDeep(data8));
        const results9 = test.run(cloneDeep(data9));
        const results10 = test.run(cloneDeep(data10));

        expect(results1).toEqual(null);
        expect(results2).toEqual(null);
        expect(results3).toEqual(null);
        expect(results4).toEqual(null);
        expect(results5).toEqual(null);
        expect(results6).toEqual(null);
        expect(results7).toEqual(null);
        expect(results8).toEqual(data8);
        expect(results9).toEqual({ field: 'ec1a592200d4' });
        expect(results10).toEqual({ field: ['ec1a592200d4'] });
    });
});
