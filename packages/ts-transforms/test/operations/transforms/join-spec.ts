import { cloneDeep, DataEntity } from '@terascope/core-utils';
import { Join } from '../../../src/operations';

describe('join operator', () => {
    it('can instantiate', () => {
        const opConfig = {
            post_process: 'join',
            fields: ['first', 'last'],
            source: 'someField',
            target: 'otherField',
            __id: 'someId',
            follow: 'otherId',
        };
        expect(() => new Join(opConfig)).not.toThrow();
    });

    it('can properly throw with bad config values', () => {
        const badConfig1 = { post_process: 'join', fields: ['first', 'last'], target: 1324 };
        const badConfig2 = { post_process: 'join', fields: ['first', 'last'], target: '' };
        const badConfig3 = { post_process: 'join', fields: ['first', 'last'] };
        const badConfig4 = { post_process: 'join', fields: 1234, target: 'someField' };
        const badConfig5 = { post_process: 'join', fields: ['first'], target: 'someField' };
        const badConfig6 = { post_process: 'join', fields: { first: 'first', last: 'last' }, target: 'someField' };
        const badConfig7 = {
            post_process: 'join', fields: ['first', 'last'], target: 'someField', delimiter: 1324
        };
        // @ts-expect-error
        expect(() => new Join(badConfig1)).toThrow();
        // @ts-expect-error
        expect(() => new Join(badConfig2)).toThrow();
        // @ts-expect-error
        expect(() => new Join(badConfig3)).toThrow();
        // @ts-expect-error
        expect(() => new Join(badConfig4)).toThrow();
        // @ts-expect-error
        expect(() => new Join(badConfig5)).toThrow();
        // @ts-expect-error
        expect(() => new Join(badConfig6)).toThrow();
        // @ts-expect-error
        expect(() => new Join(badConfig7)).toThrow();
    });

    it('can join fields of data entities', () => {
        const opConfig = {
            post_process: 'join', fields: ['first', 'last'], target: 'full', __id: 'someId', follow: 'otherId'
        };
        const test = new Join(opConfig);
        const data = new DataEntity({ first: 'John', last: 'Doe' });
        const results = test.run(cloneDeep(data));

        expect(DataEntity.isDataEntity(results)).toEqual(true);
        expect(results).toEqual({ first: 'John', last: 'Doe', full: 'JohnDoe' });
    });

    it('can join fields of data entities through sources', () => {
        const opConfig = {
            post_process: 'join',
            sources: ['first', 'last'],
            target: 'full',
            __id: 'someId',
            follow: 'otherId',
        };
        const test = new Join(opConfig);
        const data = new DataEntity({ first: 'John', last: 'Doe' });
        const results = test.run(cloneDeep(data));

        expect(DataEntity.isDataEntity(results)).toEqual(true);
        expect(results).toEqual({ first: 'John', last: 'Doe', full: 'JohnDoe' });
    });

    it('can join array fields of data entities', () => {
        const opConfig = {
            post_process: 'join',
            fields: ['firstGroup', 'secondGroup'],
            target: 'allGroup',
            delimiter: ' & ',
            __id: 'someId',
            follow: 'otherId',
        };
        const test = new Join(opConfig);
        const data = new DataEntity({ firstGroup: ['John', 'Sarah'], secondGroup: ['Connor', 'Billy'] });
        const results = test.run(cloneDeep(data));

        expect(DataEntity.isDataEntity(results)).toEqual(true);
        expect(results).toEqual({
            firstGroup: ['John', 'Sarah'],
            secondGroup: ['Connor', 'Billy'],
            allGroup: 'John & Sarah & Connor & Billy',
        });
    });

    it('various delimiter options', () => {
        const opConfig = {
            post_process: 'join',
            fields: ['first', 'last'],
            target: 'full',
            delimiter: ' ',
            __id: 'someId',
            follow: 'otherId',
        };

        const opConfig2 = {
            post_process: 'join',
            fields: ['first', 'last'],
            target: 'full',
            delimiter: ' & ',
            __id: 'someId',
            follow: 'otherId',
        };
        const test1 = new Join(opConfig);
        const test2 = new Join(opConfig2);

        const data = new DataEntity({ first: 'John', last: 'Doe' });
        const data2 = new DataEntity({ first: 'John', last: 'Doe' });

        const results1 = test1.run(cloneDeep(data));
        const results2 = test2.run(cloneDeep(data2));

        expect(DataEntity.isDataEntity(results1)).toEqual(true);
        expect(DataEntity.isDataEntity(results2)).toEqual(true);

        expect(results1).toEqual({ first: 'John', last: 'Doe', full: 'John Doe' });
        expect(results2).toEqual({ first: 'John', last: 'Doe', full: 'John & Doe' });
    });

    it('can join nested target', () => {
        const opConfig = {
            post_process: 'join',
            fields: ['person.first', 'person.last'],
            target: 'author.full_name',
            __id: 'someId',
            follow: 'otherId',
        };
        const test = new Join(opConfig);
        const metaData = { selectors: { 'some:data': true } };
        const data = new DataEntity({ person: { first: 'John', last: 'Doe' } }, metaData);
        const results = test.run(cloneDeep(data));

        expect(DataEntity.isDataEntity(results)).toEqual(true);
        expect(results.getMetadata('selectors')).toEqual(metaData.selectors);
        expect(results).toEqual({ author: { full_name: 'JohnDoe' }, person: { first: 'John', last: 'Doe' } });
    });
});
