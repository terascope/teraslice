import { cloneDeep } from '@terascope/core-utils';
import { DataEntity } from '@terascope/entity-utils';
import { ISDN } from '../../../src/operations';

describe('phone number validation', () => {
    it('can instantiate', () => {
        const opConfig = {
            refs: 'someId', source: 'someField', target: 'targeteField', __id: 'someId', follow: 'otherId'
        };
        expect(() => new ISDN(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source: 1324 };
        const badConfig2 = { source: '' };
        const badConfig3 = { source: {} };
        const badConfig4 = {};
        // @ts-expect-error
        expect(() => new ISDN(badConfig1)).toThrow();
        // @ts-expect-error
        expect(() => new ISDN(badConfig2)).toThrow();
        // @ts-expect-error
        expect(() => new ISDN(badConfig3)).toThrow();
        // @ts-expect-error
        expect(() => new ISDN(badConfig4)).toThrow();
    });

    it('can validate phone number fields', () => {
        const opConfig = {
            refs: 'someId', source: 'field', target: 'field', __id: 'someId', follow: 'otherId'
        };
        const test = new ISDN(opConfig);
        const metaData = { selectors: { 'some:query': true } };
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
        const data13 = new DataEntity({ field: [validPhone1, notValidPhone3, 1234, { other: 'things' }] });

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));
        const results5 = test.run(cloneDeep(data5));
        const results6 = test.run(cloneDeep(data6));
        const results7 = test.run(cloneDeep(data7));
        const results8 = test.run(cloneDeep(data8));
        const results9 = test.run(cloneDeep(data9));
        const results10 = test.run(cloneDeep(data10));
        const results11 = test.run(cloneDeep(data11));
        const results12 = test.run(cloneDeep(data12));
        const results13 = test.run(cloneDeep(data13));

        expect(results1).toEqual(null);
        expect(results2).toEqual(null);
        expect(results3).toEqual(null);
        expect(results4).toEqual(null);
        expect(results5).toEqual(null);
        expect(results6).toEqual(null);
        expect(results7).toEqual(null);
        expect(results8).toEqual({ field: validPhone1 });
        expect(results9).toEqual({ field: validPhone1 });
        expect(results10).toEqual(null);
        expect(results11).toEqual(null);
        expect(results12).toEqual(null);
        expect(results13).toEqual({ field: [validPhone1] });
    });
});
