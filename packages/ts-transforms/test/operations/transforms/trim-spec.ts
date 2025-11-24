import { cloneDeep, DataEntity } from '@terascope/core-utils';
import { Trim } from '../../../src/operations';

describe('transform operator', () => {
    it('can instantiate', () => {
        const opConfig = {
            target: 'someField', source: 'someField', __id: 'someId', follow: 'otherId'
        };
        expect(() => new Trim(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source: 1324 };
        const badConfig2 = { target: [] };
        const badConfig3 = { source: false, target: 'someField' };
        const badConfig4 = {};
        // @ts-expect-error
        expect(() => new Trim(badConfig1)).toThrow();
        // @ts-expect-error
        expect(() => new Trim(badConfig2)).toThrow();
        // @ts-expect-error
        expect(() => new Trim(badConfig3)).toThrow();
        // @ts-expect-error
        expect(() => new Trim(badConfig4)).toThrow();
    });

    it('can transform strings to Trim', () => {
        const opConfig = {
            source: 'someField', target: 'someField', __id: 'someId', follow: 'otherId'
        };
        const test = new Trim(opConfig);

        const data1 = new DataEntity({ someField: ' 56.234,95.234 ' });
        const data2 = new DataEntity({});
        const data3 = new DataEntity({ someField: '    data' });
        const data4 = new DataEntity({ someField: { some: 'data' } });
        const data5 = new DataEntity({ someField: false });
        const data6 = new DataEntity({ someField: 'other      ' });
        const data7 = new DataEntity({ sideField: 'data' });
        const data8 = new DataEntity({ someField: ['     other     ', 'data'] });

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));
        const results5 = test.run(cloneDeep(data5));
        const results6 = test.run(cloneDeep(data6));
        const results7 = test.run(cloneDeep(data7));
        const results8 = test.run(cloneDeep(data8));

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(results1).toEqual({ someField: '56.234,95.234' });
        expect(results2).toEqual(null);
        expect(results3).toEqual({ someField: 'data' });
        expect(results4).toEqual(null);
        expect(results5).toEqual(null);
        expect(results6).toEqual({ someField: 'other' });
        expect(results7).toEqual({ sideField: 'data' });
        expect(results8).toEqual({ someField: ['other', 'data'] });
    });
});
