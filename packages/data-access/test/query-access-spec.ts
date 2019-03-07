import 'jest-extended';
import { TSError } from '@terascope/utils';
import { QueryAccess, ViewModel } from '../src';
import { SearchParams } from 'elasticsearch';

describe('QueryAccess', () => {
    const view: ViewModel = {
        id: 'example-view',
        name: 'Example View',
        space: 'example-space',
        roles: [
            'example-role'
        ],
        excludes: [
            'bar'
        ],
        includes: [
            'foo'
        ],
        updated: new Date().toISOString(),
        created: new Date().toISOString(),
    };

    const queryAccess = new QueryAccess({
        view,
        space_id: 'example-space',
        space_metadata: {},
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
            q: 'idk'
        };

        const result = queryAccess.restrictESQuery('foo:bar', params);
        expect(result).toMatchObject({
            _sourceExclude: [
                'bar'
            ],
            _sourceInclude: [
                'foo'
            ],
        });

        expect(params).toHaveProperty('q', 'idk');
        expect(result).not.toHaveProperty('q', 'idk');
    });
});
