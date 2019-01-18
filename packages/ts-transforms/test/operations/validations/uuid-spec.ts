
import { DataEntity } from '@terascope/job-components';
import { Uuid } from '../../../src/operations';
import { OperationConfig } from '../../../src/interfaces';

describe('Uuid validation', () => {

    it('can instantiate', () => {
        const opConfig = { follow: 'someId', source_field: 'someField' };
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
        const opConfig = { follow: 'someId', source_field: 'field' };
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
        const data10 = new DataEntity({ field: '@dks*ef9-15df-11e9-b726-PO8f_4-@o$%f' });
        const data11 = new DataEntity({ field: '1x7cw488-f4ad-4aae-a6h4-76f9td5y8635' });

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
        expect(results10).toEqual({});
        expect(results11).toEqual({});

    });

    it('can normailize the data', () => {
        const opConfig = { follow: 'someId', source_field: 'field' };
        const test = new Uuid(opConfig);

        const opConfig2: OperationConfig = { follow: 'someId', source_field: 'field', case: 'uppercase' };
        const test2 = new Uuid(opConfig2);

        const data = ['1c7ce488-f4ad-4aae-a6f4-76f9cd5c8635', '1c7ce488-f4ad-4aae-a6f4-76f9cd5c8635'];

        const dataLowerCase = data.map(uuid => new DataEntity({ field: uuid }));
        const dataUpperCase = data.map(uuid => new DataEntity({ field: uuid.toUpperCase() }));

        const results1 = test.run(dataLowerCase[0]);
        const results2 = test.run(dataLowerCase[1]);
        const results3 = test.run(dataUpperCase[0]);
        const results4 = test.run(dataUpperCase[1]);
        const results5 = test2.run(dataLowerCase[0]);
        const results6 = test2.run(dataLowerCase[1]);
        const results7 = test2.run(dataUpperCase[0]);
        const results8 = test2.run(dataUpperCase[1]);

        expect(results1).toEqual(dataLowerCase[0]);
        expect(results2).toEqual(dataLowerCase[1]);
        expect(results3).toEqual(dataLowerCase[0]);
        expect(results4).toEqual(dataLowerCase[1]);
        expect(results5).toEqual(dataUpperCase[0]);
        expect(results6).toEqual(dataUpperCase[1]);
        expect(results7).toEqual(dataUpperCase[0]);
        expect(results8).toEqual(dataUpperCase[1]);
    });
});
