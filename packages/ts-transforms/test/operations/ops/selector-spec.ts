
import { Selector } from '../../../src/operations';
import { DataEntity } from '@terascope/job-components';

describe('selector operator', () => {

    it('can instantiate', () => {
        const opConfig = { selector: 'some:data' };
        expect(() => new Selector(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source_field: 1324 };
        const badConfig2 = { selector: [] };
        const badConfig3 = { selector: false };
        const badConfig4 = { selector: 1234 };
        // @ts-ignore
        expect(() => new Selector(badConfig1)).toThrow();
        // @ts-ignore
        expect(() => new Selector(badConfig2)).toThrow();
        // @ts-ignore
        expect(() => new Selector(badConfig3)).toThrow();
        // @ts-ignore
        expect(() => new Selector(badConfig4)).toThrow();
    });

    it('can select data', () => {
        const opConfig = { selector: 'some:data' };
        const test = new Selector(opConfig);

        const data1 = new DataEntity({ field: '56.234,95.234' });
        const data2 = new DataEntity({});
        const data3 = new DataEntity({ other: 'data' });
        const data4 = new DataEntity({ some: { some: 'data' } });
        const data5 = new DataEntity({ some: false });
        const data6 = new DataEntity({ some: 'other' });
        const data7 = new DataEntity({ some: 'data' });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);

        expect(results1).toEqual(null);
        expect(results2).toEqual(null);
        expect(results3).toEqual(null);
        expect(results4).toEqual(null);
        expect(results5).toEqual(null);
        expect(results6).toEqual(null);
        expect(DataEntity.isDataEntity(results7)).toEqual(true);
        expect(results7).toEqual(data7);
    });

    it('can select match all data', () => {
        const opConfig = { selector: '*' };
        const test = new Selector(opConfig);

        const data1 = new DataEntity({ field: '56.234,95.234' });
        const data2 = new DataEntity({});
        const data3 = new DataEntity({ other: 'data' });
        const data4 = new DataEntity({ some: { some: 'data' } });
        const data5 = new DataEntity({ some: false });
        const data6 = new DataEntity({ some: 'other' });
        const data7 = new DataEntity({ some: 'data' });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);

        expect(results1).toEqual(data1);
        expect(results2).toEqual(data2);
        expect(results3).toEqual(data3);
        expect(results4).toEqual(data4);
        expect(results5).toEqual(data5);
        expect(results6).toEqual(data6);
        expect(results7).toEqual(data7);
    });

    it('can add selectors metadata to match documents', () => {
        const opConfig = { selector: 'some:data' };
        const test =  new Selector(opConfig);
        const metaData = { 'some:data': true };
        const secondMetaData = { 'other:data': true };
        const mergedMetaData = Object.assign({}, metaData, secondMetaData);

        const data1 = new DataEntity({ some: 'data' });
        const data2 = new DataEntity({ other: 'data' });
        const data3 = new DataEntity({ some: 'data' }, { selectors: secondMetaData });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(DataEntity.getMetadata(results1 as DataEntity, 'selectors')).toEqual(metaData);
        expect(results1).toEqual(data1);
        expect(results2).toEqual(null);
        expect(DataEntity.getMetadata(results3 as DataEntity, 'selectors')).toEqual(mergedMetaData);
        expect(results1).toEqual(data3);
    });
});
