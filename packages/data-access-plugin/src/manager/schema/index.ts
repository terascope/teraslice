import GraphQLJSON from 'graphql-type-json';
import { GraphQLDateTime } from 'graphql-iso-date';
import * as a from 'apollo-server-express';
import * as query from './query';
import * as mutation from './mutation';
import { schema } from './misc';
import { ManagerContext } from '../interfaces';

const resolvers: a.IResolvers<any, ManagerContext> = {
    Query: query.resolvers,
    Mutation: mutation.resolvers,
    JSON: GraphQLJSON,
    DateTime: GraphQLDateTime,
};

export = a.makeExecutableSchema({
    typeDefs: [
        'scalar JSON',
        'scalar DateTime',
        schema,
        query.schema,
        mutation.schema,
    ],
    resolvers,
    inheritResolversFromInterfaces: true,
});
