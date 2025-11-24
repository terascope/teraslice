import { cloneDeep, DataEntity } from '@terascope/core-utils';
import { MakeArray } from '../../../src/operations';

describe('MakeArray operator', () => {
    it('can instantiate', () => {
        const opConfig = {
            post_process: 'array',
            fields: ['first', 'last'],
            source: 'someField',
            target: 'otherField',
            __id: 'someId',
            follow: 'otherId',
        };
        expect(() => new MakeArray(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { post_process: 'array', fields: ['first', 'last'], target: 1324 };
        const badConfig2 = { post_process: 'array', fields: ['first', 'last'], target: '' };
        const badConfig3 = { post_process: 'array', fields: ['first', 'last'] };
        const badConfig4 = { post_process: 'array', fields: 1234, target: 'someField' };
        const badConfig5 = { post_process: 'array', fields: { first: 'first', last: 'last' }, target: 'someField' };
        // @ts-expect-error
        expect(() => new MakeArray(badConfig1)).toThrow();
        // @ts-expect-error
        expect(() => new MakeArray(badConfig2)).toThrow();
        // @ts-expect-error
        expect(() => new MakeArray(badConfig3)).toThrow();
        // @ts-expect-error
        expect(() => new MakeArray(badConfig4)).toThrow();
        // @ts-expect-error
        expect(() => new MakeArray(badConfig5)).toThrow();
    });

    it('can make an array of fields of data entities', () => {
        const opConfig = {
            post_process: 'array', fields: ['first', 'last'], target: 'full', __id: 'someId', follow: 'someTag'
        };
        const test = new MakeArray(opConfig);
        const data = new DataEntity({ first: 'John', last: 'Doe' });
        const results = test.run(cloneDeep(data));

        expect(DataEntity.isDataEntity(results)).toEqual(true);
        expect(results).toEqual({ first: 'John', last: 'Doe', full: ['John', 'Doe'] });
    });

    it('can make an array of fields if values are arrays or singular values', () => {
        const opConfig = {
            post_process: 'array', fields: ['first', 'last'], target: 'full', __id: 'someId', follow: 'someTag'
        };
        const test = new MakeArray(opConfig);
        const data = new DataEntity({ first: ['John', 'Jane'], last: 'Doe' });
        const results = test.run(cloneDeep(data));

        expect(DataEntity.isDataEntity(results)).toEqual(true);
        expect(results).toEqual({ first: ['John', 'Jane'], last: 'Doe', full: ['John', 'Jane', 'Doe'] });
    });

    it('can make an array of fields of data entities through sources', () => {
        const opConfig = {
            post_process: 'array',
            sources: ['first', 'last'],
            target: 'full',
            __id: 'someId',
            follow: 'otherId',
        };
        const test = new MakeArray(opConfig);
        const data = new DataEntity({ first: 'John', last: 'Doe' });
        const results = test.run(cloneDeep(data));

        expect(DataEntity.isDataEntity(results)).toEqual(true);
        expect(results).toEqual({ first: 'John', last: 'Doe', full: ['John', 'Doe'] });
    });

    it('can make an array of fields if only one field is specified', () => {
        const opConfig = {
            post_process: 'array', sources: ['first'], target: 'full', __id: 'someId', follow: 'otherId'
        };
        const test = new MakeArray(opConfig);
        const data = new DataEntity({ first: 'John', last: 'Doe' });
        const results = test.run(cloneDeep(data));

        expect(DataEntity.isDataEntity(results)).toEqual(true);
        expect(results).toEqual({ first: 'John', last: 'Doe', full: ['John'] });
    });

    it('can make an array from nested target', () => {
        const opConfig = {
            post_process: 'array',
            fields: ['person.first', 'person.last'],
            target: 'author.full_name',
            __id: 'someId',
            follow: 'otherId',
        };
        const test = new MakeArray(opConfig);
        const metaData = { selectors: { 'some:data': true } };
        const data = new DataEntity({ person: { first: 'John', last: 'Doe' } }, metaData);
        const results = test.run(cloneDeep(data));

        expect(DataEntity.isDataEntity(results)).toEqual(true);
        expect(results.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results).toEqual({ author: { full_name: ['John', 'Doe'] }, person: { first: 'John', last: 'Doe' } });
    });
});
