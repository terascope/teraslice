
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
    [key: string]: InputQuery;
}

function createResolvers(viewList: DataAccessConfig[], typeDefs: string, logger: Logger, context: Context, concurrency: number) {
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
        return Promise.resolve(Bluebird.map(luceneQuerys, (keyString: string) => {
            const [endpoint] = keyString.split('__');
            const query = queryArgs[keyString];
            const { searchAccess, client } = searchDict[endpoint];
            return searchAccess.performSearch(client, query);
        }, { concurrency }));
    }

    interface ParsedJoinFields {
        origin: string;
        target: string;
        extraParams?: string;
    }

    function parseJoinField(fieldParams: string): ParsedJoinFields {
        // any chars between a | and a whitespace or :
        let field = fieldParams;
        let extraParams: undefined | string;
        const regex = /\|([^: ]+)/;
        const hasExtraParams = field.match(regex);

        if (hasExtraParams) {
            extraParams = hasExtraParams[1];
            field = field.replace(`|${extraParams}`, '');
        }
        const selectorTargets =  field.split(':');
        const origin = selectorTargets[0];
        const target = selectorTargets[1] || origin;

        return { origin, target, extraParams };
    }

    function validateFields(root: any, parsedFields: ParsedJoinFields[]) {
        parsedFields.forEach((parsedFieldData) => {
            const { origin } = parsedFieldData;
            if (!(root && root[origin] != null)) {
                const errMsg = `Invalid join on field "${origin}", you may only join on a field that is being returned in a query`;
                throw new UserInputError(errMsg);
            }
        });
    }

    class JoinStitcher {
        view: DataAccessConfig;

        constructor(view:DataAccessConfig) {
            this.view = view;
        }

        private isGeoJoinField(field: string):boolean {
            const dataTypeFields = this.view.data_type.config.fields;
            return dataTypeFields[field] != null && dataTypeFields[field].type === 'Geo';
        }

        private _geoQuery(target: string , value: any | any[], params: string | undefined) {
            const distance = params || '10m';
            const { lat, lon }: { lat: string, lon: string } = value;
            return `${target}:(_geo_point_:"${lat},${lon}" _geo_distance_:${distance})`;
        }

        private _createQuery(target: string , value: string | string[]) {
            if (Array.isArray(value)) {
                return value.map((field) => `${target}:"${field}"`).join(' AND ');
            }

            return `${target}:"${value}"`;
        }

        make(target: string , value: any | any[], params: undefined | string) {
            if (this.isGeoJoinField(target)) {
                return this._geoQuery(target, value, params);
            }

            return this._createQuery(target, value);
        }
    }

    function makeJoinQuery(view: DataAccessConfig, root: any, join: string[], prevQ: undefined|string) {
        let q = '';
        const sticher = new JoinStitcher(view);
        const parsedFields = join.map(parseJoinField);
        validateFields(root, parsedFields);
        // @ts-ignore
        q = parsedFields.map((config) => {
            return sticher.make(config.target, root[config.origin], config.extraParams);
        }).join(' AND ');

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

            let { query: q } = args;

            if (root == null && q == null) throw new UserInputError('Invalid request, expected query to nested');
            if (root && join == null) throw new UserInputError('Invalid query, expected join when querying against another space');

            if (join) {
                if (!Array.isArray(join)) throw new UserInputError('Invalid join, must be an array of values');
                q = makeJoinQuery(view, root, join, q);
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
