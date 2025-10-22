import { DataEntity, cloneDeep } from '@terascope/core-utils';
import { StringValidation } from '../../../src/operations';

describe('string validation', () => {
    it('can instantiate', () => {
        const opConfig = {
            refs: 'someId', source: 'someField', target: 'someField', __id: 'someId', follow: 'otherId'
        };
        expect(() => new StringValidation(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source: 1324 };
        const badConfig2 = { source: '' };
        const badConfig3 = { source: {} };
        const badConfig4 = {};
        // @ts-expect-error
        expect(() => new StringValidation(badConfig1)).toThrow();
        // @ts-expect-error
        expect(() => new StringValidation(badConfig2)).toThrow();
        // @ts-expect-error
        expect(() => new StringValidation(badConfig3)).toThrow();
        // @ts-expect-error
        expect(() => new StringValidation(badConfig4)).toThrow();
    });

    it('can validate string fields', () => {
        const opConfig = {
            refs: 'someId', source: 'field', target: 'field', __id: 'someId', follow: 'otherId'
        };
        const test = new StringValidation(opConfig);
        const metaData = { selectors: { 'some:query': true } };

        const data1 = new DataEntity({ field: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ field: 123423 }, metaData);
        const data3 = new DataEntity({ field: 'some data here' });
        const data4 = new DataEntity({ field: [1324] });
        const data5 = new DataEntity({ field: { some: 'data' } });
        const data6 = new DataEntity({ field: true }, metaData);
        const data7 = new DataEntity({});
        const data8 = new DataEntity({ field: [1324, 'hello'] });

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));
        const results5 = test.run(cloneDeep(data5));
        const results6 = test.run(cloneDeep(data6));
        const results7 = test.run(cloneDeep(data7));
        const results8 = test.run(cloneDeep(data8));

        function stringify(obj: DataEntity): Record<string, any> {
            if (obj.field) {
                if (Array.isArray(obj.field)) {
                    return obj.field.map((data: any) => JSON.stringify(data));
                }
                obj.field = JSON.stringify(obj.field);
            }
            return obj;
        }

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(results1?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results1).toEqual(data1);
        expect(results2?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results2).toEqual({ field: '123423' });
        expect(results3).toEqual(data3);
        expect(results4).toEqual({ field: ['1324'] });
        expect(results5).toEqual(stringify(data5));
        expect(results6).toEqual(stringify(data6));
        expect(results6?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results7).toEqual(null);
        expect(results8).toEqual({ field: ['1324', 'hello'] });
    });

    it('can ensure strings are of certain lengths', () => {
        const opConfig = {
            refs: 'someId', source: 'field', target: 'field', length: 14, __id: 'someId', follow: 'otherId'
        };
        const test = new StringValidation(opConfig);
        const metaData = { selectors: { 'some:query': true } };

        const data1 = new DataEntity({ field: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ field: 'some data here' }, metaData);

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));

        expect(results1).toEqual(null);
        expect(results2?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results2).toEqual(data2);
    });

    it('can validate nested fields', async () => {
        const opConfig = {
            refs: 'someId',
            source: 'person.name',
            target: 'person.name',
            __id: 'someId',
            follow: 'otherId',
        };
        const test = new StringValidation(opConfig);

        const data1 = new DataEntity({ person: 'something' });
        const data2 = new DataEntity({ person: {} });
        const data3 = new DataEntity({ person: { name: '123423' } });
        const data4 = new DataEntity({ person: { name: 432423 } });
        const data5 = new DataEntity({ person: { name: 'sadrasfwe32q' } });

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));
        const results5 = test.run(cloneDeep(data5));

        expect(results1).toEqual(data1);
        expect(results2).toEqual(data2);
        expect(results3).toEqual(data3);
        expect(results4).toEqual({ person: { name: '432423' } });
        expect(results5).toEqual(data5);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
    });
});
