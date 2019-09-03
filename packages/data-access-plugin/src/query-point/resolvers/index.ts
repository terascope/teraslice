
import crypto from 'crypto';
import { GraphQLResolveInfo } from 'graphql';
import { IResolvers, UserInputError } from 'apollo-server-express';
import { DataAccessConfig, SearchAccess, InputQuery } from '@terascope/data-access';
import { Context } from '@terascope/job-components';
import { Logger, get, AnyObject } from '@terascope/utils';
import DataLoader from 'dataloader';
import Bluebird from 'bluebird';
import { Client } from 'elasticsearch';
import JoinStitcher from '../join';
import { parseJoinField } from '../utils';
import { SpacesContext, ParsedJoinFields, EndpointArgs } from '../interfaces';
import Misc from './misc';
import { getESClient } from '../../utils';


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
    [key: string]: InputQuery;
}

function createResolvers(
    viewList: DataAccessConfig[],
    typeDefs: string,
    logger: Logger,
    context: Context,
    concurrency: number
) {
    const results = {} as IResolvers<any, SpacesContext>;
    const endpoints = {};
    const searchDict: SearchDict = {};
    const queryArgs: QueryArgs = {};

    // we create the master resolver list
    for (const key in Misc) {
        if (typeDefs.includes(key)) results[key] = Misc[key];
    }

    function getSelectionKeys(info: GraphQLResolveInfo) {
        const {
            fieldNodes: [
                {
                    selectionSet
                },
            ],
        } = info;

        const selections = selectionSet ? selectionSet.selections : [];
        const filteredResults: string[] = [];
        selections.forEach((selector) => {
            // @ts-ignore
            const value = selector.name != null ? selector.name.value : false;
            if (endpoints[value] == null) filteredResults.push(value);
        });
        return filteredResults;
    }

    const loader = new DataLoader((keys: string[]) => loadJoinData(keys));

    function loadJoinData(luceneQuerys: string[]) {
        return Promise.resolve(Bluebird.map(luceneQuerys, (keyString: string) => {
            const [endpoint] = keyString.split('__');
            const query = queryArgs[keyString];
            const { searchAccess, client } = searchDict[endpoint];
            return searchAccess.performSearch(client, query);
        }, { concurrency }));
    }


    function validateFields(
        info: GraphQLResolveInfo,
        root: AnyObject | undefined,
        parsedFields: ParsedJoinFields[]
    ) {
        for (const parsedFieldData of parsedFields) {
            const { origin } = parsedFieldData;
            // if we have a root, we are joining
            if (!(root && root[origin] != null)) {
                // if field is queried by parent but is undefined, we abort the join query
                return [];
            }
        }
    }

    function makeJoinQuery(
        view: DataAccessConfig,
        root: AnyObject,
        info: GraphQLResolveInfo,
        join: string[],
        prevQ: undefined|string
    ) {
        let q = '';
        const sticher = new JoinStitcher(view);
        const parsedFields = join.map(parseJoinField);

        validateFields(info, root, parsedFields);

        // @ts-ignore
        q = parsedFields.map((config) => sticher.make(config.target, root[config.origin], config.extraParams)).join(' AND ');
        if (q.length === 0) return;

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

        endpoints[endpoint] = async function resolverFn(
            root: AnyObject| undefined,
            args: EndpointArgs,
            ctx: any,
            info: GraphQLResolveInfo
        ) {
            if (!ctx.isValid) {
                ctx.isValid = true;
            }

            const fields = getSelectionKeys(info);
            const {
                size, sort, from, join
            } = args;

            const query: InputQuery = {
                start: from,
                sort,
                size,
                fields,
            };

            let { query: q } = args;

            if (root && join == null) throw new UserInputError('Invalid query, expected join when querying against another space');

            if (join) {
                if (!Array.isArray(join)) throw new UserInputError('Invalid join, must be an array of values');
                q = makeJoinQuery(view, root as AnyObject, info, join, q);
                if (q == null) {
                    return [];
                }
            }
            query.q = q;
            // set the query obj for dataloader
            const key = `${endpoint}__${q}`;
            queryArgs[key] = query;

            const response = await loader.load(key);
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
