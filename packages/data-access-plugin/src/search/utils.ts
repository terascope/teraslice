import * as ts from '@terascope/utils';
import { Client } from 'elasticsearch';
import * as da from '@terascope/data-access';
import * as i from './interfaces';

/**
 * Search elasticsearch in a teraserver backwards compatible way
 */
export function makeSearchFn(client: Client, accessConfig: da.DataAccessConfig, logger: ts.Logger): i.SearchFn {
    const searchAccess = new da.SearchAccess(accessConfig, logger);

    return async (query: da.InputQuery) => {
        return searchAccess.performSearch(client, query);
    };
}
