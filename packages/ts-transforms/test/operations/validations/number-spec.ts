
import { Number } from '../../../src/operations';
import { DataEntity } from '@terascope/job-components';

describe('number validation', () => {
   
    it('can instantiate', () => {
        const opConfig = { target_field: 'someField' };
        expect(() => new Number(opConfig)).not.toThrow()
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { target_field: 1324 };
        const badConfig2 = { target_field: "" };
        const badConfig3 = { target_field: {} };
        const badConfig4 = {};
        //@ts-ignore
        expect(() => new Number(badConfig1)).toThrow();
        expect(() => new Number(badConfig2)).toThrow();
         //@ts-ignore
        expect(() => new Number(badConfig3)).toThrow();
        expect(() => new Number(badConfig4)).toThrow();
    });

    it('can and deal with null', () => {
        const opConfig = { target_field: 'someField' };
        const test =  new Number(opConfig);
        const results = test.run(null);

        expect(results).toEqual(null);
    });

    it('can validate number fields', () => {
        const opConfig = { target_field: 'bytes' };
        const test =  new Number(opConfig);
        const metaData = { selectors: { 'some:query' : true } };

        const data1 = new DataEntity({ bytes: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ bytes: 123423 }, metaData);
        const data3 = new DataEntity({ bytes: '56.234' });
        const data4 = new DataEntity({ bytes: [1324] });
        const data5 = new DataEntity({ bytes: { some: 'data' } });
        const data6 = new DataEntity({ bytes: true });
        const data7 = new DataEntity({});

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(DataEntity.getMetadata(results1 as DataEntity, 'selectors')).toEqual(metaData.selectors)
        expect(results1).toEqual({});
        expect(DataEntity.getMetadata(results2 as DataEntity, 'selectors')).toEqual(metaData.selectors)
        expect(results2).toEqual(data2);
        expect(results3).toEqual({});
        expect(results4).toEqual({});
        expect(results5).toEqual({});
        expect(results6).toEqual({});
        expect(DataEntity.isDataEntity(results7)).toEqual(true);
        expect(results7).toEqual({});
    });
});