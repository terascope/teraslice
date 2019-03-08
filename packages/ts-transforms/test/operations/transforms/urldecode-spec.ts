
import { UrlDecode } from '../../../src/operations';
import { DataEntity } from '@terascope/utils';

describe('urldecode operator', () => {

    it('can instantiate', () => {
        const opConfig = { target_field: 'source', source_field: 'source', __id: 'someId' };
        expect(() => new UrlDecode(opConfig)).not.toThrow();
    });

    xit('can properly throw with bad config values', () => {
        const badConfig1 = { target_field: 1324 };
        const badConfig2 = { target_field: '' };
        const badConfig3 = { target_field: {} };
        const badConfig4 = { target_field: null };
        const badConfig5 = { source_field: [] };
        const badConfig6 = { source_field: {} };
        const badConfig7 = { source_field: null };
        const badConfig8 = { source_field: '', target_field: '' };
        // @ts-ignore
        expect(() => new UrlDecode(badConfig1)).toThrow();
        // @ts-ignore
        expect(() => new UrlDecode(badConfig2)).toThrow();
        // @ts-ignore
        expect(() => new UrlDecode(badConfig3)).toThrow();
        // @ts-ignore
        expect(() => new UrlDecode(badConfig4)).toThrow();
        // @ts-ignore
        expect(() => new UrlDecode(badConfig5)).toThrow();
        // @ts-ignore
        expect(() => new UrlDecode(badConfig6)).toThrow();
        // @ts-ignore
        expect(() => new UrlDecode(badConfig7)).toThrow();
        // @ts-ignore
        expect(() => new UrlDecode(badConfig8)).toThrow();
    });

    it('can urldecode decode fields', () => {
        const opConfig = { source_field: 'source', target_field: 'source', __id: 'someId' };
        const test =  new UrlDecode(opConfig);
        const metaData = { selectors: { 'some:query' : true } };

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
        const data12 = new DataEntity({ source: ['http:// google.com?q=HELLO%20AND%20GOODBYE', 'http:// other.com?q=Some%20AND%20Things'] }, metaData);

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);
        const results5 = test.run(data5);
        const results6 = test.run(data6);
        const results7 = test.run(data7);
        const results8 = test.run(data8);
        const results9 = test.run(data9);
        const results10 = test.run(data10);
        const results11 = test.run(data11);
        const results12 = test.run(data12);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(DataEntity.getMetadata(results1 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results1).toEqual({});
        expect(DataEntity.getMetadata(results2 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results2).toEqual({});
        expect(results3).toEqual({});
        expect(results4).toEqual({});
        expect(results5).toEqual({});
        expect(results6).toEqual({});
        expect(results7).toEqual({ source: 'http:// google.com?q=HELLO AND GOODBYE' });
        expect(results8).toEqual({ source: 'ha3ke5@pawnage.com' });
        expect(results9).toEqual({ source: '::' });
        expect(results10).toEqual({ source: '193.0.0.23' });
        expect(DataEntity.getMetadata(results11 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results11).toEqual({ source: 'hello world' });
        expect(results12).toEqual({ source: ['http:// google.com?q=HELLO AND GOODBYE', 'http:// other.com?q=Some AND Things'] });
    });

    it('can urldecode decode nested fields', () => {
        const opConfig = { source_field: 'source.field', target_field: 'source.field', __id: 'someId' };
        const test =  new UrlDecode(opConfig);
        const metaData = { selectors: { 'some:query' : true } };
        const url = 'http:// localhost:9200/logstash-2018.7/_search?q=bytes:>500 AND ip:*&pretty&size=10000';
        const encodedUrl = 'http:// localhost:9200/logstash-2018.7/_search?q=bytes:%3E500%20AND%20ip:*&pretty&size=10000';
        const data = new DataEntity({ source: { field: encodedUrl } }, metaData);

        const results = test.run(data);

        expect(DataEntity.getMetadata(results as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results).toEqual({ source: { field: url } });
    });
});
