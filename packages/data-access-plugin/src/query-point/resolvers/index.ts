
import crypto from 'crypto';
import { GraphQLResolveInfo } from 'graphql';
import { IResolvers, UserInputError } from 'apollo-server-express';
import { DataAccessConfig, SearchAccess, InputQuery } from '@terascope/data-access';
import { Context } from '@terascope/job-components';
import { Logger, get } from '@terascope/utils';
import DataLoader from 'dataloader';
import Bluebird from 'bluebird';
import { Client } from 'elasticsearch';
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
    records.forEach((record) => {
        const shasum = crypto.createHash('md5').update(JSON.stringify(record));
        const hash = shasum.digest().toString('utf8');
        deduped[hash] = record;
    });

    return Object.values(deduped);
}

interface QueryClient {
    client: Client;
    searchAccess: SearchAccess;
}

interface SearchDict {
    [key: string]: QueryClient;
}
// endpoint is first
interface QueryArgs {
    [key: string]: [string, InputQuery];
}

function createResolvers(viewList: DataAccessConfig[], typeDefs: string, logger: Logger, context: Context) {
    const results = {} as IResolvers<any, SpacesContext>;
    const endpoints = {};
    const searchDict: SearchDict = {};
    const queryArgs:QueryArgs = {};
    // we create the master resolver list
    for (const key in Misc) {
        if (typeDefs.includes(key)) results[key] = Misc[key];
    }

    function getSelectionKeys(info: GraphQLResolveInfo) {
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

    const loader = new DataLoader((keys:string[]) => loadJoinData(keys));

    function loadJoinData(luceneQuerys: string[]) {
        return Promise.resolve(Bluebird.map(luceneQuerys, (luceneQuery: string) => {
            // TODO: make sure this does not clash
            const [endpoint, query] = queryArgs[luceneQuery];
            const { searchAccess, client } = searchDict[endpoint];
            return searchAccess.performSearch(client, query);
        }, { concurrency: 10 }));
    }

    function makeSelctor(selector: string, value: any | any[], prevQ: undefined|string) {
        let q = '';

        if (Array.isArray(value)) {
            q = value.map((field) => `${selector}:"${field}"`).join(' AND ');
        } else {
            q = `${selector}:"${value}"`;
        }

        if (prevQ) {
            q = `${q} AND (${prevQ})`;
        }

        return q;
    }

    viewList.forEach((view) => {
        const endpoint = view.space_endpoint!;
        const client = getESClient(context, get(view, 'config.connection', 'default'));
        const searchAccess = new SearchAccess(view, logger);
        searchDict[endpoint] = { client, searchAccess };

        endpoints[endpoint] = async function resolverFn(root: any, args: any, ctx: any, info: GraphQLResolveInfo) {

            const fields = getSelectionKeys(info);
            const { size, sort, from, join } = args;

            const query: InputQuery = {
                start: from,
                sort,
                size,
                fields,
            };

            let { query:q,  } = args;

            if (root == null && q == null) throw new UserInputError('Invalid request, expected query to nested');
            if (root && join == null) throw new UserInputError('Invalid query, expected join when querying against another space');

            if (join) {
                if (!Array.isArray(join)) throw new UserInputError('Invalid join, must be an array of values');
                join.forEach((field) => {
                    const [orig, target] = field.split(':') || [field, field];
                    const selector = target || orig; // In case there's no colon in field.

                    if (root && root[orig] != null) {
                        q = makeSelctor(selector, root[orig], q);
                    } else {
                        throw new UserInputError('Invalid join, you may only join on a field that is being returned in a query');
                    }
                });
            }
            query.q = q;
            // set the query obj for dataloader
            queryArgs[q] = [endpoint, query];

            const response = await loader.load(q);
            return dedup(response.results);
        };
    });

    for (const key of Object.keys(endpoints)) {
        // we create individual resolver
        results[key] = endpoints;
    }

    results.Query = endpoints;

    return results;
}
