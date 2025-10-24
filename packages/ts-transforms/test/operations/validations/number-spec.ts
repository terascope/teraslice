import { cloneDeep } from '@terascope/core-utils';
import { DataEntity } from '@terascope/entity-utils';
import { NumberValidation } from '../../../src/operations';

describe('number validation', () => {
    it('can instantiate', () => {
        const opConfig = {
            source: 'someField', target: 'someField', __id: 'someId', follow: 'otherId'
        };
        expect(() => new NumberValidation(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source: 1324 };
        const badConfig2 = { source: '' };
        const badConfig3 = { source: {} };
        const badConfig4 = {};
        // @ts-expect-error
        expect(() => new NumberValidation(badConfig1)).toThrow();
        // @ts-expect-error
        expect(() => new NumberValidation(badConfig2)).toThrow();
        // @ts-expect-error
        expect(() => new NumberValidation(badConfig3)).toThrow();
        // @ts-expect-error
        expect(() => new NumberValidation(badConfig4)).toThrow();
    });

    it('can validate number fields', () => {
        const opConfig = {
            source: 'bytes', target: 'bytes', __id: 'someId', follow: 'otherId'
        };
        const test = new NumberValidation(opConfig);
        const metaData = { selectors: { 'some:query': true } };

        const data1 = new DataEntity({ bytes: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ bytes: 123423 }, metaData);
        const data3 = new DataEntity({ bytes: '56.234' });
        const data4 = new DataEntity({ bytes: [1324] });
        const data5 = new DataEntity({ bytes: { some: 'data' } });
        const data6 = new DataEntity({ bytes: true });
        const data7 = new DataEntity({});

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));
        const results5 = test.run(cloneDeep(data5));
        const results6 = test.run(cloneDeep(data6));
        const results7 = test.run(cloneDeep(data7));

        expect(results1).toEqual(null);
        expect(results2).toEqual(data2);
        expect(results3).toEqual({ bytes: 56.234 });
        expect(results4).toEqual({ bytes: [1324] });
        expect(results5).toEqual(null);
        expect(results6).toEqual(null);
        expect(results7).toEqual(null);
    });

    it('can validate nested fields', async () => {
        const opConfig = {
            source: 'file.bytes', target: 'file.bytes', __id: 'someId', follow: 'otherId'
        };
        const test = new NumberValidation(opConfig);

        const data1 = new DataEntity({ file: 'something' });
        const data2 = new DataEntity({ file: {} });
        const data3 = new DataEntity({ file: { bytes: '123423' } });
        const data4 = new DataEntity({ file: { bytes: 432423 } });
        const data5 = new DataEntity({ file: { bytes: 'sadrasfwe32q' } });

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));
        const results5 = test.run(cloneDeep(data5));

        expect(results1).toEqual(data1);
        expect(results2).toEqual(data2);
        expect(results3).toEqual({ file: { bytes: 123423 } });
        expect(results4).toEqual(data4);
        expect(results5).toEqual(data2);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
    });

    it('can convert the field', async () => {
        const opConfig = {
            source: 'file.bytes', target: 'file.bytes', __id: 'someId', follow: 'otherId'
        };
        const test = new NumberValidation(opConfig);

        const data1 = new DataEntity({ file: { bytes: 123423 } });
        const data2 = new DataEntity({ file: { bytes: '123423' } });

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));

        const answer = { file: { bytes: 123423 } };

        expect(results1).toEqual(answer);
        expect(results2).toEqual(answer);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
    });
});
