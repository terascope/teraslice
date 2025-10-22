import { DataEntity, cloneDeep } from '@terascope/core-utils';
import { Uuid } from '../../../src/operations';
import { PostProcessConfig } from '../../../src/interfaces';

describe('Uuid validation', () => {
    it('can instantiate', () => {
        const opConfig = {
            follow: 'someId', source: 'someField', target: 'someField', __id: 'someId'
        };
        expect(() => new Uuid(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source: 1324 };
        const badConfig2 = { source: '' };
        const badConfig3 = { source: {} };
        const badConfig4 = {};
        // @ts-expect-error
        expect(() => new Uuid(badConfig1)).toThrow();
        // @ts-expect-error
        expect(() => new Uuid(badConfig2)).toThrow();
        // @ts-expect-error
        expect(() => new Uuid(badConfig3)).toThrow();
        // @ts-expect-error
        expect(() => new Uuid(badConfig4)).toThrow();
    });

    it('can validate Uuid fields', () => {
        const opConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = new Uuid(opConfig);

        const metaData = { selectors: { 'some:query': true } };

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
        const data12 = new DataEntity({ field: ['1x7cw488-f4ad-4aae-a6h4-76f9td5y8635', 'a77da370-15df-11e9-b726-396c5e1cc8ce'] });

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

        expect(results1).toEqual(null);
        expect(results2).toEqual(null);
        expect(results3).toEqual(null);
        expect(results4).toEqual(null);
        expect(results5).toEqual(null);
        expect(results6).toEqual(null);
        expect(results7).toEqual(null);
        expect(results8).toEqual({ field: '1c7ce488-f4ad-4aae-a6f4-76f9cd5c8635' });
        expect(results9).toEqual({ field: 'a77da370-15df-11e9-b726-396c5e1cc8ce' });
        expect(results10).toEqual(null);
        expect(results11).toEqual(null);
        expect(results12).toEqual({ field: ['a77da370-15df-11e9-b726-396c5e1cc8ce'] });
    });

    it('can normailize the data', () => {
        const opConfig = {
            follow: 'someId', source: 'field', target: 'field', __id: 'someId'
        };
        const test = new Uuid(opConfig);

        const opConfig2: PostProcessConfig = {
            follow: 'someId',
            source: 'field',
            target: 'field',
            case: 'uppercase',
            __id: 'someId',
        };
        const test2 = new Uuid(opConfig2);

        const data = ['1c7ce488-f4ad-4aae-a6f4-76f9cd5c8635', '1c7ce488-f4ad-4aae-a6f4-76f9cd5c8635'];

        const dataLowerCase = data.map((uuid) => new DataEntity({ field: uuid }));
        const dataUpperCase = data.map((uuid) => new DataEntity({ field: uuid.toUpperCase() }));

        const results1 = test.run(cloneDeep(dataLowerCase[0]));
        const results2 = test.run(cloneDeep(dataLowerCase[1]));
        const results3 = test.run(cloneDeep(dataUpperCase[0]));
        const results4 = test.run(cloneDeep(dataUpperCase[1]));
        const results5 = test2.run(cloneDeep(dataLowerCase[0]));
        const results6 = test2.run(cloneDeep(dataLowerCase[1]));
        const results7 = test2.run(cloneDeep(dataUpperCase[0]));
        const results8 = test2.run(cloneDeep(dataUpperCase[1]));

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
