
import { Uuid } from '../../../src/operations';
import { DataEntity } from '@terascope/job-components';

describe('Uuid validation', () => {

    it('can instantiate', () => {
        const opConfig = { refs: 'someId', source_field: 'someField' };
        expect(() => new Uuid(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source_field: 1324 };
        const badConfig2 = { source_field: '' };
        const badConfig3 = { source_field: {} };
        const badConfig4 = {};
        // @ts-ignore
        expect(() => new Uuid(badConfig1)).toThrow();
        // @ts-ignore
        expect(() => new Uuid(badConfig2)).toThrow();
        // @ts-ignore
        expect(() => new Uuid(badConfig3)).toThrow();
        // @ts-ignore
        expect(() => new Uuid(badConfig4)).toThrow();
    });

    it('can validate Uuid fields', () => {
        const opConfig = { refs: 'someId', source_field: 'field' };
        const test = new Uuid(opConfig);

        const metaData = { selectors: { 'some:query' : true } };

        const data1 = new DataEntity({ field: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ field: 123423 }, metaData);
        const data3 = new DataEntity({ field: 'some data here' });
        const data4 = new DataEntity({ field: [1324] });
        const data5 = new DataEntity({ field: { some: 'data' } });
        const data6 = new DataEntity({ field: true }, metaData);
        const data7 = new DataEntity({});
        const data8 = new DataEntity({ field: '1c7ce488-f4ad-4aae-a6f4-76f9cd5c8635' });
        const data9 = new DataEntity({ field: 'a77da370-15df-11e9-b726-396c5e1cc8ce' });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);
        const results8 = test.run(data8);
        const results9 = test.run(data9);

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
        expect(results8).toEqual(data8);
        expect(results9).toEqual(data9);
    });
});
