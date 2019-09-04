
import { makeExecutableSchema } from 'apollo-server-express';
import { ACLManager, User, DataAccessConfig } from '@terascope/data-access';
import { Context, TSError } from '@terascope/job-components';
import * as ts from '@terascope/utils';
import * as dt from '@terascope/data-types';
import Usertype from './types/user';
import { createResolvers } from './resolvers';

// TODO: history capabilities??

export default async function getSchemaByRole(
    aclManager: ACLManager,
    user: User,
    logger: ts.Logger,
    context: Context,
    concurrency: number
) {
    const query = `roles: ${user.role} AND type:SEARCH AND _exists_:endpoint`;
    const spaces = await aclManager.findSpaces({ query, size: 10000 }, false);

    if (spaces.length === 0) throw new TSError('no spaces are available to query with this user', { statusCode: 422, context: { user }, });

    const promises = spaces.map((space) => aclManager.getViewForSpace({ space: space.id }, user));
    const dataAccessConfigs = await Promise.all(promises);

    const sanatizedList = dataAccessConfigs.map((dataAccessConfig) => {
        const endpoint = sanitize(dataAccessConfig.space_endpoint!);
        return Object.assign({}, dataAccessConfig, { space_endpoint: endpoint });
    });

    const types = createTypes(sanatizedList);
    const myResolvers = createResolvers(sanatizedList, types[0], logger, context, concurrency);

    const schema = makeExecutableSchema({
        typeDefs: types,
        resolvers: myResolvers,
        inheritResolversFromInterfaces: true,
    });

    return schema;
}

function sanitize(name: string) {
    // https://graphql.github.io/graphql-spec/June2018/#sec-Punctuators
    return name
        .replace(/[!$?@*:\s=()[\]{}|]/g, '')
        .replace(/-/g, '_')
        .trim();
}

function makeEndpoint(endpoint: string) {
    return `${endpoint}(join: [String], query: String, size: Int, from: Int, sort: String, geoSortPoint: String, geoSortOrder: String, geoSortUnit: String): [${endpoint}!]!`;
}

function createTypes(dataAccessConfigs: DataAccessConfig[]) {
    const results: string[] = [Usertype];
    const endpointList = dataAccessConfigs.map((config) => makeEndpoint(config.space_endpoint!));
    const typeReferences: dt.GraphQLTypeReferences = {
        __all: endpointList,
    };

    const filteredDataTypes = dataAccessConfigs.map(filterDataTypes);
    const myTypes = dt.DataType.mergeGraphQLDataTypes(filteredDataTypes, typeReferences);

    // create query type
    results.push(
        myTypes,
        `
        type Query {
            ${endpointList.join('\n')}
        }
        `
    );

    return results;
}

function hasKey(values: string[], field: string) {
    const results = values.filter((value) => value === field || value.match(new RegExp(`^${field}\\.`)));

    if (results.length > 0) return results;
    return false;
}

type CB = (key: string) => void;

function iterateList(srcList: string[], comparaterList: string[], cb: CB) {
    srcList.forEach((key) => {
        const keyList = hasKey(comparaterList, key);
        if (keyList) {
            keyList.forEach(cb);
        }
    });
}

function restrict(
    fields: dt.TypeConfigFields,
    includes: string[],
    exludes: string[]
): dt.TypeConfigFields {
    let results: dt.TypeConfigFields;
    const fieldsList = Object.keys(fields);

    if (includes.length === 0) {
        results = fields;
    } else {
        results = {};
        const cb: CB = (includedField) => {
            (results[includedField] = fields[includedField]);
        };
        iterateList(includes, fieldsList, cb);
    }

    if (exludes.length > 0) {
        const cb: CB = (restrictedField) => delete results[restrictedField];
        iterateList(exludes, fieldsList, cb);
    }

    return results;
}

function filterDataTypes(config: DataAccessConfig) {
    const {
        space_endpoint: name,
        view: { excludes = [], includes = [] },
        data_type: {
            config: { version, fields },
        },
    } = config;
    const typeObj = restrict(fields, includes, excludes);
    return new dt.DataType({ version, fields: typeObj }, name);
}
