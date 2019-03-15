import 'jest-extended';
import { TSError } from '@terascope/utils';
import { QueryAccess, ViewModel } from '../src';
import { SearchParams } from 'elasticsearch';

describe('QueryAccess', () => {
    const view: ViewModel = {
        id: 'example-view',
        name: 'Example View',
        data_type: 'example-data-type',
        roles: [
            'example-role'
        ],
        excludes: [
            'bar',
            'baz'
        ],
        includes: [
            'foo',
            'moo'
        ],
        updated: new Date().toISOString(),
        created: new Date().toISOString(),
    };

    const queryAccess = new QueryAccess({
        view,
        space_id: 'example-space',
        user_id: 'example-user',
        role_id: 'example-role'
    });

    it('should be able to restrict the query for bar', () => {
        expect(() => {
            queryAccess.restrictESQuery('bar:foo');
        }).toThrowWithMessage(TSError, 'Field bar is restricted');
    });

    it('should be able to return a restricted query', () => {
        const params: SearchParams = {
            q: 'idk',
            _sourceInclude: [
                'moo'
            ],
            _sourceExclude: [
                'baz'
            ]
        };

        const result = queryAccess.restrictESQuery('foo:bar', params);
        expect(result).toMatchObject({
            _sourceExclude: [
                'baz'
            ],
            _sourceInclude: [
                'moo'
            ],
        });

        expect(params).toHaveProperty('q', 'idk');
        expect(result).not.toHaveProperty('q', 'idk');
    });

    it('should be able to return a restricted query without any params', () => {
        const result = queryAccess.restrictESQuery('foo:bar');
        expect(result).toMatchObject({
            _sourceExclude: [
                'bar',
                'baz'
            ],
            _sourceInclude: [
                'foo',
                'moo'
            ],
        });

        expect(result).not.toHaveProperty('q', 'idk');
    });
});
