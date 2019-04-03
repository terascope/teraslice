import 'jest-extended';
import { TSError } from '@terascope/utils';
import { SearchParams } from 'elasticsearch';
import { SearchAccess, View, DataType } from '../src';

describe('SearchAccess', () => {
    const view: View = {
        client_id: 1,
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

    const dataType: DataType = {
        client_id: 1,
        id: 'example-data-type',
        name: 'ExampleType',
        type_config: {},
        updated: new Date().toISOString(),
        created: new Date().toISOString(),
    };

    const searchAccess = new SearchAccess({
        view,
        data_type: dataType,
        search_config: {
            index: 'example-index'
        },
        space_id: 'example-space',
        user_id: 'example-user',
        role_id: 'example-role'
    });

    it('should fail if given an invalid search config', () => {
        expect(() => {
            new SearchAccess({
                // @ts-ignore
                search_config: {},
            });
        }).toThrowWithMessage(TSError, 'Search is not configured correctly for search');
    });

    it('should be able to restrict the query for bar', () => {
        expect(() => {
            searchAccess.restrictSearchQuery('bar:foo');
        }).toThrowWithMessage(TSError, 'Field bar in query is restricted');
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

        const result = searchAccess.restrictSearchQuery('foo:bar', params);
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
        const result = searchAccess.restrictSearchQuery('foo:bar');
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
