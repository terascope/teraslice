import 'jest-extended';
import { TSError } from '@terascope/utils';
import { QueryAccess, ViewModel } from '../src';

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
            queryAccess.restrictQuery('bar:foo');
        }).toThrowWithMessage(TSError, 'Field bar is restricted');
    });
});
