import GraphQLJSON from 'graphql-type-json';
import { GraphQLDateTime } from 'graphql-iso-date';
import * as ts from '@terascope/utils';
import * as a from 'apollo-server-express';
import * as d from '@terascope/data-access';
import { setLoggedInUser } from './utils';
import { ManagerContext } from './interfaces';

const queryResolvers: a.IResolverObject<any, ManagerContext, any> = {
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

const mutationResolvers: a.IResolverObject<any, ManagerContext, any> = {
    async createUser(root, args, ctx) {
        return ctx.manager.createUser(args, ctx.user);
    },
    async updateUser(root, args, ctx) {
        return ctx.manager.updateUser(args, ctx.user);
    },
    async updatePassword(root, args, ctx) {
        return ctx.manager.updatePassword(args, ctx.user);
    },
    async updateToken(root, args, ctx) {
        return ctx.manager.updateToken(args, ctx.user);
    },
    async removeUser(root, args, ctx) {
        return ctx.manager.removeUser(args, ctx.user);
    },
    async createRole(root, args, ctx) {
        return ctx.manager.createRole(args, ctx.user);
    },
    async updateRole(root, args, ctx) {
        return ctx.manager.updateRole(args, ctx.user);
    },
    async removeRole(root, args, ctx) {
        return ctx.manager.removeRole(args, ctx.user);
    },
    async createDataType(root, args, ctx) {
        return ctx.manager.createDataType(args, ctx.user);
    },
    async updateDataType(root, args, ctx) {
        return ctx.manager.updateDataType(args, ctx.user);
    },
    async removeDataType(root, args, ctx) {
        return ctx.manager.removeDataType(args, ctx.user);
    },
    async createSpace(root, args, ctx) {
        return ctx.manager.createSpace(args, ctx.user);
    },
    async updateSpace(root, args, ctx) {
        return ctx.manager.updateSpace(args, ctx.user);
    },
    async removeSpace(root, args, ctx) {
        return ctx.manager.removeSpace(args, ctx.user);
    },
    async createView(root, args, ctx) {
        return ctx.manager.createView(args, ctx.user);
    },
    async updateView(root, args, ctx) {
        return ctx.manager.updateView(args, ctx.user);
    },
    async removeView(root, args, ctx) {
        return ctx.manager.removeView(args, ctx.user);
    },
};

const resolvers: a.IResolvers<any, ManagerContext> = {
    Query: queryResolvers,
    Mutation: mutationResolvers,
    JSON: GraphQLJSON,
    DateTime: GraphQLDateTime,
};

export = a.makeExecutableSchema({
    typeDefs: [
        'scalar JSON',
        'scalar DateTime',
        ...d.graphqlSchemas
    ],
    resolvers,
    inheritResolversFromInterfaces: true,
});
