
import { Ip } from '../../../src/operations';
import { DataEntity } from '@terascope/job-components';

describe('ip validation', () => {
   
    it('can instantiate', () => {
        const opConfig = { target_field: 'someField' };
        expect(() => new Ip(opConfig)).not.toThrow()
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { target_field: 1324 };
        const badConfig2 = { target_field: "" };
        const badConfig3 = { target_field: {} };
        const badConfig4 = {};
        //@ts-ignore
        expect(() => new Ip(badConfig1)).toThrow();
        expect(() => new Ip(badConfig2)).toThrow();
        //@ts-ignore
        expect(() => new Ip(badConfig3)).toThrow();
        expect(() => new Ip(badConfig4)).toThrow();
    });

    it('can and deal with null', () => {
        const opConfig = { target_field: 'someField' };
        const test =  new Ip(opConfig);
        const results = test.run(null);

        expect(results).toEqual(null);
    });

    it('can validate boolean fields', () => {
        const opConfig = { target_field: 'ipAddress' };
        const test =  new Ip(opConfig);
        const metaData = { selectors: { 'some:query' : true } };

        const data1 = new DataEntity({ ipAddress: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ ipAddress: 123423 }, metaData);
        const data3 = new DataEntity({ ipAddress: '56.234' });
        const data4 = new DataEntity({ ipAddress: [1324] });
        const data5 = new DataEntity({ ipAddress: { some: 'data' } });
        const data6 = new DataEntity({ ipAddress: true }, metaData);
        const data7 = new DataEntity({});
        const data8 = new DataEntity({ ipAddress: 'http://google.com '});
        const data9 = new DataEntity({ ipAddress: 'ha3ke5@pawnage.com'}, metaData);
        const data10 = new DataEntity({ ipAddress: '::'});
        const data11 = new DataEntity({ ipAddress: '193.0.0.23' }, metaData);
        const data12 = new DataEntity({ ipAddress: '193.0.0.0/24' });

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

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(DataEntity.getMetadata(results1 as DataEntity, 'selectors')).toEqual(metaData.selectors)
        expect(results1).toEqual({});
        expect(DataEntity.getMetadata(results2 as DataEntity, 'selectors')).toEqual(metaData.selectors)
        expect(results2).toEqual({});
        expect(results3).toEqual({});
        expect(results4).toEqual({});
        expect(results5).toEqual({});
        expect(results6).toEqual({});
        expect(DataEntity.getMetadata(results6 as DataEntity, 'selectors')).toEqual(metaData.selectors)
        expect(results7).toEqual({});
        expect(results8).toEqual({});
        expect(results9).toEqual({});
        expect(results10).toEqual(data10);
        expect(results11).toEqual(data11);
        expect(DataEntity.getMetadata(results11 as DataEntity, 'selectors')).toEqual(metaData.selectors)
        expect(results12).toEqual({});
    });
});