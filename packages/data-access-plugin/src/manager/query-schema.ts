import * as ts from '@terascope/utils';
import * as a from 'apollo-server-express';
import { setLoggedInUser } from './utils';
import { ManagerContext } from './interfaces';

export const schema = `
    type Query {
        authenticate(username: String, password: String, token: String): User!
        findUser(id: ID!): User!
        findUsers(query: String): [User]!

        findRole(id: ID!): Role!
        findRoles(query: String): [Role]!

        findDataType(id: ID!): DataType!
        findDataTypes(query: String): [DataType]!

        findSpace(id: ID!): Space!
        findSpaces(query: String): [Space]!

        findView(id: ID!): View!
        findViews(query: String): [View]!
    }
`;

export const resolvers: a.IResolverObject<any, ManagerContext, any> = {
    async authenticate(root, args, ctx) {
        const user = await ctx.manager.authenticate(args);
        setLoggedInUser(ctx.req, user);
        ctx.user = user;
        return user;
    },
    async findUser(parent, args, ctx) {
        const id = getQueryId(parent, args);
        return ctx.manager.findUser({ id }, ctx.user);
    },
    async findUsers(root, args, ctx) {
        return ctx.manager.findUsers(args, ctx.user);
    },
    async findRole(parent, args, ctx) {
        const id = getQueryId(parent, args);
        return ctx.manager.findRole({ id }, ctx.user);
    },
    async findRoles(root, args, ctx) {
        return ctx.manager.findRoles(args, ctx.user);
    },
    async findDataType(parent, args, ctx) {
        const id = getQueryId(parent, args);
        return ctx.manager.findDataType({ id }, ctx.user);
    },
    async findDataTypes(root, args, ctx) {
        return ctx.manager.findDataTypes(args, ctx.user);
    },
    async findSpace(parent, args, ctx) {
        const id = getQueryId(parent, args);
        return ctx.manager.findSpace({ id }, ctx.user);
    },
    async findSpaces(root, args, ctx) {
        return ctx.manager.findSpaces(args, ctx.user);
    },
    async findView(parent, args, ctx) {
        const id = getQueryId(parent, args);
        return ctx.manager.findView({ id }, ctx.user);
    },
    async findViews(root, args, ctx) {
        return ctx.manager.findViews(args, ctx.user);
    },
};

function getQueryId(parent: any, args: any): string {
    return getId(args) || getId(parent)!;
}

function getId(input: any): string|undefined {
    return ts.get(input, 'id', ts.isString(input) && input) || undefined;
}
