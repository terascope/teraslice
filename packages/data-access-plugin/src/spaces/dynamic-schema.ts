import { makeExecutableSchema } from 'apollo-server-express';
import { ACLManager, User, DataAccessConfig } from '@terascope/data-access';
import { Context } from '@terascope/job-components';
import * as ts from '@terascope/utils';
import Usertype from './types/user';
import GeoType from './types/geoType';
import { createResolvers } from './resolvers';
import allTypeMappings from './typeMappings';

// TODO: elasticsearch search error should not leak to much
// TODO: history capabilities??

export default async function getSchemaByRole(aclManager: ACLManager, user: User, logger: ts.Logger, context: Context) {
    const query = `roles: ${user.role}`;
    const spaces = await aclManager.findSpaces({ query }, false);
    const fetchViews = spaces.map(space => aclManager.getViewForSpace({ space: space.id }, user));
    const list = await Promise.all(fetchViews);
    const sanatizedList = list.map(view => {
        view.space_endpoint = sanitize(view.space_endpoint);
        return view;
    });

    const types = createTypings(sanatizedList);
    const myResolvers = createResolvers(sanatizedList, logger, context);

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

function createTypings(configs: DataAccessConfig[]) {
    const results: string[] = ['scalar JSON', 'scalar DateTime', Usertype, GeoType];
    const queryEndpoints: string[] = configs.map(config => config.space_endpoint);
    // create individual types
    configs.forEach(config => {
        results.push(`type ${config.space_endpoint} { ${collectAllowedFields(config, queryEndpoints)} }`);
    });
    // create query type
    results.push(
        ` type Query {
                ${queryEndpoints
                    .map(endpoint => `${endpoint}(join: [String], query: String, size: Int, from: Int, sort: String): [${endpoint}!]!`)
                    .join('\n    ')}
            }
        `
    );

    return results;
}

function pick(obj: object = {}, keys: string[]) {
    const results = {};
    keys.forEach(key => {
        if (obj[key] !== null) results[key] = obj[key];
    });
    return results;
}

function collectAllowedFields(config: DataAccessConfig, endpointList: string[]) {
    const {
        view: { excludes = [], includes = [] },
        data_type: { type_config: types, id },
    } = config;
    const results: string[] = [];
    let typeObj = types;
    if (includes.length > 0) {
        typeObj = pick(types, includes);
    }

    for (const key in typeObj) {
        if (!excludes.includes(key)) {
            results.push(` ${key}: ${getMappingValue(typeObj[key], id)} `);
        }
    }

    endpointList.forEach(endpoint =>
        results.push(` ${endpoint}(join: [String], query: String, size: Int, from: Int, sort: String): [${endpoint}] `)
    );

    return results.join(' ');
}

function getMappingValue(type: string, id: string) {
    const results = allTypeMappings[type];
    if (results == null) throw new ts.TSError(`Invalid mapping type "${type}" for data type "${name}"`);
    return results;
}
