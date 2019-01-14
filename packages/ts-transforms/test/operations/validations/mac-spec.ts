
import { Mac } from '../../../src/operations';
import { DataEntity } from '@terascope/job-components';

describe('mac validation', () => {

    it('can instantiate', () => {
        const opConfig = { refs: 'someId', source_field: 'someField' };
        expect(() => new Mac(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source_field: 1324 };
        const badConfig2 = { source_field: '' };
        const badConfig3 = { source_field: {} };
        const badConfig4 = {};
        // @ts-ignore
        expect(() => new Mac(badConfig1)).toThrow();
        // @ts-ignore
        expect(() => new Mac(badConfig2)).toThrow();
        // @ts-ignore
        expect(() => new Mac(badConfig3)).toThrow();
        // @ts-ignore
        expect(() => new Mac(badConfig4)).toThrow();
    });

    it('can validate mac fields', () => {
        const opConfig = { refs: 'someId', source_field: 'field' };
        const test = new Mac(opConfig);

        const opConfig2 = { refs: 'someId', source_field: 'field', preserve_colons: true };
        const test2 = new Mac(opConfig2);

        const metaData = { selectors: { 'some:query' : true } };

        const data1 = new DataEntity({ field: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ field: 123423 }, metaData);
        const data3 = new DataEntity({ field: 'some data here' });
        const data4 = new DataEntity({ field: [1324] });
        const data5 = new DataEntity({ field: { some: 'data' } });
        const data6 = new DataEntity({ field: true }, metaData);
        const data7 = new DataEntity({});
        const data8 = new DataEntity({ field: '17:63:80:d9:4c:vb' });
        const data9 = new DataEntity({ field: '176380d94cvb' });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);
        const results8 = test2.run(data8);
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

    it('can ensure mac are of certain lengths', () => {
        const opConfig = { refs: 'someId', source_field: 'field', length: 12 };
        const test =  new Mac(opConfig);
        const metaData = { selectors: { 'some:query' : true } };

        const data1 = new DataEntity({ field: 'something' }, metaData);
        const data2 = new DataEntity({ field: '17:63:80:d9:4c:vb' }, metaData);

        const results1 = test.run(data1);
        const results2 = test.run(data2);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(DataEntity.getMetadata(results1 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results1).toEqual({});
        expect(DataEntity.getMetadata(results2 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results2).toEqual(data2);
    });

    it('can validate and make sure that the string is within a range', async() => {
        const opConfig = { refs: 'someId', source_field: 'field', min: 15 };
        const opConfig2 = { refs: 'someId', source_field: 'field', mx: 13 };

        const test =  new Mac(opConfig);
        const test2 =  new Mac(opConfig2);

        const data1 = new DataEntity({ field: '17:63:80:d9:4c:vb' });
        const data2 = new DataEntity({ field: '17:63:80:d9:4c:vb' });

        const results1 = test.run(data1);
        const results2 = test2.run(data2);

        expect(results1).toEqual({});
        expect(results2).toEqual({});
    });
});
