import { cloneDeep } from '@terascope/core-utils';
import { DataEntity } from '@terascope/entity-utils';
import { Url as UrlOp } from '../../../src/operations';

describe('url validation', () => {
    it('can instantiate', () => {
        const opConfig = {
            source: 'someField', target: 'someField', __id: 'someId', follow: 'otherId'
        };
        expect(() => new UrlOp(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source: 1324 };
        const badConfig2 = { source: '' };
        const badConfig3 = { source: {} };
        const badConfig4 = {};
        // @ts-expect-error
        expect(() => new UrlOp(badConfig1)).toThrow();
        // @ts-expect-error
        expect(() => new UrlOp(badConfig2)).toThrow();
        // @ts-expect-error
        expect(() => new UrlOp(badConfig3)).toThrow();
        // @ts-expect-error
        expect(() => new UrlOp(badConfig4)).toThrow();
    });

    it('can validate url fields', () => {
        const opConfig = {
            source: 'uri', target: 'uri', __id: 'someId', follow: 'otherId'
        };
        const test = new UrlOp(opConfig);
        const metaData = { selectors: { 'some:query': true } };

        const data1 = new DataEntity({ uri: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ uri: 123423 }, metaData);
        const data3 = new DataEntity({ uri: '56.234' });
        const data4 = new DataEntity({ uri: [1324] });
        const data5 = new DataEntity({ uri: { some: 'data' } });
        const data6 = new DataEntity({ uri: true }, metaData);
        const data7 = new DataEntity({});
        const data8 = new DataEntity({ uri: 'http://google.com ' });
        const data9 = new DataEntity({ uri: 'google.com ' });
        const data10 = new DataEntity({ uri: 'google.com?some=key ' });
        const data11 = new DataEntity({ uri: [1324, 'http://google.com '] });

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

        expect(results1).toEqual(null);
        expect(results2).toEqual(null);
        expect(results3).toEqual(null);
        expect(results4).toEqual(null);
        expect(results5).toEqual(null);
        expect(results6).toEqual(null);
        expect(results7).toEqual(null);
        expect(results8).toEqual({ uri: 'http://google.com' });
        expect(results9).toEqual(null);
        expect(results10).toEqual(null);
        expect(results11).toEqual({ uri: ['http://google.com'] });
    });

    it('can validate nested fields', async () => {
        const opConfig = {
            refs: 'someId',
            source: 'event.href',
            target: 'event.href',
            length: 14,
            __id: 'someId',
            follow: 'otherId',
        };
        const test = new UrlOp(opConfig);

        const data1 = new DataEntity({ event: 'something' });
        const data2 = new DataEntity({ event: {} });
        const data3 = new DataEntity({ event: { href: '123423' } });
        const data4 = new DataEntity({ event: { href: 432423 } });
        const data5 = new DataEntity({ event: { href: 'http://google.com' } });

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));
        const results5 = test.run(cloneDeep(data5));

        expect(results1).toEqual(data1);
        expect(results2).toEqual(data2);
        expect(results3).toEqual(data2);
        expect(results4).toEqual(data2);
        expect(results5).toEqual(data5);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
    });
});
