
const { Join } = require('../../../asset/src/transform/lib/operations');
const { DataEntity } = require ('@terascope/job-components');

xdescribe('join operator', () => {

    it('can instantiate', () => {
        const opConfig = { fields: ['first', 'last'], target_field: 'someField' };
        expect(() => new Join(opConfig)).not.toThrow()
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { fields: ['first', 'last'], target_field: 1324 };
        const badConfig2 = { fields: ['first', 'last'], target_field: "" };
        const badConfig3 = { fields: ['first', 'last'] };
        const badConfig4 = { fields: 1234 , target_field: 'someField' };
        const badConfig5 = { fields: ['first'], target_field: 'someField' };
        const badConfig6 = { fields: {first: 'first', last:'last' }, target_field: 'someField' };
        const badConfig7 = { fields: ['first', 'last'], target_field: 'someField', delimiter: 1324 };

        expect(() => new Join(badConfig1)).toThrow();
        expect(() => new Join(badConfig2)).toThrow();
        expect(() => new Join(badConfig3)).toThrow();
        expect(() => new Join(badConfig4)).toThrow();
        expect(() => new Join(badConfig5)).toThrow();
        expect(() => new Join(badConfig6)).toThrow();
        expect(() => new Join(badConfig7)).toThrow();
    });

    it('can and deal with null', () => {
        const opConfig = { fields: ['first', 'last'], target_field: 'someField' };
        const test =  new Join(opConfig);
        const results = test.run(null);

        expect(results).toEqual(null);
    });

    it('can join fields of data entities', () => {
        const opConfig = { fields: ['first', 'last'], target_field: 'full' };
        const test =  new Join(opConfig);
        const data = new DataEntity({ first: 'John', last: 'Doe' })
        const results = test.run(data);

        expect(DataEntity.isDataEntity(results)).toEqual(true);
        expect(results).toEqual({ first: 'John', last: 'Doe', full: 'JohnDoe' });
    });

    it('various delimiter options', () => {
        const opConfig = { 
            fields: ['first', 'last'],
            target_field: 'full',
            delimiter: ' '
        };

        const opConfig2 = { 
            fields: ['first', 'last'],
            target_field: 'full',
            delimiter: ' & '
        };
        const test1 =  new Join(opConfig);
        const test2 =  new Join(opConfig2);

        const data = new DataEntity({ first: 'John', last: 'Doe' });
        const data2 = new DataEntity({ first: 'John', last: 'Doe' })

        const results1 = test1.run(data);
        const results2 = test2.run(data2);

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(DataEntity.isDataEntity(results2)).toEqual(true);

        expect(results1).toEqual({ first: 'John', last: 'Doe', full: 'John Doe' });
        expect(results2).toEqual({ first: 'John', last: 'Doe', full: 'John & Doe' });
    });

    it('can just return only the target_field', () => {
        const opConfig = { fields: ['first', 'last'], target_field: 'full', remove_source: true };
        const test =  new Join(opConfig);
        const metaData = { selectors: { 'some:data': true } }
        const data = new DataEntity({ first: 'John', last: 'Doe' }, metaData)
        const results = test.run(data);

        expect(DataEntity.isDataEntity(results)).toEqual(true);
        expect(results.getMetadata().selectors).toEqual(metaData.selectors);
        expect(results).toEqual({ full: 'JohnDoe' });
    });
});
