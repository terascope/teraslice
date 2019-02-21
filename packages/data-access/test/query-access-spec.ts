import 'jest-extended';
import { TSError } from '@terascope/utils';
import { QueryAccess, ViewModel, UserModel } from '../src';

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

    const user: UserModel = {
        id: 'example-user-id',
        client_id: 1,
        username: 'foobar',
        firstname: 'Foo',
        lastname: 'Bar',
        email: 'foobar@example.com',
        roles: ['example-role'],
        updated: new Date().toISOString(),
        created: new Date().toISOString(),
    };

    const queryAccess = new QueryAccess({
        view,
        user,
        role: 'example-role'
    });

    it('should be able to restrict the query bar', () => {
        expect(() => {
            queryAccess.restrictQuery('bar:foo');
        }).toThrowWithMessage(TSError, 'Field bar is restricted');
    });
});
