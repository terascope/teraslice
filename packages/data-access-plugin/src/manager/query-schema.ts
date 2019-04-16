import * as ts from '@terascope/utils';
import * as a from 'apollo-server-express';
import { setLoggedInUser } from './utils';
import { ManagerContext } from './interfaces';
import { ModelName } from '@terascope/data-access';

let schema = `
    type Query {
        authenticate(username: String, password: String, token: String): User!
    }
`;

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

    schema += `
        extend type Query {
            ${findOneMethod}(id: ID!): ${model}!
            ${findManyMethod}(query: String): [${model}!]!
        }`;

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

export { schema, resolvers };
