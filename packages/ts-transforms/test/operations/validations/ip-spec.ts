
import { DataEntity } from '@terascope/utils';
import { Ip } from '../../../src/operations';

describe('ip validation', () => {
    it('can instantiate', () => {
        const opConfig = {
            source_field: 'someField', target_field: 'someField', __id: 'someId', follow: 'otherId'
        };
        expect(() => new Ip(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source_field: 1324 };
        const badConfig2 = { source_field: '' };
        const badConfig3 = { source_field: {} };
        const badConfig4 = {};
        // @ts-ignore
        expect(() => new Ip(badConfig1)).toThrow();
        // @ts-ignore
        expect(() => new Ip(badConfig2)).toThrow();
        // @ts-ignore
        expect(() => new Ip(badConfig3)).toThrow();
        // @ts-ignore
        expect(() => new Ip(badConfig4)).toThrow();
    });

    it('can validate ip fields', () => {
        const opConfig = {
            source_field: 'ipAddress', target_field: 'ipAddress', __id: 'someId', follow: 'otherId'
        };
        const test = new Ip(opConfig);
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

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);
        const results8 = test.run(data8);
        const results9 = test.run(data9);
        const results10 = test.run(data10);
        const results11 = test.run(data11);
        const results12 = test.run(data12);
        const results13 = test.run(data13);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(DataEntity.getMetadata(results1 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results1).toEqual({});
        expect(DataEntity.getMetadata(results2 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results2).toEqual({});
        expect(results3).toEqual({});
        expect(results4).toEqual({});
        expect(results5).toEqual({});
        expect(results6).toEqual({});
        expect(DataEntity.getMetadata(results6 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results7).toEqual({});
        expect(results8).toEqual({});
        expect(results9).toEqual({});
        expect(results10).toEqual(data10);
        expect(results11).toEqual(data11);
        expect(DataEntity.getMetadata(results11 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results12).toEqual({});
        expect(results13).toEqual({ ipAddress: ['193.0.0.23'] });
    });

    it('can validate nested fields', async () => {
        const opConfig = {
            source_field: 'event.ipAddress', target_field: 'event.ipAddress', __id: 'someId', follow: 'otherId'
        };
        const test = new Ip(opConfig);

        const data1 = new DataEntity({ event: 'something' });
        const data2 = new DataEntity({ event: {} });
        const data3 = new DataEntity({ event: { ipAddress: '193.0.0.23' } });
        const data4 = new DataEntity({ event: { ipAddress: '::' } });
        const data5 = new DataEntity({ event: { ipAddress: 'sadrasfwe32q' } });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);

        expect(results1).toEqual(data1);
        expect(results2).toEqual(data2);
        expect(results3).toEqual(data3);
        expect(results4).toEqual(data4);
        expect(results5).toEqual(data2);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
    });
});
