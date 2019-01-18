
import { StringValidation } from '../../../src/operations';
import { DataEntity } from '@terascope/job-components';

describe('string validation', () => {

    it('can instantiate', () => {
        const opConfig = { refs: 'someId', source_field: 'someField' };
        expect(() => new StringValidation(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source_field: 1324 };
        const badConfig2 = { source_field: '' };
        const badConfig3 = { source_field: {} };
        const badConfig4 = {};
        // @ts-ignore
        expect(() => new StringValidation(badConfig1)).toThrow();
        // @ts-ignore
        expect(() => new StringValidation(badConfig2)).toThrow();
        // @ts-ignore
        expect(() => new StringValidation(badConfig3)).toThrow();
        // @ts-ignore
        expect(() => new StringValidation(badConfig4)).toThrow();
    });

    it('can validate string fields', () => {
        const opConfig = { refs: 'someId', source_field: 'field' };
        const test = new StringValidation(opConfig);
        const metaData = { selectors: { 'some:query' : true } };

        const data1 = new DataEntity({ field: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ field: 123423 }, metaData);
        const data3 = new DataEntity({ field: 'some data here' });
        const data4 = new DataEntity({ field: [1324] });
        const data5 = new DataEntity({ field: { some: 'data' } });
        const data6 = new DataEntity({ field: true }, metaData);
        const data7 = new DataEntity({});

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);

        function stringify(obj: DataEntity): object {
            if (obj.field) {
                obj.field = JSON.stringify(obj.field);
            }
            return obj;
        }

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(DataEntity.getMetadata(results1 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results1).toEqual(data1);
        expect(DataEntity.getMetadata(results2 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results2).toEqual({ field: '123423' });
        expect(results3).toEqual(stringify(data3));
        expect(results4).toEqual(stringify(data4));
        expect(results5).toEqual(stringify(data5));
        expect(results6).toEqual(stringify(data6));
        expect(DataEntity.getMetadata(results6 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results7).toEqual({});
    });

    it('can ensure strings are of certain lengths', () => {
        const opConfig = { refs: 'someId', source_field: 'field', length: 14 };
        const test =  new StringValidation(opConfig);
        const metaData = { selectors: { 'some:query' : true } };

        const data1 = new DataEntity({ field: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ field: 'some data here' }, metaData);

        const results1 = test.run(data1);
        const results2 = test.run(data2);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(DataEntity.getMetadata(results1 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results1).toEqual({});
        expect(DataEntity.getMetadata(results2 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results2).toEqual(data2);
    });

    it('can validate nested fields', async() => {
        const opConfig = { refs: 'someId', source_field: 'person.name', length: 14 };
        const test =  new StringValidation(opConfig);

        const data1 = new DataEntity({ person: 'something' });
        const data2 = new DataEntity({ person: {} });
        const data3 = new DataEntity({ person: { name: '123423' } });
        const data4 = new DataEntity({ person: { name: 432423 } });
        const data5 = new DataEntity({ person: { name: 'sadrasfwe32q' } });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);

        expect(results1).toEqual(data1);
        expect(results2).toEqual(data2);
        expect(results3).toEqual(data3);
        expect(results4).toEqual(data2);
        expect(results5).toEqual(data5);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
    });
});
