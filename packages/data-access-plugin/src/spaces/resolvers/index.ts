import crypto from 'crypto';
import { IResolvers, UserInputError } from 'apollo-server-express';
import { GraphQLResolveInfo } from 'graphql';
import { DataAccessConfig } from '@terascope/data-access';
import elasticsearchApi from '@terascope/elasticsearch-api';
import { Logger, get } from '@terascope/utils';
import { Context } from '@terascope/job-components';
import { QueryAccess } from 'xlucene-evaluator';
import { getESClient } from '../../utils';
import { SpacesContext } from '../interfaces';
import Misc from './misc';

const defaultResolvers = {
    ...Misc,
    Query: {},
} as IResolvers<any, SpacesContext>;

export { defaultResolvers, createResolvers };

function dedup(records: any[]): any[] {
    const dedup = {};
    records.forEach((record: any) => {
        const shasum = crypto.createHash('md5').update(JSON.stringify(record));
        // @ts-ignore
        dedup[shasum.digest()] = record;
    });

    return Object.values(dedup);
}

function createResolvers(viewList: DataAccessConfig[], logger: Logger, context: Context) {
    const results = {
        ...Misc,
    } as IResolvers<any, SpacesContext>;
    const endpoints = {};
    // we create the master resolver list

    function getSelectionKeys(info: GraphQLResolveInfo) {
        // @ts-ignore
        const {
            fieldNodes: [
                {
                    // @ts-ignore
                    selectionSet: { selections },
                },
            ],
        } = info;
        const results: string[] = [];
        selections.forEach((selector: any) => {
            const {
                name: { value },
            } = selector;
            if (endpoints[value] == null) results.push(value);
        });
        return results;
    }

    viewList.forEach(view => {
        const esClient = getESClient(context, get(view, 'search_config.connection', 'default'));
        const client = elasticsearchApi(esClient, logger);
        const {
            data_type: { type_config },
            view: { includes, excludes, constraint, prevent_prefix_wildcard },
        } = view;
        const accessData = {
            includes,
            excludes,
            constraint,
            prevent_prefix_wildcard,
            allow_implicit_queries: true,
            type_config,
        };
        const queryAccess = new QueryAccess(accessData, logger);

        endpoints[view.space_endpoint] = async function resolverFn(root: any, args: any, ctx: any, info: GraphQLResolveInfo) {
            const _sourceInclude = getSelectionKeys(info);
            const { size, sort, from, join } = args;
            const queryParams = { index: view.search_config!.index, from, sort, size, _sourceInclude };
            let { query: q } = args;

            if (root == null && q == null) throw new UserInputError('Invalid request, expected query to nested');
            if (root && join == null) throw new UserInputError('Invalid query, expected join when querying against another space');

            if (join) {
                if (!Array.isArray(join)) throw new UserInputError('Invalid join, must be an array of values');
                join.forEach(field => {
                    const [orig, target] = field.split(':') || [field, field];
                    const selector = target || orig; // In case there's no colon in field.
                    if (root && root[orig] !== null) {
                        if (q) {
                            q = `${selector}:${root[orig]} AND (${q})`;
                        }
                        q = `${selector}:${root[orig]}`;
                    }
                });
            }
            const query = queryAccess.restrictSearchQuery(q, queryParams);
            return dedup(await client.search(query));
        };
    });

    for (const key in endpoints) {
        // we create individual resolver
        results[key] = endpoints;
    }
    // @ts-ignore TODO: fix typing
    results.Query = endpoints;

    return results;
}
