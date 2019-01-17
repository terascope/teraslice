
import { PhoneNumber } from '../../../src/operations';
import { DataEntity } from '@terascope/job-components';

describe('phone number validation', () => {

    it('can instantiate', () => {
        const opConfig = { refs: 'someId', source_field: 'someField' };
        expect(() => new PhoneNumber(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source_field: 1324 };
        const badConfig2 = { source_field: '' };
        const badConfig3 = { source_field: {} };
        const badConfig4 = {};
        // @ts-ignore
        expect(() => new PhoneNumber(badConfig1)).toThrow();
        // @ts-ignore
        expect(() => new PhoneNumber(badConfig2)).toThrow();
        // @ts-ignore
        expect(() => new PhoneNumber(badConfig3)).toThrow();
        // @ts-ignore
        expect(() => new PhoneNumber(badConfig4)).toThrow();
    });

    it('can validate phone number fields', () => {
        const opConfig = { refs: 'someId', source_field: 'field' };
        const test = new PhoneNumber(opConfig);
        const metaData = { selectors: { 'some:query' : true } };
        const validPhone1 = '14803847362';
        const validPhone2 = '1(480)384-7362';

        const notValidPhone = '148038473623';
        const notValidPhone2 = '3847362';
        const notValidPhone3 = '4803847362';

        const data1 = new DataEntity({ field: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ field: 123423 }, metaData);
        const data3 = new DataEntity({ field: 'some data here' });
        const data4 = new DataEntity({ field: [1324] });
        const data5 = new DataEntity({ field: { some: 'data' } });
        const data6 = new DataEntity({ field: true }, metaData);
        const data7 = new DataEntity({});
        const data8 = new DataEntity({ field: validPhone1 });
        const data9 = new DataEntity({ field: validPhone2 });
        const data10 = new DataEntity({ field: notValidPhone });
        const data11 = new DataEntity({ field: notValidPhone2 });
        const data12 = new DataEntity({ field: notValidPhone3 });

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
        expect(results8).toEqual({ field: validPhone1 });
        expect(results9).toEqual({ field: validPhone2 });
        expect(results10).toEqual({});
        expect(results11).toEqual({});
        expect(results12).toEqual({});
    });
});
