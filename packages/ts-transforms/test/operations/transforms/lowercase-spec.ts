
import { Lowercase } from '../../../src/operations';
import { DataEntity } from '@terascope/utils';

describe('transform operator', () => {

    it('can instantiate', () => {
        const opConfig = { target_field: 'someField', source_field: 'someField' };
        expect(() => new Lowercase(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source_field: 1324 };
        const badConfig2 = { target_field: [] };
        const badConfig3 = { source_field: false, target_field: 'someField' };
        const badConfig4 = {};
        // @ts-ignore
        expect(() => new Lowercase(badConfig1)).toThrow();
        // @ts-ignore
        expect(() => new Lowercase(badConfig2)).toThrow();
        // @ts-ignore
        expect(() => new Lowercase(badConfig3)).toThrow();
        // @ts-ignore
        expect(() => new Lowercase(badConfig4)).toThrow();
    });

    it('can transform strings to lowercase', () => {
        const opConfig = { source_field: 'someField' };
        const test = new Lowercase(opConfig);

        const data1 = new DataEntity({ someField: '56.234,95.234' });
        const data2 = new DataEntity({});
        const data3 = new DataEntity({ someField: 'DATA' });
        const data4 = new DataEntity({ someField: { some: 'data' } });
        const data5 = new DataEntity({ someField: false });
        const data6 = new DataEntity({ someField: 'otHer' });
        const data7 = new DataEntity({ sideField: 'data' });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(results1).toEqual({ someField: '56.234,95.234' });
        expect(results2).toEqual({});
        expect(results3).toEqual({ someField: 'data' });
        expect(results4).toEqual({ });
        expect(results5).toEqual({});
        expect(results6).toEqual({ someField: 'other' });
        expect(results7).toEqual({ sideField: 'data' });
    });

    it('can transform strings to lowercase to another field', () => {
        const opConfig = { source_field: 'someField', target_field: 'otherField' };
        const test = new Lowercase(opConfig);

        const data1 = new DataEntity({ someField: '56.234,95.234' });
        const data2 = new DataEntity({});
        const data3 = new DataEntity({ someField: 'DATA' });
        const data4 = new DataEntity({ someField: { some: 'data' } });
        const data5 = new DataEntity({ someField: false });
        const data6 = new DataEntity({ someField: 'otHer' });
        const data7 = new DataEntity({ sideField: 'data' });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(results1).toEqual({ otherField: '56.234,95.234' });
        expect(results2).toEqual({});
        expect(results3).toEqual({ otherField: 'data' });
        expect(results4).toEqual({ });
        expect(results5).toEqual({});
        expect(results6).toEqual({ otherField: 'other' });
        expect(results7).toEqual({ sideField: 'data' });
    });
});
