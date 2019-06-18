import { makeExecutableSchema } from 'apollo-server-express';
import { ACLManager, User, DataAccessConfig } from '@terascope/data-access';
import { Context } from '@terascope/job-components';
import * as ts from '@terascope/utils';
import { DataType, TypeConfigFields } from '@terascope/data-types';
import Usertype from './types/user';
import { createResolvers } from './resolvers';

// TODO: elasticsearch search error should not leak to much
// TODO: history capabilities??

export default async function getSchemaByRole(aclManager: ACLManager, user: User, logger: ts.Logger, context: Context) {
    const query = `roles: ${user.role} AND type:SEARCH AND _exists_:endpoint`;
    const spaces = await aclManager.findSpaces({ query }, false);
    const fetchViews = spaces.map(space => aclManager.getViewForSpace({ space: space.id }, user));
    const list = await Promise.all(fetchViews);
    const sanatizedList = list.map(view => {
        view.space_endpoint = sanitize(view.space_endpoint!);
        return view;
    });

    const types = createTypings(sanatizedList);
    const myResolvers = createResolvers(sanatizedList, types[0], logger, context);

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
        .replace(/[\!$\?@\*:\s=\(\)\[\]\{\}\|]/g, '')
        .replace(/-/g, '_')
        .trim();
}

function makeEndpoint(endpoint: string) {
    return `${endpoint}(join: [String], query: String, size: Int, from: Int, sort: String): [${endpoint}!]!`;
}

function createTypings(configs: DataAccessConfig[]) {
    const results: string[] = [Usertype];
    const endpointList: string = configs.map(config => makeEndpoint(config.space_endpoint!)).join('\n    ');
    const filteredDataTypes = configs.map(filterDataTypes);
    const myTypes = DataType.mergeGraphQLDataTypes(filteredDataTypes, endpointList);

    // create query type
    results.push(
        myTypes,
        ` type Query {
                ${endpointList}
            }
        `
    );

    return results;
}

function hasKey(values: string[], field: string) {
    const results = values.filter(value => {
        return value === field || value.match(new RegExp(`^${field}\\.`));
    });

    if (results.length > 0) return results;
    return false;
}

type CB = (key: string) => void;

function iterateList(srcList: string[], comparaterList: string[], cb: CB) {
    srcList.forEach(key => {
        const keyList = hasKey(comparaterList, key);
        if (keyList) {
            keyList.forEach(cb);
        }
    });
}

function restrict(fields: TypeConfigFields, includes: string[], exludes: string[]): TypeConfigFields {
    let results: TypeConfigFields;
    const fieldsList = Object.keys(fields);

    if (includes.length === 0) {
        results = fields;
    } else {
        results = {};
        const cb: CB = includedField => (results[includedField] = fields[includedField]);
        iterateList(includes, fieldsList, cb);
    }

    if (exludes.length > 0) {
        const cb: CB = restrictedField => delete results[restrictedField];
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
    return new DataType({ version, fields: typeObj }, name);
}
