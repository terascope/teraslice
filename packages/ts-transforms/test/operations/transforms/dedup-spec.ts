import { cloneDeep, DataEntity } from '@terascope/core-utils';
import { Dedup } from '../../../src/operations';

describe('Dedup operator', () => {
    it('can instantiate', () => {
        const opConfig = {
            post_process: 'dedup',
            source: 'someField',
            target: 'otherField',
            __id: 'someId',
            follow: 'otherId',
        };
        expect(() => new Dedup(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { post_process: 'dedup', target: 1324 };
        const badConfig2 = { post_process: 'dedup', target: '' };
        const badConfig3 = { post_process: 'dedup' };
        const badConfig4 = { post_process: 'dedup', fields: 1234, target: 'someField' };
        const badConfig5 = { post_process: 'dedup', fields: { first: 'first', last: 'last' }, target: 'someField' };
        // @ts-expect-error
        expect(() => new Dedup(badConfig1)).toThrow();
        // @ts-expect-error
        expect(() => new Dedup(badConfig2)).toThrow();
        // @ts-expect-error
        expect(() => new Dedup(badConfig3)).toThrow();
        // @ts-expect-error
        expect(() => new Dedup(badConfig4)).toThrow();
        // @ts-expect-error
        expect(() => new Dedup(badConfig5)).toThrow();
    });

    it('can dedup an array of values', () => {
        const opConfig = {
            post_process: 'dedup', source: 'array', target: 'array', __id: 'someId', follow: 'otherId'
        };
        const test = new Dedup(opConfig);
        const data = new DataEntity({ array: ['hello', 'hello', 'world', 'world', 'hi'] });
        const results = test.run(cloneDeep(data));

        expect(DataEntity.isDataEntity(results)).toEqual(true);
        expect(results).toEqual({ array: ['hello', 'world', 'hi'] });
    });

    it('dedup any other value will just pass it through', () => {
        const opConfig = {
            post_process: 'dedup', source: 'array', target: 'array', __id: 'someId', follow: 'otherId'
        };
        const test = new Dedup(opConfig);

        const data1 = new DataEntity({ array: 'hello' });
        const data2 = new DataEntity({ array: 342 });
        const data3 = new DataEntity({ array: { hello: 'world' } });
        const data4 = new DataEntity({ array: [] });
        const data5 = new DataEntity({ array: false });

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));
        const results5 = test.run(cloneDeep(data5));

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(results1).toEqual({ array: 'hello' });
        expect(results2).toEqual({ array: 342 });
        expect(results3).toEqual({ array: { hello: 'world' } });
        expect(results4).toEqual({ array: [] });
        expect(results5).toEqual({ array: false });
    });
});
