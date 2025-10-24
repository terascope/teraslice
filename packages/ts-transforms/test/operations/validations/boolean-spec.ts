import { cloneDeep } from '@terascope/core-utils';
import { DataEntity } from '@terascope/entity-utils';
import { BooleanValidation } from '../../../src/operations';

describe('boolean validation', () => {
    it('can instantiate', () => {
        const opConfig = {
            source: 'someField', target: 'someField', __id: 'someId', follow: 'otherId'
        };
        expect(() => new BooleanValidation(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source: 1324 };
        const badConfig2 = { source: '' };
        const badConfig3 = { source: {} };
        const badConfig4 = {};
        // @ts-expect-error
        expect(() => new BooleanValidation(badConfig1)).toThrow();
        // @ts-expect-error
        expect(() => new BooleanValidation(badConfig2)).toThrow();
        // @ts-expect-error
        expect(() => new BooleanValidation(badConfig3)).toThrow();
        // @ts-expect-error
        expect(() => new BooleanValidation(badConfig4)).toThrow();
    });

    it('can validate boolean fields', () => {
        const opConfig = {
            source: 'isTall', target: 'isTall', __id: 'someId', follow: 'otherId'
        };
        const test = new BooleanValidation(opConfig);
        const metaData = { selectors: { 'some:query': true } };

        const data1 = new DataEntity({ isTall: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ isTall: 123423 }, metaData);
        const data3 = new DataEntity({ isTall: '56.234' });
        const data4 = new DataEntity({ isTall: [1324] });
        const data5 = new DataEntity({ isTall: { some: 'data' } });
        const data6 = new DataEntity({ isTall: true }, metaData);
        const data7 = new DataEntity({ isTall: 'true' });
        const data8 = new DataEntity({ isTall: ['true', false, 'hello', { other: 'things ' }] });

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));
        const results5 = test.run(cloneDeep(data5));
        const results6 = test.run(cloneDeep(data6));
        const results7 = test.run(cloneDeep(data7));
        const results8 = test.run(cloneDeep(data8));

        expect(results1).toEqual(null);
        expect(results2).toEqual(null);
        expect(results3).toEqual(null);
        expect(results4).toEqual(null);
        expect(results5).toEqual(null);
        expect(results6).toEqual(data6);
        expect(results6?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results7).toEqual(data6);
        expect(results8).toEqual({ isTall: [true, false] });
    });

    it('can validate special boolean fields', () => {
        const opConfig = {
            source: 'isTall', target: 'isTall', __id: 'someId', follow: 'otherId'
        };
        const test = new BooleanValidation(opConfig);
        const metaData = { selectors: { 'some:query': true } };

        const data1 = new DataEntity({ isTall: true }, metaData);
        const data2 = new DataEntity({ isTall: 'true' }, metaData);
        const data3 = new DataEntity({ isTall: false }, metaData);
        const data4 = new DataEntity({ isTall: 'false' });
        const data5 = new DataEntity({ isTall: 1 }, metaData);
        const data6 = new DataEntity({ isTall: '1' }, metaData);
        const data7 = new DataEntity({ isTall: 0 }, metaData);
        const data8 = new DataEntity({ isTall: '0' });

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));
        const results5 = test.run(cloneDeep(data5));
        const results6 = test.run(cloneDeep(data6));
        const results7 = test.run(cloneDeep(data7));
        const results8 = test.run(cloneDeep(data8));

        const isTrue = { isTall: true };
        const isFalse = { isTall: false };

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(results1?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results1).toEqual(isTrue);
        expect(results2?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results2).toEqual(isTrue);
        expect(results3).toEqual(isFalse);
        expect(results4).toEqual(isFalse);
        expect(results5).toEqual(isTrue);
        expect(results6).toEqual(isTrue);
        expect(results6?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results7).toEqual(isFalse);
        expect(results8).toEqual(isFalse);
    });

    it('can validate nested fields', async () => {
        const opConfig = {
            source: 'person.isTall', target: 'person.isTall', __id: 'someId', follow: 'otherId'
        };
        const test = new BooleanValidation(opConfig);

        const data1 = new DataEntity({ isTall: true });
        const data2 = new DataEntity({ isTall: 'true' });
        const data3 = new DataEntity({ person: {} });
        const data4 = new DataEntity({ person: { isTall: 'true' } });
        const data5 = new DataEntity({ person: { isTall: 'sadrasfwe32q' } });

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));
        const results5 = test.run(cloneDeep(data5));

        expect(results1).toEqual(data1);
        expect(results2).toEqual(data2);
        expect(results3).toEqual(data3);
        expect(results4).toEqual({ person: { isTall: true } });
        expect(results5).toEqual(data3);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
    });
});
