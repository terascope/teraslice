
import { IResolvers } from 'apollo-server-express';
import { DataAccessConfig } from '@terascope/data-access';
import elasticsearchApi from '@terascope/elasticsearch-api';
import { Logger, get } from '@terascope/utils';
import { Context } from '@terascope/job-components';
import { QueryAccess } from 'xlucene-evaluator';
import { getESClient } from '../../utils';
import { SpacesContext } from '../interfaces';
import Misc from './misc';
import _ from 'lodash';

const defaultResolvers = {
    ...Misc,
    Query: {},
} as IResolvers<any, SpacesContext>;

export {
    defaultResolvers,
    createResolvers
 };

function joinQuery(root: any, join: string, q: string) {
    const [orig, target] = join.split(':') || [join, join];
    // @ts-ignore
    const selector = target || orig; // In case there's no colon in field.
    if (q) {
        return `${selector}:${root[orig]} AND ${q}`;
    }

    return `${selector}:${root[orig]}`;
}

// TODO: if fields are not one-to-one mapping then we need to add a resolver for it
function createResolvers(viewList: DataAccessConfig[], logger: Logger, context: Context) {
    const results = {
        ...Misc,
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
                q = joinQuery(root, join, q);
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
    results.Query = endpoints;

    return results;
}
