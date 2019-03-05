
import { Base64Decode } from '../../../src/operations';
import { DataEntity } from '@terascope/utils';

describe('base64 operator', () => {

    function encode(str: string) {
        return Buffer.from(str).toString('base64');
    }

    it('can instantiate', () => {
        const opConfig = { target_field: 'final', source_field: 'source', __id: 'someId' };
        expect(() => new Base64Decode(opConfig)).not.toThrow();
    });

    xit('can properly throw with bad config values', () => {
        const badConfig1 = { target_field: 1324, __id: 'someId' };
        const badConfig2 = { target_field: '', __id: 'someId' };
        const badConfig3 = { target_field: {}, __id: 'someId' };
        const badConfig4 = { target_field: null , __id: 'someId' };
        const badConfig5 = { source_field: [], __id: 'someId' };
        const badConfig6 = { source_field: {}, __id: 'someId' };
        const badConfig7 = { source_field: null, __id: 'someId' };
        const badConfig8 = { source_field: '', target_field: '', __id: 'someId' };
        // @ts-ignore
        expect(() => new Base64Decode(badConfig1)).toThrow();
        expect(() => new Base64Decode(badConfig2)).toThrow();
        // @ts-ignore
        expect(() => new Base64Decode(badConfig3)).toThrow();
        // @ts-ignore
        expect(() => new Base64Decode(badConfig4)).toThrow();
        // @ts-ignore
        expect(() => new Base64Decode(badConfig5)).toThrow();
        // @ts-ignore
        expect(() => new Base64Decode(badConfig6)).toThrow();
        // @ts-ignore
        expect(() => new Base64Decode(badConfig7)).toThrow();
        expect(() => new Base64Decode(badConfig8)).toThrow();
    });

    it('can base64 decode fields', () => {
        const opConfig = { source_field: 'source', target_field: 'source', __id: 'someId' };
        const test =  new Base64Decode(opConfig);
        const metaData = { selectors: { 'some:query' : true } };

        const data1 = new DataEntity({ source: 123423 }, metaData);
        const data2 = new DataEntity({ source: null }, metaData);
        const data3 = new DataEntity({ source: [1324] });
        const data4 = new DataEntity({ source: { some: 'data' } });
        const data5 = new DataEntity({ source: true }, metaData);
        const data6 = new DataEntity({});
        const data7 = new DataEntity({ source: encode('http:// google.com') });
        const data8 = new DataEntity({ source: encode('ha3ke5@pawnage.com') }, metaData);
        const data9 = new DataEntity({ source: encode('::') });
        const data10 = new DataEntity({ source: encode('193.0.0.23') }, metaData);
        const data11 = new DataEntity({ source: encode('hello world') }, metaData);
        const data12 = new DataEntity({ source: [encode('hello world'),  encode('other things')] }, metaData);

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
        expect(results7).toEqual({ source: 'http:// google.com' });
        expect(results8).toEqual({ source: 'ha3ke5@pawnage.com' });
        expect(results9).toEqual({ source: '::' });
        expect(results10).toEqual({ source: '193.0.0.23' });
        expect(DataEntity.getMetadata(results11 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results11).toEqual({ source: 'hello world' });
        expect(results12).toEqual({ source: ['hello world', 'other things'] });
    });

    it('can base64 decode nested fields', () => {
        const opConfig = { source_field: 'source.field', target_field: 'source.field', __id: 'someId' };
        const test =  new Base64Decode(opConfig);
        const metaData = { selectors: { 'some:query' : true } };

        const data = new DataEntity({ source: { field: encode('hello world') } }, metaData);

        const results = test.run(data);

        expect(DataEntity.getMetadata(results as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results).toEqual({ source: { field: 'hello world' } });
    });
});
