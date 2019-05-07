
import Usertype from './types/user';
import { createResolvers } from './resolvers';
import { makeExecutableSchema } from 'apollo-server-express';
import { ACLManager, User, DataAccessConfig } from '@terascope/data-access';
import { Context } from '@terascope/job-components';

import _ from 'lodash';
import * as ts from '@terascope/utils';
import allTypeMappings from './typeMappings';

// TODO: check for roleId undefined
// TODO: respect prevent_prefix_wildcard
export default async function getSchemaByRole(aclManager: ACLManager, user: User, logger: ts.Logger, context: Context) {
    const query = `roles: ${user.role}`;
    const spaces = await aclManager.findSpaces({ query }, false);
    const fetchViews = spaces.map(space => aclManager.getViewForSpace({ space: space.id }, user));
    const list = await Promise.all(fetchViews);
    const types = createTypings(list);
    const myResolvers = createResolvers(list, logger, context);

    const schema = makeExecutableSchema({
        typeDefs: types,
        resolvers: myResolvers,
        inheritResolversFromInterfaces: true,
    });

    return schema;
}

function createTypings(configs: DataAccessConfig[]) {
    const results: string[] = ['scalar JSON', 'scalar DateTime', Usertype];
    const queryEndpoints: string[] = configs.map(config => config.endpoint);
    // create individual types
    configs.forEach((config) => {
        const otherEndpoints = queryEndpoints.filter(endpoint => endpoint !== config.endpoint);
        results.push(`type ${config.endpoint} { ${collectAllowedFields(config, otherEndpoints)} }`);
    });
    // create query type
    results.push(
        ` type Query {
                ${queryEndpoints.map((endpoint) => `${endpoint}(join: [String], query: String, size: Int, from: Int, sort: String): [${endpoint}!]!`).join('\n    ')}
            }
        `);

    return results;
}

function collectAllowedFields(config: DataAccessConfig, endpointList: string[]) {
    const { view: { excludes = [], includes = [] }, data_type: { type_config: types, id } } = config;
    const results: string[] = [];
    let typeObj = types;
    if (includes.length > 0) {
        // @ts-ignore
        typeObj = _.pick(types, includes);
    }

    for (const key in typeObj) {
        if (!excludes.includes(key)) {
            results.push(` ${key}: ${getMappingValue(typeObj[key], id)} `);
        }
    }

    endpointList.forEach(endpoint => results.push(` ${endpoint}(join: [String], query: String, size: Int, from: Int, sort: String): [${endpoint}] `));

    return results.join(' ');
}

function getMappingValue(type: string, id: string) {
    const results = allTypeMappings[type];
    if (results == null) throw new ts.TSError(`could not convert mapping type: ${type} from data_type id: ${id}`);
    return results;
}
