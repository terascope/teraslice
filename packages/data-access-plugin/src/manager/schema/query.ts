import * as ts from '@terascope/utils';
import * as a from 'apollo-server-express';
import { flattenSchemas, commonViewModel } from './misc';
import { setLoggedInUser } from '../utils';
import { ManagerContext } from '../interfaces';
import { ModelName } from '@terascope/data-access';

const schemas = [
    `type Query {
        authenticate(username: String, password: String, token: String): User!
    }`,
    `input CreateRoleInput {
        client_id: Int
        name: String!
        description: String
    }`,
    `input UpdateRoleInput {
        client_id: Int
        id: ID!
        name: String
        description: String
    }`,
    `input CreateDataTypeInput {
        client_id: Int!
        name: String!
        description: String
        type_config: JSON
    }`,
    `input UpdateDataTypeInput {
        client_id: Int
        id: ID!
        name: String
        description: String
        type_config: JSON
    }`,
    `input CreateSpaceInput {
        client_id: Int!
        name: String!
        endpoint: String!
        description: String
        data_type: ID!
        views: [ID!]
        roles: [ID!]
        search_config: SpaceSearchConfigInput
        streaming_config: SpaceStreamingConfigInput
    }`,
    `input UpdateSpaceInput {
        client_id: Int
        id: ID!
        name: String
        endpoint: String
        description: String
        data_type: String
        views: [ID!]
        roles: [ID!]
        search_config: SpaceSearchConfigInput
        streaming_config: SpaceStreamingConfigInput
    }`,
    `input CreateUserInput {
        client_id: Int
        username: String!
        firstname: String!
        lastname: String!
        email: String
        type: UserType
        role: ID
    }`,
    `input UpdateUserInput {
        client_id: Int
        id: ID!
        username: String
        firstname: String
        lastname: String
        email: String
        type: UserType
        role: ID
    }`,
    `input CreateViewInput {
        client_id: Int
        name: String!
        description: String
        data_type: ID!
        roles: [ID]
        ${commonViewModel}
    }`,
    `input UpdateViewInput {
        client_id: Int
        id: ID!
        name: String
        description: String
        data_type: ID
        roles: [ID]
        ${commonViewModel}
    }`
];

const resolvers: a.IResolverObject<any, ManagerContext, any> = {
    ...queryForModel('User'),
    ...queryForModel('Role'),
    ...queryForModel('DataType'),
    ...queryForModel('Space'),
    ...queryForModel('View'),
    async authenticate(root, args, ctx) {
        const user = await ctx.manager.authenticate(args);
        setLoggedInUser(ctx.req, user);
        ctx.user = user;
        return user;
    },
};

function getQueryId(parent: any, args: any): string {
    return getId(args) || getId(parent)!;
}

function getId(input: any): string|undefined {
    return ts.get(input, 'id', ts.isString(input) && input) || undefined;
}

function queryForModel(model: ModelName) {
    const findOneMethod = `find${model}`;
    const findManyMethod = `find${model}s`;

    schemas.push(`extend type Query {
        ${findOneMethod}(id: ID!): ${model}!
        ${findManyMethod}(query: String): [${model}!]!
    }`);

    async function _findOne(parent: any, args: any, ctx: ManagerContext): Promise<any> {
        const id = getQueryId(parent, args);
        try {
            return await ctx.manager[findOneMethod]({ id }, ctx.user);
        } catch (err) {
            if (err.statusCode === 404) {
                return null;
            }
            throw err;
        }
    }

    async function _findMany(root: any, args: any, ctx: ManagerContext): Promise<any> {
        return await ctx.manager[findManyMethod](args, ctx.user);
    }

    return {
        [findOneMethod]: _findOne,
        [findManyMethod]: _findMany
    };
}

const schema = flattenSchemas(schemas);
export { schema, resolvers };
