
import { MakeArray } from '../../../src/operations';
import { DataEntity } from '@terascope/utils';

describe('MakeArray operator', () => {

    it('can instantiate', () => {
        const opConfig = { operation: 'MakeArray', fields: ['first', 'last'], source_field: 'someField', target_field: 'otherField', __id: 'someId' };
        expect(() => new MakeArray(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { operation: 'MakeArray', fields: ['first', 'last'], target_field: 1324 };
        const badConfig2 = { operation: 'MakeArray', fields: ['first', 'last'], target_field: '' };
        const badConfig3 = { operation: 'MakeArray', fields: ['first', 'last'] };
        const badConfig4 = { operation: 'MakeArray', fields: 1234 , target_field: 'someField' };
        const badConfig5 = { operation: 'MakeArray', fields: { first: 'first', last:'last' }, target_field: 'someField' };
        // @ts-ignore
        expect(() => new MakeArray(badConfig1)).toThrow();
        // @ts-ignore
        expect(() => new MakeArray(badConfig2)).toThrow();
         // @ts-ignore
        expect(() => new MakeArray(badConfig3)).toThrow();
         // @ts-ignore
        expect(() => new MakeArray(badConfig4)).toThrow();
        // @ts-ignore
        expect(() => new MakeArray(badConfig5)).toThrow();
    });

    it('can make an array of fields of data entities', () => {
        const opConfig = { operation: 'MakeArray', fields: ['first', 'last'], target_field: 'full', __id: 'someId' };
        const test =  new MakeArray(opConfig);
        const data = new DataEntity({ first: 'John', last: 'Doe' });
        const results = test.run(data);

        expect(DataEntity.isDataEntity(results)).toEqual(true);
        expect(results).toEqual({ first: 'John', last: 'Doe', full: ['John', 'Doe'] });
    });

    it('can make an array of fields of data entities through source_fields', () => {
        const opConfig = { operation: 'MakeArray', source_fields: ['first', 'last'], target_field: 'full', __id: 'someId' };
        const test =  new MakeArray(opConfig);
        const data = new DataEntity({ first: 'John', last: 'Doe' });
        const results = test.run(data);

        expect(DataEntity.isDataEntity(results)).toEqual(true);
        expect(results).toEqual({ first: 'John', last: 'Doe', full: ['John', 'Doe'] });
    });

    it('can make an array of fields if only one field is specified', () => {
        const opConfig = { operation: 'MakeArray', source_fields: ['first'], target_field: 'full', __id: 'someId' };
        const test =  new MakeArray(opConfig);
        const data = new DataEntity({ first: 'John', last: 'Doe' });
        const results = test.run(data);

        expect(DataEntity.isDataEntity(results)).toEqual(true);
        expect(results).toEqual({ first: 'John', last: 'Doe', full: ['John'] });
    });

    it('can make an array from nested target_field', () => {
        const opConfig = { operation: 'MakeArray', fields: ['person.first', 'person.last'], target_field: 'author.full_name', __id: 'someId' };
        const test =  new MakeArray(opConfig);
        const metaData = { selectors: { 'some:data': true } };
        const data = new DataEntity({ person: { first: 'John', last: 'Doe' } }, metaData);
        const results = test.run(data);

        expect(DataEntity.isDataEntity(results)).toEqual(true);
        expect(DataEntity.getMetadata(results as DataEntity, 'selectors')).toEqual(metaData.selectors);
        expect(results).toEqual({ author: { full_name: ['John', 'Doe'] }, person: { first: 'John', last: 'Doe' } });
    });
});
