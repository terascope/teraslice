import { cloneDeep, DataEntity } from '@terascope/core-utils';
import { Email } from '../../../src/operations';

describe('email validation', () => {
    it('can instantiate', () => {
        const opConfig = {
            source: 'someField', target: 'someField', __id: 'someId', follow: 'otherId'
        };
        expect(() => new Email(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source: 1324 };
        const badConfig2 = { source: '' };
        const badConfig3 = { source: {} };
        const badConfig4 = {};
        // @ts-expect-error
        expect(() => new Email(badConfig1)).toThrow();
        // @ts-expect-error
        expect(() => new Email(badConfig2)).toThrow();
        // @ts-expect-error
        expect(() => new Email(badConfig3)).toThrow();
        // @ts-expect-error
        expect(() => new Email(badConfig4)).toThrow();
    });

    it('can validate email fields', () => {
        const opConfig = {
            source: 'uri', target: 'uri', __id: 'someId', follow: 'otherId'
        };
        const test = new Email(opConfig);
        const metaData = { selectors: { 'some:query': true } };

        const data1 = new DataEntity({ uri: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ uri: 123423 }, metaData);
        const data3 = new DataEntity({ uri: '56.234' });
        const data4 = new DataEntity({ uri: [1324] });
        const data5 = new DataEntity({ uri: { some: 'data' } });
        const data6 = new DataEntity({ uri: true }, metaData);
        const data7 = new DataEntity({});
        const data8 = new DataEntity({ uri: 'http:// google.com ' });
        const data9 = new DataEntity({ uri: 'ha3ke5@pawnage.com' }, metaData);
        const data10 = new DataEntity({ uri: 'asdfasdf' });
        const data11 = new DataEntity({ uri: 'SOMEWORDS@HELLO.COM' });
        const data12 = new DataEntity({
            uri: ['SOMEWORDS@HELLO.COM', 'http:// google.com', 12342, { other: 'stuff' }, 'other@somewhere.com'],
        });

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
        expect(results7).toEqual(null);
        expect(results8).toEqual(null);
        expect(results9).toEqual(data9);
        expect(results9?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results10).toEqual(null);
        expect(results11).toEqual(data11);
        expect(results12).toEqual({ uri: ['SOMEWORDS@HELLO.COM', 'other@somewhere.com'] });
    });

    it('can validate nested fields', async () => {
        const opConfig = {
            source: 'person.email', target: 'person.email', __id: 'someId', follow: 'otherId'
        };
        const test = new Email(opConfig);

        const data1 = new DataEntity({ email: 'ha3ke5@pawnage.com' });
        const data2 = new DataEntity({ person: {} });
        const data3 = new DataEntity({ person: { email: 'ha3ke5@pawnage.com' } });
        const data4 = new DataEntity({ person: { email: 'sadrasfwe32q' } });

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));

        expect(results1).toEqual(data1);
        expect(results2).toEqual(data2);
        expect(results3).toEqual(data3);
        expect(results4).toEqual(data2);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
    });

    it('can validate uncommon email fields', () => {
        const opConfig = {
            source: 'uri', target: 'uri', __id: 'someId', follow: 'otherId'
        };
        const test = new Email(opConfig);
        const metaData = { selectors: { 'some:query': true } };

        const data1 = new DataEntity({ uri: 'user@blah@blah.com' }, metaData);
        const data2 = new DataEntity({ uri: 'junk user@blah.com' }, metaData);
        const data3 = new DataEntity({ uri: 'user@blah.com/junk.morejunk' }, metaData);
        const data4 = new DataEntity({ uri: 'user@blah.com&value=junk' }, metaData);
        const data5 = new DataEntity({ uri: 'user@blah.com/junk.junk?a=<tag value="junk"' }, metaData);

        const results1 = test.run(cloneDeep(data1));
        const results2 = test.run(cloneDeep(data2));
        const results3 = test.run(cloneDeep(data3));
        const results4 = test.run(cloneDeep(data4));
        const results5 = test.run(cloneDeep(data5));

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(results1?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results1).toEqual({ uri: 'user@blah@blah.com' });

        expect(DataEntity.isDataEntity(results2)).toEqual(true);
        expect(results2?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results2).toEqual({ uri: 'junk user@blah.com' });

        expect(DataEntity.isDataEntity(results3)).toEqual(true);
        expect(results3?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results3).toEqual({ uri: 'user@blah.com/junk.morejunk' });

        expect(DataEntity.isDataEntity(results4)).toEqual(true);
        expect(results4?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results4).toEqual({ uri: 'user@blah.com&value=junk' });

        expect(DataEntity.isDataEntity(results5)).toEqual(true);
        expect(results5?.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results5).toEqual({ uri: 'user@blah.com/junk.junk?a=<tag value="junk"' });
    });
});
