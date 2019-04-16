import * as a from 'apollo-server-express';
import * as ts from '@terascope/utils';
import { ModelName } from '@terascope/data-access';
import { commonViewModel, flattenSchemas } from './misc';
import { ManagerContext } from '../interfaces';

export const baseModel = `client_id: Int
        id: ID!
        created: DateTime!
        updated: DateTime!`;

const schemas = [
    `type Mutation {
        updatePassword(id: String!, password: String!): Boolean!
        updateToken(id: String!): String!
    }`,
    `type DataType {
        ${baseModel}
        name: String
        description: String
        type_config: JSON
    }`,
    `type Role {
        ${baseModel}
        name: String
        description: String
    }`,
    `type Space {
        ${baseModel}
        name: String!
        endpoint: String!
        description: String
        data_type: DataType!
        views: [View]!
        roles: [Role]!
        search_config: SpaceSearchConfig
        streaming_config: SpaceStreamingConfig
    }`,
    `type User {
        ${baseModel}
        username: String!
        firstname: String!
        lastname: String!
        email: String
        role: Role
        type: UserType
        api_token: String
    }`,
    `type View {
        ${baseModel}
        name: String!
        description: String
        data_type: DataType
        roles: [Role]
        ${commonViewModel}
    }`
];

const resolvers: a.IResolverObject<any, ManagerContext, any> = {
    ...mutationForModel('User', ', password: String!'),
    ...mutationForModel('Role'),
    ...mutationForModel('DataType'),
    ...mutationForModel('Space'),
    ...mutationForModel('View'),
    async updatePassword(root, args, ctx) {
        return ctx.manager.updatePassword(args, ctx.user);
    },
    async updateToken(root, args, ctx) {
        return ctx.manager.updateToken(args, ctx.user);
    },
};

function mutationForModel(model: ModelName, createExtraArgs= '') {
    const createMethod = `create${model}`;
    const updateMethod = `update${model}`;
    const removeMethod = `remove${model}`;
    const varName = ts.firstToLower(model);

    schemas.push(`extend type Mutation {
        ${createMethod}(${varName}: Create${model}Input!, ${createExtraArgs}): ${model}!
        ${updateMethod}(${varName}: Update${model}Input!): ${model}!
        ${removeMethod}(id: ID!): Boolean!
    }`);

    async function _create(root: any, args: any, ctx: ManagerContext): Promise<any> {
        return await ctx.manager[createMethod](args, ctx.user);
    }

    async function _update(root: any, args: any, ctx: ManagerContext): Promise<any> {
        return await ctx.manager[updateMethod](args, ctx.user);
    }

    async function _remove(root: any, args: any, ctx: ManagerContext): Promise<any> {
        return await ctx.manager[removeMethod](args, ctx.user);
    }

    return {
        [createMethod]: _create,
        [updateMethod]: _update,
        [removeMethod]: _remove,
    };
}

const schema = flattenSchemas(schemas);

export { schema, resolvers };
