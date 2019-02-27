import 'jest-extended';
import { DataEntity, TSError } from '@terascope/utils';
import { QueryAccess, ViewModel, PublicUserModel } from '../src';

describe('QueryAccess', () => {
    const view = DataEntity.make<ViewModel>({
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
        _updated: new Date(),
        _created: new Date(),
    });

    const user = DataEntity.make<PublicUserModel>({
        client_id: 1,
        username: 'foobar',
        firstname: 'Foo',
        lastname: 'Bar',
        email: 'foobar@example.com',
        roles: ['example-role'],
    });

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
