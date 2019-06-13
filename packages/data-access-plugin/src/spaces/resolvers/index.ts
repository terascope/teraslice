import crypto from 'crypto';
import { IResolvers, UserInputError } from 'apollo-server-express';
import { GraphQLResolveInfo } from 'graphql';
import { DataAccessConfig, SpaceSearchConfig } from '@terascope/data-access';
import { DataType } from '@terascope/data-types';
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

function dedup<T>(records: T[]): T[] {
    const deduped: { [hash: string]: T } = {};
    records.forEach(record => {
        const shasum = crypto.createHash('md5').update(JSON.stringify(record));
        const hash = shasum.digest().toString('utf8');
        deduped[hash] = record;
    });

    return Object.values(deduped);
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

        const filteredResults: string[] = [];
        selections.forEach((selector: any) => {
            const {
                name: { value },
            } = selector;
            if (endpoints[value] == null) filteredResults.push(value);
        });
        return filteredResults;
    }

    viewList.forEach(view => {
        const esClient = getESClient(context, get(view, 'config.connection', 'default'));
        const client = elasticsearchApi(esClient, logger);
        const {
            data_type: { config },
            view: { includes, excludes, constraint, prevent_prefix_wildcard },
        } = view;

        const dateType = new DataType(config);
        const accessData = {
            includes,
            excludes,
            constraint,
            prevent_prefix_wildcard,
            allow_implicit_queries: true,
            type_config: dateType.toXlucene(),
        };

        const queryAccess = new QueryAccess(accessData, logger);

        endpoints[view.space_endpoint] = async function resolverFn(root: any, args: any, ctx: any, info: GraphQLResolveInfo) {
            const spaceConfig = view.config as SpaceSearchConfig;
            const _sourceInclude = getSelectionKeys(info);
            const { size, sort, from, join } = args;
            const queryParams = { index: spaceConfig.index, from, sort, size, _sourceInclude };
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
