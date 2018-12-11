
const { Email } = require('../../../dist/lib/operations');
const { DataEntity } = require ('@terascope/job-components');

describe('email validation', () => {
   
    it('can instantiate', () => {
        const opConfig = { target_field: 'someField' };
        expect(() => new Email(opConfig)).not.toThrow()
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { target_field: 1324 };
        const badConfig2 = { target_field: "" };
        const badConfig3 = { target_field: {} };
        const badConfig4 = {};

        expect(() => new Email(badConfig1)).toThrow();
        expect(() => new Email(badConfig2)).toThrow();
        expect(() => new Email(badConfig3)).toThrow();
        expect(() => new Email(badConfig4)).toThrow();
    });

    it('can and deal with null', () => {
        const opConfig = { target_field: 'someField' };
        const test =  new Email(opConfig);
        const results = test.run(null);

        expect(results).toEqual(null);
    });

    it('can validate boolean fields', () => {
        const opConfig = { target_field: 'uri' };
        const test =  new Email(opConfig);
        const metaData = { selectors: { 'some:query' : true } };

        const data1 = new DataEntity({ uri: '56.234,95.234' }, metaData);
        const data2 = new DataEntity({ uri: 123423 }, metaData);
        const data3 = new DataEntity({ uri: '56.234' });
        const data4 = new DataEntity({ uri: [1324] });
        const data5 = new DataEntity({ uri: { some: 'data' } });
        const data6 = new DataEntity({ uri: true }, metaData);
        const data7 = new DataEntity({});
        const data8 = new DataEntity({ uri: 'http://google.com '});
        const data9 = new DataEntity({ uri: 'ha3ke5@pawnage.com'}, metaData);
        const data10 = new DataEntity({ uri: 'asdfasdf'});


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
        expect(DataEntity.getMetadata(results1).selectors).toEqual(metaData.selectors)
        expect(results1).toEqual({});
        expect(DataEntity.getMetadata(results2).selectors).toEqual(metaData.selectors)
        expect(results2).toEqual({});
        expect(results3).toEqual({});
        expect(results4).toEqual({});
        expect(results5).toEqual({});
        expect(results6).toEqual({});
        expect(DataEntity.getMetadata(results6).selectors).toEqual(metaData.selectors)
        expect(results7).toEqual({});
        expect(results8).toEqual({});
        expect(results9).toEqual(data9);
        expect(DataEntity.getMetadata(results9).selectors).toEqual(metaData.selectors)
        expect(results10).toEqual({});
    });
});