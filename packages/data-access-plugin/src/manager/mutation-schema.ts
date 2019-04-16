import * as a from 'apollo-server-express';
import { ManagerContext } from './interfaces';

export const schema = `
    type Mutation {
        createUser(user: CreateUserInput!, password: String!): User!
        updateUser(user: UpdateUserInput!): User!
        updatePassword(id: String!, password: String!): Boolean!
        updateToken(id: String!): String!
        removeUser(id: ID!): Boolean!

        createRole(role: CreateRoleInput!): Role!
        updateRole(role: UpdateRoleInput!): Role!
        removeRole(id: ID!): Boolean!

        createDataType(dataType: CreateDataTypeInput!): DataType!
        updateDataType(dataType: UpdateDataTypeInput!): DataType!
        removeDataType(id: ID!): Boolean!

        createView(view: CreateViewInput!): View!
        updateView(view: UpdateViewInput!): View!
        removeView(id: ID!): Boolean!

        createSpace(space: CreateSpaceInput!): Space!
        updateSpace(space: UpdateSpaceInput!): Space!
        removeSpace(id: ID!): Boolean!
    }
`;

export const resolvers: a.IResolverObject<any, ManagerContext, any> = {
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
