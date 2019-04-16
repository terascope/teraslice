import * as a from 'apollo-server-express';
import * as ts from '@terascope/utils';
import { ModelName } from '@terascope/data-access';
import { ManagerContext } from '../interfaces';

let schema = `
    type Mutation {
        updatePassword(id: String!, password: String!): Boolean!
        updateToken(id: String!): String!
    }
`;

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

    schema += `
        extend type Mutation {
            ${createMethod}(${varName}: Create${model}Input!, ${createExtraArgs}): ${model}!
            ${updateMethod}(${varName}: Update${model}Input!): ${model}!
            ${removeMethod}(id: ID!): Boolean!
        }`;

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

export { schema, resolvers };
