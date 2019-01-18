
import { Email } from '../../../src/operations';
import { DataEntity } from '@terascope/job-components';

describe('email validation', () => {

    it('can instantiate', () => {
        const opConfig = { source_field: 'someField' };
        expect(() => new Email(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { source_field: 1324 };
        const badConfig2 = { source_field: '' };
        const badConfig3 = { source_field: {} };
        const badConfig4 = {};
        // @ts-ignore
        expect(() => new Email(badConfig1)).toThrow();
        expect(() => new Email(badConfig2)).toThrow();
        // @ts-ignore
        expect(() => new Email(badConfig3)).toThrow();
        expect(() => new Email(badConfig4)).toThrow();
    });

    it('can validate boolean fields', () => {
        const opConfig = { source_field: 'uri' };
        const test =  new Email(opConfig);
        const metaData = { selectors: { 'some:query' : true } };

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

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(DataEntity.getMetadata(results1 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results1).toEqual({});
        expect(DataEntity.getMetadata(results2 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results2).toEqual({});
        expect(results3).toEqual({});
        expect(results4).toEqual({});
        expect(results5).toEqual({});
        expect(results6).toEqual({});
        expect(DataEntity.getMetadata(results6 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results7).toEqual({});
        expect(results8).toEqual({});
        expect(results9).toEqual(data9);
        expect(DataEntity.getMetadata(results9 as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results10).toEqual({});
    });

    it('can validate nested fields', async() => {
        const opConfig = { source_field: 'person.email' };
        const test =  new Email(opConfig);

        const data1 = new DataEntity({ email: 'ha3ke5@pawnage.com' });
        const data2 = new DataEntity({ person: {} });
        const data3 = new DataEntity({ person: { email: 'ha3ke5@pawnage.com' } });
        const data4 = new DataEntity({ person: { email: 'sadrasfwe32q' } });

        const results1 = test.run(data1);
        const results2 = test.run(data2);
        const results3 = test.run(data3);
        const results4 = test.run(data4);

        expect(results1).toEqual(data1);
        expect(results2).toEqual(data2);
        expect(results3).toEqual(data3);
        expect(results4).toEqual(data2);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
    });
});
