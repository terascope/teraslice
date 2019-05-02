
import { IResolvers } from 'apollo-server-express';
import { DataAccessConfig } from '@terascope/data-access';
import elasticsearchApi from '@terascope/elasticsearch-api';
import { Logger, get } from '@terascope/utils';
import { Context } from '@terascope/job-components';
import { QueryAccess } from 'xlucene-evaluator';
import { getESClient } from '../../utils';
import { SpacesContext } from '../interfaces';
import User from './user';
import Misc from './misc';
import Query from './query';
import _ from 'lodash';

const defaultResolvers = {
    ...Misc,
    ...Query,
    ...User
} as IResolvers<any, SpacesContext>;

export {
    defaultResolvers,
    createResolvers
 };

// TODO: deal with auth like manager/query
// TODO: if fields are not one-to-one mapping then we need to add a resolver for it
// TODO: check query to see if allowed to search by terms given
// TODO: use contraints/includes/excludes
function createResolvers(viewList: DataAccessConfig[], logger: Logger, context: Context) {
    const results = {
        ...Misc,
        ...User,
    } as IResolvers<any, SpacesContext>;
    const endpoints = {};
    // we create the master resolver list
    viewList.forEach((view) => {
        console.log('internal view', view)
        const esClient = getESClient(context, get(view, 'search_config.connection', 'default'));
        const client = elasticsearchApi(esClient, logger);
        // TODO: allow_implicit_queries for query access ??? would this work with search_config.require_query? by space?
        const { data_type: {  type_config }, view: { includes, excludes, constraint, prevent_prefix_wildcard } } = view;
        const accessData = {
            includes,
            excludes,
            constraint,
            prevent_prefix_wildcard,
            allow_implicit_queries: true,
            type_config,
        };
        const queryAccess = new QueryAccess(accessData, logger);

        endpoints[view.endpoint] = (root: any, args: any, ctx: any) => {
            const { size, sort, from, join } = args;
            let { query: q } = args;
            if (root && root[join] !== null) {
                if (q) {
                    q = `${join}:${root[join]} AND ${q}`;
                } else {
                    q = `${join}:${root[join]}`;
                }
            }
            console.log('what is the q', q)

            const query = queryAccess.restrictSearchQuery(q, { index: view.search_config!.index, from, sort, size });
            console.log('what is result from query access', JSON.stringify(query, null, 4))
            return client.search(query);
        };
    });

    for (const key in endpoints) {
        // we create individual resolver
        results[key] = _.omit(endpoints, key);
    }
    // @ts-ignore TODO: fix typing
    results.Query = {
        ...Query.Query,
        ...endpoints,
    };

    return results;
}
