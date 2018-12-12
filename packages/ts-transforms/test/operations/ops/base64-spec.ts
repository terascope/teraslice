
import { Base64Decode } from '../../../src/operations';
import { DataEntity } from '@terascope/job-components';

describe('base64 operation', () => {

    function encode(str: string) {
        const buff = Buffer.from(str);
        return buff.toString('base64');
    }
   
    it('can instantiate', () => {
        const opConfig = { target_field: 'final', source_field: 'source' };
        expect(() => new Base64Decode(opConfig)).not.toThrow()
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { target_field: 1324 };
        const badConfig2 = { target_field: "" };
        const badConfig3 = { target_field: {} };
        const badConfig4 = { target_field: null };
        const badConfig5 = { source_field: [] };
        const badConfig6 = { source_field: {} };
        const badConfig7 = { source_field: null };
        const badConfig8 = { source_field: '', target_field: '' };
        //@ts-ignore
        expect(() => new Base64Decode(badConfig1)).toThrow();
        expect(() => new Base64Decode(badConfig2)).toThrow();
        //@ts-ignore
        expect(() => new Base64Decode(badConfig3)).toThrow();
        //@ts-ignore
        expect(() => new Base64Decode(badConfig4)).toThrow();
        //@ts-ignore
        expect(() => new Base64Decode(badConfig5)).toThrow();
        //@ts-ignore
        expect(() => new Base64Decode(badConfig6)).toThrow();
        //@ts-ignore
        expect(() => new Base64Decode(badConfig7)).toThrow();
        expect(() => new Base64Decode(badConfig8)).toThrow();
    });

    it('can and deal with null', () => {
        const opConfig = { target_field: 'final', source_field: 'source' };
        const test =  new Base64Decode(opConfig);
        const results = test.run(null);

        expect(results).toEqual(null);
    });

    it('can base64 decode fields', () => {
        const opConfig = { target_field: 'final', source_field: 'source' };
        const test =  new Base64Decode(opConfig);
        const metaData = { selectors: { 'some:query' : true } };

        const data1 = new DataEntity({ source: 123423 }, metaData);
        const data2 = new DataEntity({ source: null }, metaData);
        const data3 = new DataEntity({ source: [1324] });
        const data4 = new DataEntity({ source: { some: 'data' } });
        const data5 = new DataEntity({ source: true }, metaData);
        const data6 = new DataEntity({});
        const data7 = new DataEntity({ source: encode('http://google.com') });
        const data8 = new DataEntity({ source: encode('ha3ke5@pawnage.com')}, metaData);
        const data9 = new DataEntity({ source: encode('::') });
        const data10 = new DataEntity({ source: encode('193.0.0.23') }, metaData);
        const data11 = new DataEntity({ source: encode("hello world") }, metaData);

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

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(DataEntity.getMetadata(results1 as DataEntity, 'selectors')).toEqual(metaData.selectors)
        expect(results1).toEqual({});
        expect(DataEntity.getMetadata(results2 as DataEntity, 'selectors')).toEqual(metaData.selectors)
        expect(results2).toEqual({});
        expect(results3).toEqual({});
        expect(results4).toEqual({});
        expect(results5).toEqual({});
        expect(results6).toEqual({});
        expect(results7).toEqual({ final: 'http://google.com', source: encode('http://google.com') });
        expect(results8).toEqual({ final: 'ha3ke5@pawnage.com', source: encode('ha3ke5@pawnage.com') });
        expect(results9).toEqual({ final: '::' , source: encode('::') });
        expect(results10).toEqual({ final: '193.0.0.23', source: encode('193.0.0.23') });
        expect(DataEntity.getMetadata(results11 as DataEntity, 'selectors')).toEqual(metaData.selectors)
        expect(results11).toEqual({ final: 'hello world', source: encode('hello world')});
    });

    it('can base64 decode fields and remove source', () => {
        const opConfig = { target_field: 'final', source_field: 'source', remove_source: true };
        const test =  new Base64Decode(opConfig);
        const metaData = { selectors: { 'some:query' : true } };

        const data = new DataEntity({ source: encode("hello world") }, metaData);

        const results = test.run(data);

        expect(DataEntity.getMetadata(results as DataEntity, 'selectors')).toEqual(metaData.selectors)
        expect(results).toEqual({ final: 'hello world' });
    });
});