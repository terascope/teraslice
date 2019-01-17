
import { Extraction } from '../../../src/operations';
import { DataEntity } from '@terascope/job-components';

describe('transform operator', () => {

    it('can instantiate', () => {
        const opConfig = { target_field: 'someField', source_field: 'someField' };
        expect(() => new Extraction(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source_field: 1324 };
        const badConfig2 = { target_field: [] };
        const badConfig3 = { source_field: false, target_field: 'someField' };
        const badConfig4 = {};
        // @ts-ignore
        expect(() => new Extraction(badConfig1)).toThrow();
        // @ts-ignore
        expect(() => new Extraction(badConfig2)).toThrow();
        // @ts-ignore
        expect(() => new Extraction(badConfig3)).toThrow();
        // @ts-ignore
        expect(() => new Extraction(badConfig4)).toThrow();
    });

    it('can transform data', () => {
        const opConfig = { source_field: 'someField', target_field: 'otherField' };
        const test = new Extraction(opConfig);

        const data1 = new DataEntity({ someField: '56.234,95.234' });
        const data2 = new DataEntity({});
        const data3 = new DataEntity({ someField: 'data' });
        const data4 = new DataEntity({ someField: { some: 'data' } });
        const data5 = new DataEntity({ someField: false });
        const data6 = new DataEntity({ someField: 'other' });
        const data7 = new DataEntity({ otherField: 'data' });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(results1).toEqual({ otherField: '56.234,95.234' });
        expect(results2).toEqual(null);
        expect(results3).toEqual({ otherField: 'data' });
        expect(results4).toEqual({ otherField: { some: 'data' } });
        expect(results5).toEqual({ otherField: false });
        expect(results6).toEqual({ otherField: 'other' });
        expect(results7).toEqual(null);
    });

    it('can transform data with start/end', () => {
        const opConfig = { source_field: 'someField', target_field: 'otherField', start: 'field=', end: 'SomeStr' };
        const test = new Extraction(opConfig);

        const data1 = new DataEntity({ someField: '56.234,95.234' });
        const data2 = new DataEntity({});
        const data3 = new DataEntity({ someField: 'field=dataSomeStr' });
        const data4 = new DataEntity({ someField: { some: 'data' } });
        const data5 = new DataEntity({ someField: false });
        const data6 = new DataEntity({ someField: 'field=data' });
        const data7 = new DataEntity({ someField: ['data', 'field=data'] });
        const data8 = new DataEntity({ otherField: 'data' });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);
        const results8 = test.run(data8);

        expect(results1).toEqual(null);
        expect(results2).toEqual(null);
        expect(results3).toEqual({ otherField: 'data' });
        expect(results4).toEqual(null);
        expect(results5).toEqual(null);
        expect(results6).toEqual({ otherField: 'data' });
        expect(results7).toEqual({ otherField: 'data' });
        expect(results8).toEqual(null);
    });

    it('can transform data end = ', () => {
        const opConfig = { source_field: 'someField', target_field: 'otherField', start: 'field=', end: 'EOP' };
        const test = new Extraction(opConfig);

        const data1 = new DataEntity({ someField: 'field=data&SomeStr' });
        const data2 = new DataEntity({ someField: 'field=data' });
        const data3 = new DataEntity({ someField: ['somethingElse', 'field=data'] });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);

        expect(results1).toEqual({ otherField: 'data' });
        expect(results2).toEqual({ otherField: 'data' });
        expect(results3).toEqual({ otherField: 'data' });
    });

    it('can transform data with regex', () => {
        const opConfig = { regex: 'd.*ta', source_field: 'someField', target_field: 'otherField' };
        const test = new Extraction(opConfig);

        const data1 = new DataEntity({ someField: '56.234,95.234' });
        const data2 = new DataEntity({});
        const data3 = new DataEntity({ someField: 'data' });
        const data4 = new DataEntity({ someField: { some: 'data' } });
        const data5 = new DataEntity({ someField: false });
        const data6 = new DataEntity({ someField: 'other' });
        const data7 = new DataEntity({ otherField: 'data' });
        const data8 = new DataEntity({ someField: ['other', 'data'] });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);
        const results8 = test.run(data8);

        expect(results1).toEqual(null);
        expect(results2).toEqual(null);
        expect(results3).toEqual({ otherField: 'data' });
        expect(results4).toEqual(null);
        expect(results5).toEqual(null);
        expect(results6).toEqual(null);
        expect(results7).toEqual(null);
        expect(results8).toEqual({ otherField: 'data' });
    });

    it('can mutate existing doc instead of returning a new one', () => {
        const opConfig = { source_field: 'someField', target_field: 'otherField', mutate: true };
        const test = new Extraction(opConfig);

        const dataArray = DataEntity.makeArray([
            { someField: '56.234,95.234' },
            {},
            { someField: 'data' },
            { someField: { some: 'data' } },
            { someField: false },
            { someField: 'other' },
            { otherField: 'data' }
        ]);

        const finalArray = dataArray.map((doc) => {
            const results = Object.assign({}, doc);
            if (results.someField !== undefined) results.otherField = results.someField;
            return results;
        });

        const resultsArray = dataArray.map(data => test.run(data));

        resultsArray.forEach((result, ind) => {
            expect(DataEntity.isDataEntity(result)).toEqual(true);
            expect(result).toEqual(finalArray[ind]);
        });
    });

    it('can preserve metadata when transforming documents', () => {
        const opConfig = { source_field: 'someField', target_field: 'otherField', mutate: true };
        const opConfig2 = { source_field: 'someField', target_field: 'otherField' };

        const test1 =  new Extraction(opConfig);
        const test2 =  new Extraction(opConfig2);

        const metaData = { selectors: { 'some:data': true } };

        const data1 = new DataEntity({ someField: 'data' }, metaData);
        const data2 = new DataEntity({ someField: 'data' }, metaData);

        const results1 = test1.run(data1);
        const results2 = test2.run(data2);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(DataEntity.getMetadata(results1 as DataEntity, 'selectors')).toEqual(metaData.selectors);

        expect(DataEntity.isDataEntity(results2)).toEqual(true);
        expect(DataEntity.getMetadata(results2 as DataEntity, 'selectors')).toEqual(metaData.selectors);
    });
});
