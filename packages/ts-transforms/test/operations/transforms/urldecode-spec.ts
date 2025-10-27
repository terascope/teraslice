import { cloneDeep, DataEntity } from '@terascope/core-utils';
import { UrlDecode } from '../../../src/operations';

describe('urldecode operator', () => {
    it('can instantiate', () => {
        const opConfig = {
            target: 'source', source: 'source', __id: 'someId', follow: 'otherId'
        };
        expect(() => new UrlDecode(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { target: 1324 };
        const badConfig2 = { target: '' };
        const badConfig3 = { target: {} };
        const badConfig4 = { target: null };
        const badConfig5 = { source: [] };
        const badConfig6 = { source: {} };
        const badConfig7 = { source: null };
        const badConfig8 = { source: '', target: '' };
        // @ts-expect-error
        expect(() => new UrlDecode(badConfig1)).toThrow();
        // @ts-expect-error
        expect(() => new UrlDecode(badConfig2)).toThrow();
        // @ts-expect-error
        expect(() => new UrlDecode(badConfig3)).toThrow();
        // @ts-expect-error
        expect(() => new UrlDecode(badConfig4)).toThrow();
        // @ts-expect-error
        expect(() => new UrlDecode(badConfig5)).toThrow();
        // @ts-expect-error
        expect(() => new UrlDecode(badConfig6)).toThrow();
        // @ts-expect-error
        expect(() => new UrlDecode(badConfig7)).toThrow();
        // @ts-expect-error
        expect(() => new UrlDecode(badConfig8)).toThrow();
    });

    it('can urldecode decode fields', () => {
        const opConfig = {
            source: 'source', target: 'source', __id: 'someId', follow: 'otherId'
        };
        const test = new UrlDecode(opConfig);
        const metaData = { selectors: { 'some:query': true } };

        const data1 = new DataEntity({ source: 123423 }, metaData);
        const data2 = new DataEntity({ source: null }, metaData);
        const data3 = new DataEntity({ source: [1324] });
        const data4 = new DataEntity({ source: { some: 'data' } });
        const data5 = new DataEntity({ source: true }, metaData);
        const data6 = new DataEntity({});
        const data7 = new DataEntity({ source: 'http:// google.com?q=HELLO%20AND%20GOODBYE' });
        const data8 = new DataEntity({ source: 'ha3ke5@pawnage.com' }, metaData);
        const data9 = new DataEntity({ source: '::' });
        const data10 = new DataEntity({ source: '193.0.0.23' }, metaData);
        const data11 = new DataEntity({ source: 'hello world' }, metaData);
        const data12 = new DataEntity(
            { source: ['http:// google.com?q=HELLO%20AND%20GOODBYE', 'http:// other.com?q=Some%20AND%20Things'] },
            metaData
        );

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
        expect(results7).toEqual({ source: 'http:// google.com?q=HELLO AND GOODBYE' });
        expect(results8).toEqual({ source: 'ha3ke5@pawnage.com' });
        expect(results9).toEqual({ source: '::' });
        expect(results10).toEqual({ source: '193.0.0.23' });
        expect(results11?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results11).toEqual({ source: 'hello world' });
        expect(results12).toEqual({ source: ['http:// google.com?q=HELLO AND GOODBYE', 'http:// other.com?q=Some AND Things'] });
    });

    it('can urldecode decode nested fields', () => {
        const opConfig = {
            source: 'source.field', target: 'source.field', __id: 'someId', follow: 'otherId'
        };
        const test = new UrlDecode(opConfig);
        const metaData = { selectors: { 'some:query': true } };
        const url = 'http:// localhost:9200/logstash-2018.7/_search?q=bytes:>500 AND ip:*&pretty&size=10000';
        const encodedUrl = 'http:// localhost:9200/logstash-2018.7/_search?q=bytes:%3E500%20AND%20ip:*&pretty&size=10000';
        const data = new DataEntity({ source: { field: encodedUrl } }, metaData);

        const results = test.run(cloneDeep(data));

        expect(results?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results).toEqual({ source: { field: url } });
    });
});
