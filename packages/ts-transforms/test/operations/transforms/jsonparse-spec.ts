
import { JsonParse } from '../../../src/operations';
import { DataEntity } from '@terascope/utils';

describe('transform operator', () => {

    it('can instantiate', () => {
        const opConfig = { target_field: 'someField', source_field: 'someField', __id: 'someId' };
        expect(() => new JsonParse(opConfig)).not.toThrow();
    });

    xit('can properly throw with bad config values', () => {
        const badConfig1 = { source_field: 1324 };
        const badConfig2 = { target_field: [] };
        const badConfig3 = { source_field: false, target_field: 'someField' };
        const badConfig4 = {};
        // @ts-ignore
        expect(() => new JsonParse(badConfig1)).toThrow();
        // @ts-ignore
        expect(() => new JsonParse(badConfig2)).toThrow();
        // @ts-ignore
        expect(() => new JsonParse(badConfig3)).toThrow();
        // @ts-ignore
        expect(() => new JsonParse(badConfig4)).toThrow();
    });

    it('can parse json data', () => {
        const opConfig = { source_field: 'someField', target_field: 'someField', __id: 'someId' };
        const test = new JsonParse(opConfig);

        const data1 = new DataEntity({ someField: JSON.stringify('56.234,95.234') });
        const data2 = new DataEntity({});
        const data3 = new DataEntity({ someField: JSON.stringify('data') });
        const data4 = new DataEntity({ someField: JSON.stringify({ some: 'data' }) });
        const data5 = new DataEntity({ someField: JSON.stringify(false) });
        const data6 = new DataEntity({ someField: JSON.stringify('other') });
        const data7 = new DataEntity({ sideField: 'data' });
        const data8 = new DataEntity({ someField: [JSON.stringify('other'), JSON.stringify('data')] });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);
        const results8 = test.run(data8);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(results1).toEqual({ someField: '56.234,95.234' });
        expect(results2).toEqual({});
        expect(results3).toEqual({ someField: 'data' });
        expect(results4).toEqual({ someField: { some: 'data' } });
        expect(results5).toEqual({ someField: false });
        expect(results6).toEqual({ someField: 'other' });
        expect(results7).toEqual({ sideField: 'data' });
        expect(results8).toEqual({ someField: ['other', 'data'] });
    });

});
