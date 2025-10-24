import { cloneDeep } from '@terascope/core-utils';
import { DataEntity } from '@terascope/entity-utils';
import { Ip as IP } from '../../../src/operations';

describe('ip validation', () => {
    it('can instantiate', () => {
        const opConfig = {
            source: 'someField', target: 'someField', __id: 'someId', follow: 'otherId'
        };
        expect(() => new IP(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source: 1324 };
        const badConfig2 = { source: '' };
        const badConfig3 = { source: {} };
        const badConfig4 = {};
        // @ts-expect-error
        expect(() => new IP(badConfig1)).toThrow();
        // @ts-expect-error
        expect(() => new IP(badConfig2)).toThrow();
        // @ts-expect-error
        expect(() => new IP(badConfig3)).toThrow();
        // @ts-expect-error
        expect(() => new IP(badConfig4)).toThrow();
    });

    it('can validate ip fields', () => {
        const opConfig = {
            source: 'ipAddress', target: 'ipAddress', __id: 'someId', follow: 'otherId'
        };
        const test = new IP(opConfig);
        const metaData = { selectors: { 'some:query': true } };

        const data1 = new DataEntity({ ipAddress: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ ipAddress: 123423 }, metaData);
        const data3 = new DataEntity({ ipAddress: '56.234' });
        const data4 = new DataEntity({ ipAddress: [1324] });
        const data5 = new DataEntity({ ipAddress: { some: 'data' } });
        const data6 = new DataEntity({ ipAddress: true }, metaData);
        const data7 = new DataEntity({});
        const data8 = new DataEntity({ ipAddress: 'http:// google.com ' });
        const data9 = new DataEntity({ ipAddress: 'ha3ke5@pawnage.com' }, metaData);
        const data10 = new DataEntity({ ipAddress: '::' });
        const data11 = new DataEntity({ ipAddress: '193.0.0.23' }, metaData);
        const data12 = new DataEntity({ ipAddress: '193.0.0.0/24' });
        const data13 = new DataEntity({ ipAddress: ['193.0.0.23', true, 'other:stuff', 1234] });

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));
        const results5 = test.run(cloneDeep(data5));
        const results6 = test.run(cloneDeep(data6));
        const results7 = test.run(cloneDeep(data7));
        const results8 = test.run(cloneDeep(data8));
        const results9 = test.run(cloneDeep(data9));
        const results10 = test.run(cloneDeep(data10));
        const results11 = test.run(cloneDeep(data11));
        const results12 = test.run(cloneDeep(data12));
        const results13 = test.run(cloneDeep(data13));

        expect(results1).toEqual(null);
        expect(results2).toEqual(null);
        expect(results3).toEqual(null);
        expect(results4).toEqual(null);
        expect(results5).toEqual(null);
        expect(results6).toEqual(null);
        expect(results7).toEqual(null);
        expect(results8).toEqual(null);
        expect(results9).toEqual(null);
        expect(results10).toEqual(data10);
        expect(results11).toEqual(data11);
        expect(results11?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results12).toEqual(null);
        expect(results13).toEqual({ ipAddress: ['193.0.0.23'] });
    });

    it('can validate nested fields', async () => {
        const opConfig = {
            source: 'event.ipAddress', target: 'event.ipAddress', __id: 'someId', follow: 'otherId'
        };
        const test = new IP(opConfig);

        const data1 = new DataEntity({ event: 'something' });
        const data2 = new DataEntity({ event: {} });
        const data3 = new DataEntity({ event: { ipAddress: '193.0.0.23' } });
        const data4 = new DataEntity({ event: { ipAddress: '::' } });
        const data5 = new DataEntity({ event: { ipAddress: 'sadrasfwe32q' } });

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));
        const results5 = test.run(cloneDeep(data5));

        expect(results1).toEqual(data1);
        expect(results2).toEqual(data2);
        expect(results3).toEqual(data3);
        expect(results4).toEqual(data4);
        expect(results5).toEqual(data2);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
    });
});
